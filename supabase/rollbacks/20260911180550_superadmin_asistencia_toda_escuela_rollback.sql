-- Restaurar la definicion de produccion anterior a esta migracion.
CREATE OR REPLACE FUNCTION public.rpc_cargar_asistencia_asisport(p_fecha date, p_cancha_id uuid DEFAULT NULL::uuid, p_horario_id uuid DEFAULT NULL::uuid, p_entrenador_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_rol varchar;
  v_user_sucursal_id uuid;
  v_activo boolean;
  v_target_entrenador_id uuid;
  v_candidatos jsonb;
  v_asistencias jsonb;
  v_total_asistencias_fecha integer;
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

  IF v_rol IN ('SuperAdministrador', 'Administrador', 'Asistente') THEN
    v_target_entrenador_id := COALESCE(p_entrenador_id, v_user_id);
  ELSE
    v_target_entrenador_id := v_user_id;
  END IF;

  WITH candidatos AS (
    SELECT
      a.id,
      a.nombres,
      a.apellidos,
      a.foto_url,
      a.es_arquero,
      a.estado,
      a.cancha_id,
      a.horario_id,
      a.fecha_nacimiento,
      g.nombre AS cancha_nombre,
      h.hora AS horario_hora
    FROM public.alumnos a
    LEFT JOIN public.grupos g ON g.id = a.cancha_id
    LEFT JOIN public.horarios h ON h.id = a.horario_id
    WHERE a.escuela_id = v_escuela_id
      AND a.archivado IS FALSE
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND (
        (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE)
        OR (v_rol <> 'Entrenarqueros' AND (
             a.profesor_asignado_id = v_target_entrenador_id
             OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_target_entrenador_id)
           ))
      )
      AND (
        v_rol IN ('SuperAdministrador', 'Entrenador')
        OR v_user_sucursal_id IS NULL
        OR a.sucursal_id IS NULL
        OR a.sucursal_id = v_user_sucursal_id
      )
      AND (p_cancha_id IS NULL OR a.cancha_id = p_cancha_id)
      AND (p_horario_id IS NULL OR a.horario_id = p_horario_id)
    ORDER BY a.apellidos ASC, a.nombres ASC, a.id ASC
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'nombres', c.nombres,
      'apellidos', c.apellidos,
      'foto_url', c.foto_url,
      'es_arquero', c.es_arquero,
      'estado', c.estado,
      'cancha_id', c.cancha_id,
      'horario_id', c.horario_id,
      'fecha_nacimiento', c.fecha_nacimiento,
      'cancha', jsonb_build_object('id', c.cancha_id, 'nombre', COALESCE(c.cancha_nombre, '')),
      'horario', jsonb_build_object('id', c.horario_id, 'hora', COALESCE(c.horario_hora, ''))
    )
  ), '[]'::jsonb)
  INTO v_candidatos
  FROM candidatos c;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', an.id,
      'alumno_id', an.alumno_id,
      'fecha', an.fecha,
      'estado', an.estado,
      'entrenador_id', an.entrenador_id,
      'entrenador', jsonb_build_object(
        'id', u.id,
        'nombres', u.nombres,
        'apellidos', u.apellidos,
        'rol', u.rol
      )
    )
  ), '[]'::jsonb)
  INTO v_asistencias
  FROM public.asistencias_normales an
  JOIN public.alumnos a ON a.id = an.alumno_id
  LEFT JOIN public.usuarios u ON u.id = an.entrenador_id
  WHERE a.escuela_id = v_escuela_id
    AND an.fecha = p_fecha
    AND (
      p_cancha_id IS NULL
      OR a.cancha_id = p_cancha_id
    )
    AND (
      p_horario_id IS NULL
      OR a.horario_id = p_horario_id
    );

  SELECT COUNT(*)
  INTO v_total_asistencias_fecha
  FROM public.asistencias_normales an
  JOIN public.alumnos a ON a.id = an.alumno_id
  WHERE a.escuela_id = v_escuela_id
    AND an.fecha = p_fecha
    AND (p_cancha_id IS NULL OR a.cancha_id = p_cancha_id)
    AND (p_horario_id IS NULL OR a.horario_id = p_horario_id)
    AND (v_target_entrenador_id IS NULL OR an.entrenador_id = v_target_entrenador_id);

  RETURN jsonb_build_object(
    'candidatos', v_candidatos,
    'asistencias_existentes', v_asistencias,
    'estado_envio', jsonb_build_object(
      'existe', (v_total_asistencias_fecha > 0),
      'cantidad', v_total_asistencias_fecha
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_cargar_asistencia_asisport(date, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cargar_asistencia_asisport(date, uuid, uuid, uuid) TO authenticated;
