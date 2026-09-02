-- ==============================================================================
-- MIGRACIÓN: PORCENTAJE DE ASISTENCIA CALCULADO SOBRE ALUMNOS INSCRITOS
-- Fecha: 2026-09-02
-- Descripción:
--   Calcula el porcentaje de asistencia dividiendo los alumnos presentes
--   entre el universo de alumnos inscritos en el grupo multiplicado por las
--   sesiones/días evaluados en el rango: (presentes / (total_inscritos * dias)) * 100.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_resumen_estadisticas_asisport(
  p_gestion_id uuid DEFAULT NULL,
  p_fecha_desde date DEFAULT NULL,
  p_fecha_hasta date DEFAULT NULL,
  p_entrenador_ids uuid[] DEFAULT NULL,
  p_cancha_ids uuid[] DEFAULT NULL,
  p_horario_ids uuid[] DEFAULT NULL,
  p_dias text[] DEFAULT NULL,
  p_alumno_id uuid DEFAULT NULL
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
  v_zona_horaria varchar;

  v_gestion_info jsonb;
  v_resumen jsonb;
  v_serie_diaria jsonb;
  v_facetas jsonb;
  v_alumno_seleccionado jsonb;
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

  IF v_rol NOT IN ('SuperAdministrador', 'Administrador', 'Asistente') THEN
    RAISE EXCEPTION 'Acceso denegado a estadísticas para el rol %', v_rol;
  END IF;

  SELECT COALESCE(e.zona_horaria, 'America/La_Paz')
  INTO v_zona_horaria
  FROM public.escuelas e
  WHERE e.id = v_escuela_id;

  IF p_gestion_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', g.id,
      'anio', g.anio,
      'estado', g.estado
    ) INTO v_gestion_info
    FROM public.gestiones_deportivas g
    WHERE g.id = p_gestion_id AND g.escuela_id = v_escuela_id;
  ELSE
    SELECT jsonb_build_object(
      'id', g.id,
      'anio', g.anio,
      'estado', g.estado
    ) INTO v_gestion_info
    FROM public.gestiones_deportivas g
    WHERE g.escuela_id = v_escuela_id AND g.estado = 'activa'
    LIMIT 1;
  END IF;

  WITH base_asistencias AS (
    SELECT
      v.id,
      v.alumno_id,
      v.fecha,
      v.estado,
      v.entrenador_id,
      v.cancha_id,
      v.horario_id,
      v.sucursal_id,
      v.gestion_id,
      v.origen,
      a.nombres AS alumno_nombres,
      a.apellidos AS alumno_apellidos,
      a.profesor_asignado_id,
      CASE EXTRACT(ISODOW FROM v.fecha)
        WHEN 1 THEN 'lunes'
        WHEN 2 THEN 'martes'
        WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves'
        WHEN 5 THEN 'viernes'
        WHEN 6 THEN 'sabado'
        WHEN 7 THEN 'domingo'
      END AS dia_semana
    FROM public.v_asistencias_gestion_efectiva v
    JOIN public.alumnos a ON a.id = v.alumno_id
    WHERE v.escuela_id = v_escuela_id
      AND (
        v_rol = 'SuperAdministrador'
        OR v_user_sucursal_id IS NULL
        OR v.sucursal_id IS NULL
        OR v.sucursal_id = v_user_sucursal_id
      )
      AND (p_gestion_id IS NULL OR v.gestion_id = p_gestion_id)
      AND (p_fecha_desde IS NULL OR v.fecha >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR v.fecha <= p_fecha_hasta)
      AND (
        p_entrenador_ids IS NULL
        OR v.entrenador_id = ANY(p_entrenador_ids)
        OR a.profesor_asignado_id = ANY(p_entrenador_ids)
      )
      AND (p_cancha_ids IS NULL OR v.cancha_id = ANY(p_cancha_ids))
      AND (p_horario_ids IS NULL OR v.horario_id = ANY(p_horario_ids))
      AND (p_alumno_id IS NULL OR v.alumno_id = p_alumno_id)
  ),
  filtradas_por_dia AS (
    SELECT b.*
    FROM base_asistencias b
    WHERE (
      p_dias IS NULL
      OR array_length(p_dias, 1) IS NULL
      OR b.dia_semana = ANY(
        ARRAY(
          SELECT public.unaccent(LOWER(d))
          FROM unnest(p_dias) AS d
        )
      )
    )
  ),
  totales_resumen AS (
    SELECT
      COUNT(*) AS total_registros,
      COUNT(*) FILTER (WHERE estado = 'Presente') AS presentes,
      COUNT(*) FILTER (WHERE estado = 'Licencia') AS licencias,
      COUNT(*) FILTER (WHERE estado = 'Ausente') AS ausentes,
      COUNT(DISTINCT alumno_id) AS total_alumnos_unicos,
      COUNT(DISTINCT fecha) AS total_dias_sesion
    FROM filtradas_por_dia
  ),
  alumnos_en_alcance AS (
    SELECT COUNT(DISTINCT a.id) AS total_alumnos_inscritos
    FROM public.alumnos a
    WHERE a.escuela_id = v_escuela_id
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND a.archivado IS FALSE
      AND (
        v_rol = 'SuperAdministrador'
        OR v_user_sucursal_id IS NULL
        OR a.sucursal_id IS NULL
        OR a.sucursal_id = v_user_sucursal_id
      )
      AND (
        p_entrenador_ids IS NULL
        OR a.profesor_asignado_id = ANY(p_entrenador_ids)
        OR EXISTS (
          SELECT 1 FROM public.alumnos_entrenadores ae 
          WHERE ae.alumno_id = a.id AND ae.entrenador_id = ANY(p_entrenador_ids)
        )
      )
      AND (
        p_cancha_ids IS NULL
        OR a.cancha_id = ANY(p_cancha_ids)
        OR a.grupo_id = ANY(p_cancha_ids)
      )
      AND (p_alumno_id IS NULL OR a.id = p_alumno_id)
  ),
  serie_agrupada AS (
    SELECT
      fecha,
      CASE EXTRACT(ISODOW FROM fecha)
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo'
      END AS dia_nombre,
      COUNT(*) FILTER (WHERE estado = 'Presente') AS presentes,
      COUNT(*) FILTER (WHERE estado = 'Licencia') AS licencias,
      COUNT(*) FILTER (WHERE estado = 'Ausente') AS ausentes,
      COUNT(*) AS total
    FROM filtradas_por_dia
    GROUP BY fecha
    ORDER BY fecha ASC
  )
  SELECT
    jsonb_build_object(
      'total_registros', COALESCE(tr.total_registros, 0),
      'total_alumnos', COALESCE(aea.total_alumnos_inscritos, 0),
      'presentes', COALESCE(tr.presentes, 0),
      'licencias', COALESCE(tr.licencias, 0),
      'ausentes', COALESCE(tr.ausentes, 0),
      'total_alumnos_unicos', COALESCE(tr.total_alumnos_unicos, 0),
      'porcentaje_asistencia', CASE
        WHEN COALESCE(aea.total_alumnos_inscritos, 0) > 0 AND COALESCE(tr.total_dias_sesion, 0) > 0
        THEN ROUND((tr.presentes::numeric * 100.0) / (aea.total_alumnos_inscritos * tr.total_dias_sesion)::numeric, 1)
        ELSE 0.0
      END
    ),
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'fecha', sa.fecha,
        'dia_nombre', sa.dia_nombre,
        'presentes', sa.presentes,
        'licencias', sa.licencias,
        'ausentes', sa.ausentes,
        'total', sa.total
      ) ORDER BY sa.fecha ASC
    ) FILTER (WHERE sa.fecha IS NOT NULL), '[]'::jsonb),
    CASE
      WHEN p_alumno_id IS NULL THEN NULL
      ELSE (
        SELECT jsonb_build_object(
          'id', a.id,
          'nombres', a.nombres,
          'apellidos', a.apellidos,
          'presentes', (SELECT COUNT(*) FROM filtradas_por_dia f WHERE f.alumno_id = a.id AND f.estado = 'Presente'),
          'licencias', (SELECT COUNT(*) FROM filtradas_por_dia f WHERE f.alumno_id = a.id AND f.estado = 'Licencia'),
          'ausentes', (SELECT COUNT(*) FROM filtradas_por_dia f WHERE f.alumno_id = a.id AND f.estado = 'Ausente'),
          'registros', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', fpd.id,
                'fecha', fpd.fecha,
                'estado', fpd.estado,
                'entrenador_id', fpd.entrenador_id,
                'entrenador_nombre', TRIM(COALESCE(u.nombres, '') || ' ' || COALESCE(u.apellidos, '')),
                'entrenador_rol', u.rol
              ) ORDER BY fpd.fecha ASC, fpd.id ASC
            )
            FROM filtradas_por_dia fpd
            LEFT JOIN public.usuarios u ON u.id = fpd.entrenador_id
            WHERE fpd.alumno_id = a.id
          ), '[]'::jsonb)
        )
        FROM public.alumnos a
        WHERE a.id = p_alumno_id
      )
    END
  INTO v_resumen, v_serie_diaria, v_alumno_seleccionado
  FROM totales_resumen tr
  CROSS JOIN alumnos_en_alcance aea
  LEFT JOIN serie_agrupada sa ON true
  GROUP BY tr.total_registros, aea.total_alumnos_inscritos, tr.presentes, tr.licencias, tr.ausentes, tr.total_alumnos_unicos, tr.total_dias_sesion;

  RETURN jsonb_build_object(
    'resumen', COALESCE(v_resumen, jsonb_build_object('total_registros', 0, 'total_alumnos', 0, 'presentes', 0, 'licencias', 0, 'ausentes', 0, 'porcentaje_asistencia', 0.0, 'total_alumnos_unicos', 0)),
    'serie_diaria', COALESCE(v_serie_diaria, '[]'::jsonb),
    'gestion', v_gestion_info,
    'alumno_seleccionado', v_alumno_seleccionado
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) TO authenticated;
