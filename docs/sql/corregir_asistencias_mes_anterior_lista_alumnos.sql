-- Corrección preparada para rpc_listar_alumnos_asisport(jsonb).
-- Cuenta Presente y Licencia como SaaSport; conserva permisos y filtros.
-- Ejecutar en una transacción mediante una migración tras autorizar producción.
DO $patch$
DECLARE
  definition text;
  old_count text := $old$      COALESCE((
        SELECT COUNT(*)::integer
        FROM public.asistencias_normales an
        WHERE an.alumno_id = f.id
          AND an.estado = 'Presente'
          AND an.fecha >= date_trunc('month', timezone(v_zona_horaria, now())::date)::date
      ), 0) AS asistencias_mes_actual$old$;
  new_count text := $new$      COALESCE((
        SELECT COUNT(*)::integer
        FROM public.asistencias_normales an
        WHERE an.alumno_id = f.id
          AND an.estado IN ('Presente', 'Licencia')
          AND an.fecha >= date_trunc('month', timezone(v_zona_horaria, now())::date)::date
          AND an.fecha < (date_trunc('month', timezone(v_zona_horaria, now())::date) + interval '1 month')::date
      ), 0) AS asistencias_mes_actual,
      COALESCE((
        SELECT COUNT(*)::integer
        FROM public.asistencias_normales an
        WHERE an.alumno_id = f.id
          AND an.estado IN ('Presente', 'Licencia')
          AND an.fecha >= (date_trunc('month', timezone(v_zona_horaria, now())::date) - interval '1 month')::date
          AND an.fecha < date_trunc('month', timezone(v_zona_horaria, now())::date)::date
      ), 0) AS asistencias_mes_anterior$new$;
  old_json text := $old$        'asistencias_mes_actual', pi.asistencias_mes_actual$old$;
  new_json text := $new$        'asistencias_mes_actual', pi.asistencias_mes_actual,
        'asistencias_mes_anterior', pi.asistencias_mes_anterior$new$;
BEGIN
  SELECT pg_get_functiondef('public.rpc_listar_alumnos_asisport(jsonb)'::regprocedure)
    INTO definition;
  IF strpos(definition, old_count) = 0 OR strpos(definition, old_json) = 0
     OR strpos(definition, 'AS asistencias_mes_anterior') > 0 THEN
    RAISE EXCEPTION 'La función cambió: revisar antes de aplicar la corrección';
  END IF;
  definition := replace(replace(definition, old_count, new_count), old_json, new_json);
  EXECUTE definition;
END;
$patch$;
