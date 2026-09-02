-- ==============================================================================
-- MIGRACIÓN 2: OPTIMIZACIÓN DE ESTADÍSTICAS Y CONSULTAS SECUNDARIAS DE ASISPORT
-- Archivo: 20260902132405_optimizacion_estadisticas_consultas_secundarias.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: rpc_resumen_estadisticas_asisport
--    Métricas, serie diaria y alumno seleccionado sin agregaciones cliente
-- ------------------------------------------------------------------------------
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
SECURITY INVOKER
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

  -- Estadísticas está restringido a SuperAdministrador, Administrador y Asistente
  IF v_rol NOT IN ('SuperAdministrador', 'Administrador', 'Asistente') THEN
    RAISE EXCEPTION 'Acceso denegado a estadísticas para el rol %', v_rol;
  END IF;

  SELECT COALESCE(e.zona_horaria, 'America/La_Paz')
  INTO v_zona_horaria
  FROM public.escuelas e
  WHERE e.id = v_escuela_id;

  -- Información de la gestión seleccionada o activa
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

  -- Consulta principal utilizando la vista de gestión efectiva
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
      -- Restricción estricta de sucursal para Administrador y Asistente
      AND (
        v_rol = 'SuperAdministrador'
        OR v_user_sucursal_id IS NULL
        OR v.sucursal_id IS NULL
        OR v.sucursal_id = v_user_sucursal_id
      )
      -- Filtro de gestión
      AND (p_gestion_id IS NULL OR v.gestion_id = p_gestion_id)
      -- Rango de fechas
      AND (p_fecha_desde IS NULL OR v.fecha >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR v.fecha <= p_fecha_hasta)
      -- Entrenadores (por autor de asistencia o por asignación actual de alumno)
      AND (
        p_entrenador_ids IS NULL
        OR v.entrenador_id = ANY(p_entrenador_ids)
        OR a.profesor_asignado_id = ANY(p_entrenador_ids)
      )
      -- Canchas / Grupos
      AND (p_cancha_ids IS NULL OR v.cancha_id = ANY(p_cancha_ids))
      -- Horarios
      AND (p_horario_ids IS NULL OR v.horario_id = ANY(p_horario_ids))
      -- Alumno específico opcional
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
      COUNT(DISTINCT alumno_id) AS total_alumnos_unicos
    FROM filtradas_por_dia
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
      'presentes', COALESCE(tr.presentes, 0),
      'licencias', COALESCE(tr.licencias, 0),
      'ausentes', COALESCE(tr.ausentes, 0),
      'total_alumnos_unicos', COALESCE(tr.total_alumnos_unicos, 0),
      'porcentaje_asistencia', CASE
        WHEN (COALESCE(tr.presentes, 0) + COALESCE(tr.licencias, 0) + COALESCE(tr.ausentes, 0)) > 0
        THEN ROUND((tr.presentes::numeric * 100.0) / (tr.presentes + tr.licencias + tr.ausentes)::numeric, 1)
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
  LEFT JOIN serie_agrupada sa ON true
  GROUP BY tr.total_registros, tr.presentes, tr.licencias, tr.ausentes, tr.total_alumnos_unicos;

  RETURN jsonb_build_object(
    'resumen', COALESCE(v_resumen, jsonb_build_object('total_registros', 0, 'presentes', 0, 'licencias', 0, 'ausentes', 0, 'porcentaje_asistencia', 0.0, 'total_alumnos_unicos', 0)),
    'serie_diaria', COALESCE(v_serie_diaria, '[]'::jsonb),
    'gestion', v_gestion_info,
    'alumno_seleccionado', v_alumno_seleccionado
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 2. RPC: rpc_exportar_asistencias_asisport
--    Detalle para exportación Excel con autor y rol de la asistencia
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_exportar_asistencias_asisport(
  p_gestion_id uuid DEFAULT NULL,
  p_fecha_desde date DEFAULT NULL,
  p_fecha_hasta date DEFAULT NULL,
  p_entrenador_ids uuid[] DEFAULT NULL,
  p_cancha_ids uuid[] DEFAULT NULL,
  p_horario_ids uuid[] DEFAULT NULL,
  p_dias text[] DEFAULT NULL,
  p_alumno_id uuid DEFAULT NULL,
  p_pagina integer DEFAULT 1,
  p_limite integer DEFAULT 5000
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_rol varchar;
  v_user_sucursal_id uuid;
  v_activo boolean;
  v_limite_real integer;
  v_offset integer;

  v_items jsonb;
  v_total_resultados bigint;
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
    RAISE EXCEPTION 'Acceso denegado a exportación para el rol %', v_rol;
  END IF;

  v_limite_real := LEAST(GREATEST(COALESCE(p_limite, 5000), 1), 10000);
  v_offset := (GREATEST(COALESCE(p_pagina, 1), 1) - 1) * v_limite_real;

  WITH base_export AS (
    SELECT
      v.id,
      v.fecha,
      v.estado,
      v.alumno_id,
      a.nombres AS alumno_nombres,
      a.apellidos AS alumno_apellidos,
      a.carnet_identidad,
      g.nombre AS cancha_nombre,
      h.hora AS horario_hora,
      u.nombres AS entrenador_nombres,
      u.apellidos AS entrenador_apellidos,
      u.rol AS entrenador_rol,
      v.origen,
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
    LEFT JOIN public.grupos g ON g.id = v.cancha_id
    LEFT JOIN public.horarios h ON h.id = v.horario_id
    LEFT JOIN public.usuarios u ON u.id = v.entrenador_id
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
  filtradas AS (
    SELECT b.*
    FROM base_export b
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
  conteo AS (
    SELECT COUNT(*) AS total FROM filtradas
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'fecha', f.fecha,
        'estado', f.estado,
        'alumno_id', f.alumno_id,
        'alumno_nombres', f.alumno_nombres,
        'alumno_apellidos', f.alumno_apellidos,
        'alumno_nombre_completo', TRIM(f.alumno_nombres || ' ' || f.alumno_apellidos),
        'carnet_identidad', f.carnet_identidad,
        'cancha_nombre', COALESCE(f.cancha_nombre, '-'),
        'horario_hora', COALESCE(f.horario_hora, '-'),
        'entrenador_nombre', CASE
          WHEN f.entrenador_nombres IS NOT NULL THEN TRIM(f.entrenador_nombres || ' ' || f.entrenador_apellidos)
          ELSE '-'
        END,
        'entrenador_rol', COALESCE(f.entrenador_rol, '-'),
        'origen', f.origen
      ) ORDER BY f.fecha ASC, f.alumno_nombres ASC
    ), '[]'::jsonb),
    (SELECT total FROM conteo)
  INTO v_items, v_total_resultados
  FROM (
    SELECT * FROM filtradas
    ORDER BY fecha ASC, alumno_nombres ASC
    LIMIT v_limite_real
    OFFSET v_offset
  ) f;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total_resultados', COALESCE(v_total_resultados, 0),
    'pagina', GREATEST(COALESCE(p_pagina, 1), 1),
    'items_por_pagina', v_limite_real
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_exportar_asistencias_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_exportar_asistencias_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid, integer, integer) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. RPC: rpc_cargar_asistencia_asisport
--    Candidatos autorizados, asistencias de la fecha y estado de envío
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_cargar_asistencia_asisport(
  p_fecha date,
  p_cancha_id uuid DEFAULT NULL,
  p_horario_id uuid DEFAULT NULL,
  p_entrenador_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
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

  -- Si es admin/asistente y selecciona entrenador, lo usa; sino el propio usuario
  IF v_rol IN ('SuperAdministrador', 'Administrador', 'Asistente') THEN
    v_target_entrenador_id := COALESCE(p_entrenador_id, v_user_id);
  ELSE
    v_target_entrenador_id := v_user_id;
  END IF;

  -- 1. Obtener alumnos candidatos
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
        v_rol = 'SuperAdministrador'
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

  -- 2. Obtener asistencias existentes para la fecha
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

  -- 3. Conteo para estado de envío
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
$$;

REVOKE ALL ON FUNCTION public.rpc_cargar_asistencia_asisport(date, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cargar_asistencia_asisport(date, uuid, uuid, uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. RPC: rpc_cumpleanos_asisport
--    Cumpleaños agrupados (hoy, ayer, mañana, próximos 7 días) acotados
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_cumpleanos_asisport()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_rol varchar;
  v_user_sucursal_id uuid;
  v_activo boolean;
  v_zona_horaria varchar;
  v_hoy date;
  v_hoy_mes int;
  v_hoy_dia int;
  v_ayer date;
  v_manana date;
  v_proximos_fin date;

  v_lista_hoy jsonb;
  v_lista_ayer jsonb;
  v_lista_manana jsonb;
  v_lista_proximos jsonb;
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

  SELECT COALESCE(e.zona_horaria, 'America/La_Paz')
  INTO v_zona_horaria
  FROM public.escuelas e
  WHERE e.id = v_escuela_id;

  v_hoy := timezone(v_zona_horaria, now())::date;
  v_ayer := v_hoy - 1;
  v_manana := v_hoy + 1;
  v_proximos_fin := v_hoy + 8;

  WITH cumpleanos_candidatos AS (
    SELECT
      a.id,
      a.nombres,
      a.apellidos,
      a.fecha_nacimiento,
      a.carnet_identidad,
      a.foto_url,
      a.telefono_padre,
      a.telefono_madre,
      a.telefono_deportista,
      a.whatsapp_preferido,
      g.nombre AS cancha_nombre,
      (EXTRACT(YEAR FROM v_hoy)::integer - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub,
      -- Próximo cumpleaños considerando año actual y siguiente
      CASE
        WHEN (
          make_date(EXTRACT(YEAR FROM v_hoy)::int, EXTRACT(MONTH FROM a.fecha_nacimiento)::int, 1)
          + (EXTRACT(DAY FROM a.fecha_nacimiento)::int - 1)
        ) >= (v_hoy + 2)
        THEN (
          make_date(EXTRACT(YEAR FROM v_hoy)::int, EXTRACT(MONTH FROM a.fecha_nacimiento)::int, 1)
          + (EXTRACT(DAY FROM a.fecha_nacimiento)::int - 1)
        )
        ELSE (
          make_date(EXTRACT(YEAR FROM v_hoy)::int + 1, EXTRACT(MONTH FROM a.fecha_nacimiento)::int, 1)
          + (EXTRACT(DAY FROM a.fecha_nacimiento)::int - 1)
        )
      END AS fecha_proximo_cumple
    FROM public.alumnos a
    LEFT JOIN public.grupos g ON g.id = a.cancha_id
    WHERE a.escuela_id = v_escuela_id
      AND a.archivado IS FALSE
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND a.fecha_nacimiento IS NOT NULL
      AND (
        (v_rol IN ('SuperAdministrador', 'Medico'))
        OR (v_rol IN ('Administrador', 'Asistente') AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
        OR (v_rol = 'Entrenador' AND (
             a.profesor_asignado_id = v_user_id
             OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id)
           ))
        OR (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
      )
  )
  SELECT
    -- Hoy
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'nombres', c.nombres,
          'apellidos', c.apellidos,
          'fecha_nacimiento', c.fecha_nacimiento,
          'carnet_identidad', c.carnet_identidad,
          'foto_url', c.foto_url,
          'telefono_padre', c.telefono_padre,
          'telefono_madre', c.telefono_madre,
          'telefono_deportista', c.telefono_deportista,
          'whatsapp_preferido', c.whatsapp_preferido,
          'cancha_nombre', c.cancha_nombre,
          'sub', c.sub
        ) ORDER BY c.nombres, c.apellidos
      ), '[]'::jsonb)
      FROM cumpleanos_candidatos c
      WHERE EXTRACT(MONTH FROM c.fecha_nacimiento) = EXTRACT(MONTH FROM v_hoy)
        AND EXTRACT(DAY FROM c.fecha_nacimiento) = EXTRACT(DAY FROM v_hoy)
    ),
    -- Ayer
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'nombres', c.nombres,
          'apellidos', c.apellidos,
          'fecha_nacimiento', c.fecha_nacimiento,
          'carnet_identidad', c.carnet_identidad,
          'foto_url', c.foto_url,
          'telefono_padre', c.telefono_padre,
          'telefono_madre', c.telefono_madre,
          'telefono_deportista', c.telefono_deportista,
          'whatsapp_preferido', c.whatsapp_preferido,
          'cancha_nombre', c.cancha_nombre,
          'sub', c.sub
        ) ORDER BY c.nombres, c.apellidos
      ), '[]'::jsonb)
      FROM cumpleanos_candidatos c
      WHERE EXTRACT(MONTH FROM c.fecha_nacimiento) = EXTRACT(MONTH FROM v_ayer)
        AND EXTRACT(DAY FROM c.fecha_nacimiento) = EXTRACT(DAY FROM v_ayer)
    ),
    -- Mañana
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'nombres', c.nombres,
          'apellidos', c.apellidos,
          'fecha_nacimiento', c.fecha_nacimiento,
          'carnet_identidad', c.carnet_identidad,
          'foto_url', c.foto_url,
          'telefono_padre', c.telefono_padre,
          'telefono_madre', c.telefono_madre,
          'telefono_deportista', c.telefono_deportista,
          'whatsapp_preferido', c.whatsapp_preferido,
          'cancha_nombre', c.cancha_nombre,
          'sub', c.sub
        ) ORDER BY c.nombres, c.apellidos
      ), '[]'::jsonb)
      FROM cumpleanos_candidatos c
      WHERE EXTRACT(MONTH FROM c.fecha_nacimiento) = EXTRACT(MONTH FROM v_manana)
        AND EXTRACT(DAY FROM c.fecha_nacimiento) = EXTRACT(DAY FROM v_manana)
    ),
    -- Próximos 7 días (a partir de pasado mañana)
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'nombres', c.nombres,
          'apellidos', c.apellidos,
          'fecha_nacimiento', c.fecha_nacimiento,
          'carnet_identidad', c.carnet_identidad,
          'foto_url', c.foto_url,
          'telefono_padre', c.telefono_padre,
          'telefono_madre', c.telefono_madre,
          'telefono_deportista', c.telefono_deportista,
          'whatsapp_preferido', c.whatsapp_preferido,
          'cancha_nombre', c.cancha_nombre,
          'sub', c.sub,
          'daysUntil', (c.fecha_proximo_cumple - v_hoy)
        ) ORDER BY c.fecha_proximo_cumple ASC
      ), '[]'::jsonb)
      FROM cumpleanos_candidatos c
      WHERE c.fecha_proximo_cumple >= (v_hoy + 2)
        AND c.fecha_proximo_cumple <= v_proximos_fin
    )
  INTO v_lista_hoy, v_lista_ayer, v_lista_manana, v_lista_proximos;

  RETURN jsonb_build_object(
    'today', v_lista_hoy,
    'yesterday', v_lista_ayer,
    'tomorrow', v_lista_manana,
    'upcoming', v_lista_proximos
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_cumpleanos_asisport() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cumpleanos_asisport() TO authenticated;


-- ------------------------------------------------------------------------------
-- 5. RPC: rpc_actividad_asisport
--    Auditoría acotada para AsiSport restringida a administradores y asistentes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_actividad_asisport(
  p_fecha_desde timestamptz DEFAULT NULL,
  p_fecha_hasta timestamptz DEFAULT NULL,
  p_limite integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_rol varchar;
  v_activo boolean;
  v_limite_real integer;
  v_resultado jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sesión no autenticada';
  END IF;

  SELECT u.escuela_id, u.rol, u.activo
  INTO v_escuela_id, v_rol, v_activo
  FROM public.usuarios u
  WHERE u.id = v_user_id;

  IF v_activo IS NOT TRUE OR v_escuela_id IS NULL THEN
    RAISE EXCEPTION 'Usuario inactivo o sin escuela asociada';
  END IF;

  IF v_rol NOT IN ('SuperAdministrador', 'Administrador', 'Asistente') THEN
    RAISE EXCEPTION 'Acceso denegado a registro de actividad para el rol %', v_rol;
  END IF;

  v_limite_real := LEAST(GREATEST(COALESCE(p_limite, 100), 1), 200);

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'created_at', a.created_at,
      'modulo', a.modulo,
      'accion', a.accion,
      'detalle', a.detalle,
      'usuario_nombre', a.usuario_nombre
    ) ORDER BY a.created_at DESC
  ), '[]'::jsonb)
  INTO v_resultado
  FROM (
    SELECT al.id, al.created_at, al.modulo, al.accion, al.detalle, al.usuario_nombre
    FROM public.audit_log al
    WHERE al.escuela_id = v_escuela_id
      AND al.ip_address = 'AsiSport'
      AND (p_fecha_desde IS NULL OR al.created_at >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR al.created_at <= p_fecha_hasta)
    ORDER BY al.created_at DESC, al.id DESC
    LIMIT v_limite_real
  ) a;

  RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_actividad_asisport(timestamptz, timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_actividad_asisport(timestamptz, timestamptz, integer) TO authenticated;
