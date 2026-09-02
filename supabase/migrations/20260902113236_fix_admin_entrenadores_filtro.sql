-- ==============================================================================
-- MIGRACIÓN: FIX FILTRO DE ENTRENADORES Y GRUPOS CON SECURITY DEFINER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_catalogos_asisport(
  p_sucursal_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_rol varchar;
  v_user_sucursal_id uuid;
  v_activo boolean;
  v_sucursal_efectiva uuid;
  v_gestiones jsonb;
  v_entrenadores jsonb;
  v_canchas jsonb;
  v_horarios jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sesión no autenticada';
  END IF;

  SELECT u.escuela_id, u.rol, u.sucursal_id, u.activo
  INTO v_escuela_id, v_rol, v_user_sucursal_id, v_activo
  FROM public.usuarios u
  WHERE u.id = v_user_id;

  IF v_activo IS NOT TRUE OR v_escuela_id IS NULL THEN
    RAISE EXCEPTION 'Usuario inactivo o sin escuela asociada';
  END IF;

  -- Determinación de sucursal efectiva
  IF v_rol IN ('Administrador', 'Asistente') AND v_user_sucursal_id IS NOT NULL THEN
    v_sucursal_efectiva := v_user_sucursal_id;
  ELSIF p_sucursal_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.sucursales s WHERE s.id = p_sucursal_id AND s.escuela_id = v_escuela_id) THEN
      v_sucursal_efectiva := p_sucursal_id;
    END IF;
  END IF;

  -- 1. Gestiones de la escuela
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'anio', g.anio,
      'estado', g.estado,
      'es_activa', (g.estado = 'activa')
    ) ORDER BY g.anio DESC
  ), '[]'::jsonb)
  INTO v_gestiones
  FROM public.gestiones_deportivas g
  WHERE g.escuela_id = v_escuela_id;

  -- 2. Entrenadores autorizados
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'value', u.id,
      'label', (u.nombres || ' ' || u.apellidos),
      'nombres', u.nombres,
      'apellidos', u.apellidos,
      'rol', u.rol,
      'sucursal_id', u.sucursal_id
    ) ORDER BY u.nombres, u.apellidos
  ), '[]'::jsonb)
  INTO v_entrenadores
  FROM public.usuarios u
  WHERE u.escuela_id = v_escuela_id
    AND u.activo IS TRUE
    AND u.rol IN ('Entrenador', 'Entrenarqueros')
    AND (v_sucursal_efectiva IS NULL OR u.sucursal_id IS NULL OR u.sucursal_id = v_sucursal_efectiva);

  -- 3. Canchas / Grupos autorizados
  IF v_rol IN ('Entrenador', 'Entrenarqueros') THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'value', g.id,
        'label', g.nombre,
        'nombre', g.nombre,
        'sucursal_id', g.sucursal_id
      ) ORDER BY g.nombre
    ), '[]'::jsonb)
    INTO v_canchas
    FROM public.grupos g
    WHERE g.escuela_id = v_escuela_id
      AND (v_sucursal_efectiva IS NULL OR g.sucursal_id IS NULL OR g.sucursal_id = v_sucursal_efectiva)
      AND (
        EXISTS (
          SELECT 1 FROM public.alumnos a 
          WHERE (a.grupo_id = g.id OR a.cancha_id = g.id)
            AND (a.profesor_asignado_id = v_user_id 
                 OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id))
            AND a.estado <> 'ELIMINADO SISTEMA' 
            AND a.archivado IS FALSE
        )
        OR EXISTS (
          SELECT 1 FROM public.entrenadores_grupos eg 
          JOIN public.grupos_gestion gg ON gg.id = eg.grupo_gestion_id
          WHERE gg.grupo_id = g.id AND eg.entrenador_id = v_user_id AND eg.estado = 'activa'
        )
      );
  ELSE
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'value', g.id,
        'label', g.nombre,
        'nombre', g.nombre,
        'sucursal_id', g.sucursal_id
      ) ORDER BY g.nombre
    ), '[]'::jsonb)
    INTO v_canchas
    FROM public.grupos g
    WHERE g.escuela_id = v_escuela_id
      AND (v_sucursal_efectiva IS NULL OR g.sucursal_id IS NULL OR g.sucursal_id = v_sucursal_efectiva);
  END IF;

  -- 4. Horarios autorizados (corregido: horarios no tiene columna dias)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'value', h.id,
      'label', h.hora,
      'hora', h.hora
    ) ORDER BY h.hora
  ), '[]'::jsonb)
  INTO v_horarios
  FROM public.horarios h
  WHERE h.escuela_id = v_escuela_id
    AND h.activo IS TRUE;

  RETURN jsonb_build_object(
    'gestiones', v_gestiones,
    'entrenadores', v_entrenadores,
    'canchas', v_canchas,
    'horarios', v_horarios,
    'sucursal_efectiva', v_sucursal_efectiva
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_catalogos_asisport(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_catalogos_asisport(uuid) TO authenticated;
