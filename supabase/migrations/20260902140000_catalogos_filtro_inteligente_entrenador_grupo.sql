-- ==============================================================================
-- MIGRACIÓN: FILTROS INTELIGENTES BIDIRECCIONALES (ENTRENADOR <-> GRUPO)
-- Fecha: 2026-09-02
-- Descripción: Agrega grupo_ids a cada entrenador y entrenador_ids a cada cancha
--              en rpc_catalogos_asisport para permitir filtrado cruzado instantáneo.
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

  -- 2. CTE de relaciones vigentes entre entrenador y grupo dentro de la escuela
  -- Se consideran asignaciones directas en entrenadores_grupos y vinculaciones de alumnos activos
  WITH relaciones_base AS (
    SELECT DISTINCT
      eg.entrenador_id,
      gg.grupo_id
    FROM public.entrenadores_grupos eg
    JOIN public.grupos_gestion gg ON gg.id = eg.grupo_gestion_id
    WHERE eg.escuela_id = v_escuela_id
      AND eg.estado = 'activa'

    UNION

    SELECT DISTINCT
      COALESCE(ae.entrenador_id, a.profesor_asignado_id) AS entrenador_id,
      COALESCE(a.grupo_id, a.cancha_id) AS grupo_id
    FROM public.alumnos a
    LEFT JOIN public.alumnos_entrenadores ae ON ae.alumno_id = a.id
    WHERE a.escuela_id = v_escuela_id
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND a.archivado IS FALSE
      AND COALESCE(ae.entrenador_id, a.profesor_asignado_id) IS NOT NULL
      AND COALESCE(a.grupo_id, a.cancha_id) IS NOT NULL
  )
  -- 3. Entrenadores autorizados con sus respectivos grupo_ids
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'value', u.id,
      'label', (u.nombres || ' ' || u.apellidos),
      'nombres', u.nombres,
      'apellidos', u.apellidos,
      'rol', u.rol,
      'sucursal_id', u.sucursal_id,
      'grupo_ids', COALESCE((
        SELECT jsonb_agg(DISTINCT r.grupo_id)
        FROM relaciones_base r
        WHERE r.entrenador_id = u.id
      ), '[]'::jsonb)
    ) ORDER BY u.nombres, u.apellidos
  ), '[]'::jsonb)
  INTO v_entrenadores
  FROM public.usuarios u
  WHERE (
    CASE 
      WHEN v_rol IN ('Entrenador', 'Entrenarqueros') THEN u.id = v_user_id
      ELSE u.escuela_id = v_escuela_id
           AND u.activo IS TRUE
           AND u.rol IN ('Entrenador', 'Entrenarqueros')
           AND (v_sucursal_efectiva IS NULL OR u.sucursal_id IS NULL OR u.sucursal_id = v_sucursal_efectiva)
    END
  );

  -- 4. Canchas / Grupos autorizados con sus respectivos entrenador_ids
  WITH relaciones_base AS (
    SELECT DISTINCT
      eg.entrenador_id,
      gg.grupo_id
    FROM public.entrenadores_grupos eg
    JOIN public.grupos_gestion gg ON gg.id = eg.grupo_gestion_id
    WHERE eg.escuela_id = v_escuela_id
      AND eg.estado = 'activa'

    UNION

    SELECT DISTINCT
      COALESCE(ae.entrenador_id, a.profesor_asignado_id) AS entrenador_id,
      COALESCE(a.grupo_id, a.cancha_id) AS grupo_id
    FROM public.alumnos a
    LEFT JOIN public.alumnos_entrenadores ae ON ae.alumno_id = a.id
    WHERE a.escuela_id = v_escuela_id
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND a.archivado IS FALSE
      AND COALESCE(ae.entrenador_id, a.profesor_asignado_id) IS NOT NULL
      AND COALESCE(a.grupo_id, a.cancha_id) IS NOT NULL
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'value', g.id,
      'label', g.nombre,
      'nombre', g.nombre,
      'sucursal_id', g.sucursal_id,
      'entrenador_ids', COALESCE((
        SELECT jsonb_agg(DISTINCT r.entrenador_id)
        FROM relaciones_base r
        WHERE r.grupo_id = g.id
      ), '[]'::jsonb)
    ) ORDER BY g.nombre
  ), '[]'::jsonb)
  INTO v_canchas
  FROM public.grupos g
  WHERE g.escuela_id = v_escuela_id
    AND g.activo IS TRUE
    AND (v_sucursal_efectiva IS NULL OR g.sucursal_id IS NULL OR g.sucursal_id = v_sucursal_efectiva)
    AND (
      v_rol NOT IN ('Entrenador', 'Entrenarqueros')
      OR EXISTS (
        SELECT 1 FROM relaciones_base rb
        WHERE rb.grupo_id = g.id AND rb.entrenador_id = v_user_id
      )
    );

  -- 5. Horarios autorizados
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

-- Permisos
REVOKE ALL ON FUNCTION public.rpc_catalogos_asisport(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_catalogos_asisport(uuid) TO authenticated;
