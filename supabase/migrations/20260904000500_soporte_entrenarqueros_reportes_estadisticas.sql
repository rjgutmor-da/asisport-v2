-- ==============================================================================
-- MIGRACIÓN: SOPORTE DE ENTRENADORES DE ARQUEROS EN REPORTES Y ESTADÍSTICAS
-- Fecha: 2026-09-04
-- Descripción:
--   1. En rpc_listar_alumnos_asisport: al filtrar por un Entrenador de Arqueros,
--      incluye los alumnos con es_arquero = true de su escuela/sucursal.
--   2. En rpc_sugerir_alumnos_asisport: aplica la misma inclusión para sugerencias.
--   3. En rpc_resumen_estadisticas_asisport: incluye arqueros en alumnos_en_alcance
--      y elimina el campo obsoleto porcentaje_asistencia.
--   4. En rpc_opciones_filtros_alumnos_asisport: vincula a los arqueros con su
--      respectivo Entrenarqueros para coherencia de filtros dinámicos.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: rpc_listar_alumnos_asisport
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_listar_alumnos_asisport(
  p_filtros jsonb DEFAULT '{}'::jsonb
)
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
  v_zona_horaria varchar;

  v_cancha_ids uuid[];
  v_horario_ids uuid[];
  v_entrenador_ids uuid[];
  v_subs integer[];
  v_tipos text[];
  v_termino text;
  v_estado_filtro text;
  v_pagina integer;
  v_limite integer;
  v_offset integer;
  v_palabras text[];

  v_items jsonb;
  v_total_resultados bigint;
  v_resumen jsonb;
  v_facetas jsonb;
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

  v_pagina := GREATEST(COALESCE((p_filtros->>'pagina')::integer, 1), 1);
  v_limite := LEAST(GREATEST(COALESCE((p_filtros->>'limite')::integer, 30), 1), 50);
  v_offset := (v_pagina - 1) * v_limite;
  v_estado_filtro := LOWER(COALESCE(p_filtros->>'estado_filtro', 'activos'));
  v_termino := TRIM(COALESCE(p_filtros->>'termino_busqueda', ''));

  IF p_filtros ? 'cancha_ids' AND jsonb_array_length(p_filtros->'cancha_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_cancha_ids FROM jsonb_array_elements_text(p_filtros->'cancha_ids');
  END IF;

  IF p_filtros ? 'horario_ids' AND jsonb_array_length(p_filtros->'horario_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_horario_ids FROM jsonb_array_elements_text(p_filtros->'horario_ids');
  END IF;

  IF p_filtros ? 'entrenador_ids' AND jsonb_array_length(p_filtros->'entrenador_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_entrenador_ids FROM jsonb_array_elements_text(p_filtros->'entrenador_ids');
  END IF;

  IF p_filtros ? 'subs' AND jsonb_array_length(p_filtros->'subs') > 0 THEN
    SELECT array_agg(value::text::integer) INTO v_subs FROM jsonb_array_elements_text(p_filtros->'subs');
  END IF;

  IF p_filtros ? 'tipos' AND jsonb_array_length(p_filtros->'tipos') > 0 THEN
    SELECT array_agg(value::text) INTO v_tipos FROM jsonb_array_elements_text(p_filtros->'tipos');
  END IF;

  IF LENGTH(v_termino) = 1 THEN
    RAISE EXCEPTION 'Escribe al menos 2 caracteres';
  ELSIF LENGTH(v_termino) >= 2 THEN
    v_palabras := regexp_split_to_array(public.unaccent(LOWER(v_termino)), '\s+');
  ELSE
    v_palabras := NULL;
  END IF;

  WITH universo_base AS (
    SELECT
      a.id,
      a.nombres,
      a.apellidos,
      a.fecha_nacimiento,
      a.carnet_identidad,
      a.foto_url,
      a.estado,
      a.archivado,
      a.es_arquero,
      a.profesor_asignado_id,
      a.cancha_id,
      a.horario_id,
      a.nombre_padre,
      a.telefono_padre,
      a.nombre_madre,
      a.telefono_madre,
      a.telefono_deportista,
      a.whatsapp_preferido,
      a.created_at,
      a.tipo,
      a.mensualidad,
      a.colegio,
      a.direccion,
      a.sucursal_id,
      a.terminos_busqueda,
      (EXTRACT(YEAR FROM timezone(v_zona_horaria, now())::date)::integer - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub,
      (
        a.nombres IS NULL OR a.apellidos IS NULL OR a.fecha_nacimiento IS NULL
        OR ((a.nombre_padre IS NULL OR TRIM(a.nombre_padre) = '') AND (a.nombre_madre IS NULL OR TRIM(a.nombre_madre) = ''))
        OR ((a.telefono_padre IS NULL OR TRIM(a.telefono_padre) = '') AND (a.telefono_madre IS NULL OR TRIM(a.telefono_madre) = ''))
      ) AS es_incompleto
    FROM public.alumnos a
    WHERE a.escuela_id = v_escuela_id
      AND (
        (v_rol IN ('SuperAdministrador', 'Medico'))
        OR (v_rol IN ('Administrador', 'Asistente') AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
        OR (v_rol = 'Entrenador' AND (
             a.profesor_asignado_id = v_user_id
             OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id)
           ))
        OR (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
      )
  ),
  filtrados AS (
    SELECT u.*
    FROM universo_base u
    WHERE
      (
        (v_estado_filtro = 'activos' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA')
        OR (v_estado_filtro = 'archivados' AND u.archivado)
        OR (v_estado_filtro = 'pendientes' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA' AND u.es_incompleto)
        OR (v_estado_filtro = 'arqueros' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA' AND u.es_arquero)
        OR (v_estado_filtro = 'todos' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA')
      )
      AND (v_cancha_ids IS NULL OR u.cancha_id = ANY(v_cancha_ids))
      AND (v_horario_ids IS NULL OR u.horario_id = ANY(v_horario_ids))
      AND (
        v_entrenador_ids IS NULL
        OR u.profesor_asignado_id = ANY(v_entrenador_ids)
        OR EXISTS (
          SELECT 1 FROM public.alumnos_entrenadores ae
          WHERE ae.alumno_id = u.id AND ae.entrenador_id = ANY(v_entrenador_ids)
        )
        OR (
          u.es_arquero IS TRUE
          AND EXISTS (
            SELECT 1 FROM public.usuarios ce
            WHERE ce.id = ANY(v_entrenador_ids)
              AND ce.rol = 'Entrenarqueros'
              AND (ce.sucursal_id IS NULL OR u.sucursal_id = ce.sucursal_id)
          )
        )
      )
      AND (v_subs IS NULL OR u.sub = ANY(v_subs))
      AND (v_tipos IS NULL OR u.tipo = ANY(v_tipos))
      AND (
        v_palabras IS NULL
        OR (
          SELECT bool_and(u.terminos_busqueda ILIKE ('%' || palabra || '%'))
          FROM unnest(v_palabras) AS palabra
        )
      )
  ),
  total_conteo AS (
    SELECT COUNT(*) AS total FROM filtrados
  ),
  pagina_items AS (
    SELECT
      f.id,
      f.nombres,
      f.apellidos,
      f.fecha_nacimiento,
      f.carnet_identidad,
      f.foto_url,
      f.estado,
      f.archivado,
      f.es_arquero,
      f.profesor_asignado_id,
      f.cancha_id,
      f.horario_id,
      f.nombre_padre,
      f.telefono_padre,
      f.nombre_madre,
      f.telefono_madre,
      f.telefono_deportista,
      f.whatsapp_preferido,
      f.created_at,
      f.sub,
      f.tipo,
      f.mensualidad,
      f.colegio,
      f.direccion,
      f.sucursal_id,
      g.nombre AS cancha_nombre,
      h.hora AS horario_hora,
      jsonb_build_object('id', g.id, 'nombre', COALESCE(g.nombre, '')) AS cancha,
      jsonb_build_object('id', h.id, 'hora', COALESCE(h.hora, '')) AS horario,
      (prof.nombres || ' ' || prof.apellidos) AS entrenador_nombre,
      COALESCE((
        SELECT COUNT(*)::integer
        FROM public.asistencias_normales an
        WHERE an.alumno_id = f.id
          AND an.estado = 'Presente'
          AND an.fecha >= date_trunc('month', timezone(v_zona_horaria, now())::date)::date
      ), 0) AS asistencias_mes_actual
    FROM filtrados f
    LEFT JOIN public.grupos g ON g.id = f.cancha_id
    LEFT JOIN public.horarios h ON h.id = f.horario_id
    LEFT JOIN public.usuarios prof ON prof.id = f.profesor_asignado_id
    ORDER BY f.created_at DESC NULLS LAST, f.id DESC
    LIMIT v_limite
    OFFSET v_offset
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'nombres', pi.nombres,
        'apellidos', pi.apellidos,
        'fecha_nacimiento', pi.fecha_nacimiento,
        'carnet_identidad', pi.carnet_identidad,
        'foto_url', pi.foto_url,
        'estado', pi.estado,
        'archivado', pi.archivado,
        'es_arquero', pi.es_arquero,
        'profesor_asignado_id', pi.profesor_asignado_id,
        'cancha_id', pi.cancha_id,
        'horario_id', pi.horario_id,
        'nombre_padre', pi.nombre_padre,
        'telefono_padre', pi.telefono_padre,
        'nombre_madre', pi.nombre_madre,
        'telefono_madre', pi.telefono_madre,
        'telefono_deportista', pi.telefono_deportista,
        'whatsapp_preferido', pi.whatsapp_preferido,
        'created_at', pi.created_at,
        'sub', pi.sub,
        'tipo', pi.tipo,
        'mensualidad', pi.mensualidad,
        'colegio', pi.colegio,
        'direccion', pi.direccion,
        'sucursal_id', pi.sucursal_id,
        'cancha_nombre', pi.cancha_nombre,
        'horario_hora', pi.horario_hora,
        'cancha', pi.cancha,
        'horario', pi.horario,
        'entrenador_nombre', pi.entrenador_nombre,
        'asistencias_count', pi.asistencias_mes_actual,
        'asistencias_mes_actual', pi.asistencias_mes_actual
      )
    ), '[]'::jsonb),
    (SELECT total FROM total_conteo)
  INTO v_items, v_total_resultados
  FROM pagina_items pi;

  SELECT jsonb_build_object(
    'total_activos', cr.total_activos,
    'total_pendientes', cr.total_pendientes,
    'total_archivados', cr.total_archivados,
    'total_arqueros', cr.total_arqueros
  )
  INTO v_resumen
  FROM (
    SELECT
      COUNT(*) FILTER (WHERE NOT a.archivado AND a.estado <> 'ELIMINADO SISTEMA') AS total_activos,
      COUNT(*) FILTER (WHERE NOT a.archivado AND a.estado <> 'ELIMINADO SISTEMA' AND (
        a.nombres IS NULL OR a.apellidos IS NULL OR a.fecha_nacimiento IS NULL
        OR ((a.nombre_padre IS NULL OR TRIM(a.nombre_padre) = '') AND (a.nombre_madre IS NULL OR TRIM(a.nombre_madre) = ''))
        OR ((a.telefono_padre IS NULL OR TRIM(a.telefono_padre) = '') AND (a.telefono_madre IS NULL OR TRIM(a.telefono_madre) = ''))
      )) AS total_pendientes,
      COUNT(*) FILTER (WHERE a.archivado) AS total_archivados,
      COUNT(*) FILTER (WHERE NOT a.archivado AND a.estado <> 'ELIMINADO SISTEMA' AND a.es_arquero) AS total_arqueros
    FROM public.alumnos a
    WHERE a.escuela_id = v_escuela_id
      AND (
        (v_rol IN ('SuperAdministrador', 'Medico'))
        OR (v_rol IN ('Administrador', 'Asistente') AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
        OR (v_rol = 'Entrenador' AND (
             a.profesor_asignado_id = v_user_id
             OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id)
           ))
        OR (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
      )
  ) cr;

  SELECT jsonb_build_object(
    'subs', (
      SELECT COALESCE(jsonb_agg(sub ORDER BY sub), '[]'::jsonb)
      FROM (
        SELECT DISTINCT (EXTRACT(YEAR FROM timezone(v_zona_horaria, now())::date)::integer - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub
        FROM public.alumnos a
        WHERE a.escuela_id = v_escuela_id AND NOT a.archivado AND a.fecha_nacimiento IS NOT NULL
      ) s
    ),
    'tipos', (
      SELECT COALESCE(jsonb_agg(tipo ORDER BY tipo), '[]'::jsonb)
      FROM (
        SELECT DISTINCT a.tipo
        FROM public.alumnos a
        WHERE a.escuela_id = v_escuela_id AND NOT a.archivado AND a.tipo IS NOT NULL
      ) t
    )
  ) INTO v_facetas;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total_resultados', COALESCE(v_total_resultados, 0),
    'pagina', v_pagina,
    'items_por_pagina', v_limite,
    'resumen', v_resumen,
    'facetas', v_facetas
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_listar_alumnos_asisport(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_listar_alumnos_asisport(jsonb) TO authenticated;


-- ------------------------------------------------------------------------------
-- 2. RPC: rpc_sugerir_alumnos_asisport
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_sugerir_alumnos_asisport(
  p_termino text,
  p_limite integer DEFAULT 10,
  p_filtros jsonb DEFAULT '{}'::jsonb
)
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
  v_zona_horaria varchar;
  v_termino_limpio text;
  v_palabras text[];
  v_limite_real integer;
  v_cancha_ids uuid[];
  v_horario_ids uuid[];
  v_entrenador_ids uuid[];
  v_resultado jsonb;
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
    RAISE EXCEPTION 'Usuario inactivo o sin escuela';
  END IF;

  SELECT COALESCE(e.zona_horaria, 'America/La_Paz')
  INTO v_zona_horaria
  FROM public.escuelas e
  WHERE e.id = v_escuela_id;

  v_termino_limpio := TRIM(COALESCE(p_termino, ''));
  v_limite_real := LEAST(GREATEST(COALESCE(p_limite, 10), 1), 10);

  IF LENGTH(v_termino_limpio) < 2 THEN
    RETURN '[]'::jsonb;
  END IF;

  v_palabras := regexp_split_to_array(public.unaccent(LOWER(v_termino_limpio)), '\s+');

  IF p_filtros ? 'cancha_ids' AND jsonb_array_length(p_filtros->'cancha_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_cancha_ids FROM jsonb_array_elements_text(p_filtros->'cancha_ids');
  END IF;

  IF p_filtros ? 'horario_ids' AND jsonb_array_length(p_filtros->'horario_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_horario_ids FROM jsonb_array_elements_text(p_filtros->'horario_ids');
  END IF;

  IF p_filtros ? 'entrenador_ids' AND jsonb_array_length(p_filtros->'entrenador_ids') > 0 THEN
    SELECT array_agg(value::text::uuid) INTO v_entrenador_ids FROM jsonb_array_elements_text(p_filtros->'entrenador_ids');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'nombres', c.nombres,
      'apellidos', c.apellidos,
      'carnet_identidad', c.carnet_identidad,
      'foto_url', c.foto_url,
      'cancha_id', c.cancha_id,
      'cancha_nombre', c.cancha_nombre,
      'horario_id', c.horario_id,
      'horario_hora', c.horario_hora,
      'profesor_asignado_id', c.profesor_asignado_id,
      'sub', c.sub
    ) ORDER BY c.nombres ASC, c.apellidos ASC, c.id ASC
  ), '[]'::jsonb)
  INTO v_resultado
  FROM (
    SELECT
      a.id, a.nombres, a.apellidos, a.carnet_identidad, a.foto_url,
      a.cancha_id, g.nombre AS cancha_nombre,
      a.horario_id, h.hora AS horario_hora,
      a.profesor_asignado_id,
      (EXTRACT(YEAR FROM timezone(v_zona_horaria, now())::date)::integer - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub
    FROM public.alumnos a
    LEFT JOIN public.grupos g ON g.id = a.cancha_id
    LEFT JOIN public.horarios h ON h.id = a.horario_id
    WHERE a.escuela_id = v_escuela_id
      AND a.archivado IS FALSE
      AND a.estado <> 'ELIMINADO SISTEMA'
      AND (
        (v_rol IN ('SuperAdministrador', 'Medico'))
        OR (v_rol IN ('Administrador', 'Asistente') AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
        OR (v_rol = 'Entrenador' AND (
             a.profesor_asignado_id = v_user_id
             OR EXISTS (SELECT 1 FROM public.alumnos_entrenadores ae WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id)
           ))
        OR (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
      )
      AND (v_cancha_ids IS NULL OR a.cancha_id = ANY(v_cancha_ids))
      AND (v_horario_ids IS NULL OR a.horario_id = ANY(v_horario_ids))
      AND (
        v_entrenador_ids IS NULL
        OR a.profesor_asignado_id = ANY(v_entrenador_ids)
        OR EXISTS (
          SELECT 1 FROM public.alumnos_entrenadores ae
          WHERE ae.alumno_id = a.id AND ae.entrenador_id = ANY(v_entrenador_ids)
        )
        OR (
          a.es_arquero IS TRUE
          AND EXISTS (
            SELECT 1 FROM public.usuarios ce
            WHERE ce.id = ANY(v_entrenador_ids)
              AND ce.rol = 'Entrenarqueros'
              AND (ce.sucursal_id IS NULL OR a.sucursal_id = ce.sucursal_id)
          )
        )
      )
      AND (
        SELECT bool_and(a.terminos_busqueda ILIKE ('%' || palabra || '%'))
        FROM unnest(v_palabras) AS palabra
      )
    ORDER BY a.nombres ASC, a.apellidos ASC, a.id ASC
    LIMIT v_limite_real
  ) c;

  RETURN v_resultado;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_sugerir_alumnos_asisport(text, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_sugerir_alumnos_asisport(text, integer, jsonb) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. RPC: rpc_resumen_estadisticas_asisport
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_resumen_estadisticas_asisport(
  p_gestion_id uuid DEFAULT NULL::uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_entrenador_ids uuid[] DEFAULT NULL::uuid[],
  p_cancha_ids uuid[] DEFAULT NULL::uuid[],
  p_horario_ids uuid[] DEFAULT NULL::uuid[],
  p_dias text[] DEFAULT NULL::text[],
  p_alumno_id uuid DEFAULT NULL::uuid
)
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
        OR (
          a.es_arquero IS TRUE
          AND EXISTS (
            SELECT 1 FROM public.usuarios ce
            WHERE ce.id = ANY(p_entrenador_ids)
              AND ce.rol = 'Entrenarqueros'
              AND (ce.sucursal_id IS NULL OR a.sucursal_id = ce.sucursal_id)
          )
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
      'total_alumnos_unicos', COALESCE(tr.total_alumnos_unicos, 0)
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
    'resumen', COALESCE(v_resumen, jsonb_build_object('total_registros', 0, 'total_alumnos', 0, 'presentes', 0, 'licencias', 0, 'ausentes', 0, 'total_alumnos_unicos', 0)),
    'serie_diaria', COALESCE(v_serie_diaria, '[]'::jsonb),
    'gestion', v_gestion_info,
    'alumno_seleccionado', v_alumno_seleccionado
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. RPC: rpc_opciones_filtros_alumnos_asisport
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_opciones_filtros_alumnos_asisport(
  p_estado_filtro text DEFAULT 'todos'::text
)
RETURNS TABLE(entrenador_id uuid, cancha_id uuid, horario_id uuid, sub integer)
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
  v_zona_horaria varchar;
  v_estado_filtro text;
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

  v_estado_filtro := LOWER(COALESCE(NULLIF(TRIM(p_estado_filtro), ''), 'todos'));

  RETURN QUERY
  WITH universo_base AS (
    SELECT
      a.profesor_asignado_id,
      a.cancha_id,
      a.horario_id,
      (EXTRACT(YEAR FROM timezone(v_zona_horaria, now())::date)::integer
        - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub,
      a.archivado,
      a.estado,
      a.es_arquero,
      a.sucursal_id,
      (
        a.nombres IS NULL OR a.apellidos IS NULL OR a.fecha_nacimiento IS NULL
        OR ((a.nombre_padre IS NULL OR TRIM(a.nombre_padre) = '') AND (a.nombre_madre IS NULL OR TRIM(a.nombre_madre) = ''))
        OR ((a.telefono_padre IS NULL OR TRIM(a.telefono_padre) = '') AND (a.telefono_madre IS NULL OR TRIM(a.telefono_madre) = ''))
      ) AS es_incompleto
    FROM public.alumnos a
    WHERE a.escuela_id = v_escuela_id
      AND (
        (v_rol IN ('SuperAdministrador', 'Medico'))
        OR (v_rol IN ('Administrador', 'Asistente') AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
        OR (v_rol = 'Entrenador' AND (
          a.profesor_asignado_id = v_user_id
          OR EXISTS (
            SELECT 1
            FROM public.alumnos_entrenadores ae
            WHERE ae.alumno_id = a.id AND ae.entrenador_id = v_user_id
          )
        ))
        OR (v_rol = 'Entrenarqueros' AND a.es_arquero IS TRUE AND (v_user_sucursal_id IS NULL OR a.sucursal_id = v_user_sucursal_id))
      )
  ),
  universo_estado AS (
    SELECT u.*
    FROM universo_base u
    WHERE
      (v_estado_filtro = 'activos' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA')
      OR (v_estado_filtro = 'archivados' AND u.archivado)
      OR (v_estado_filtro = 'pendientes' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA' AND u.es_incompleto)
      OR (v_estado_filtro = 'arqueros' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA' AND u.es_arquero)
      OR (v_estado_filtro = 'todos' AND NOT u.archivado AND u.estado <> 'ELIMINADO SISTEMA')
  )
  SELECT DISTINCT
    u.profesor_asignado_id AS entrenador_id,
    u.cancha_id,
    u.horario_id,
    u.sub
  FROM universo_estado u
  WHERE u.profesor_asignado_id IS NOT NULL
  UNION
  SELECT DISTINCT
    eq.id AS entrenador_id,
    u.cancha_id,
    u.horario_id,
    u.sub
  FROM universo_estado u
  JOIN public.usuarios eq ON eq.escuela_id = v_escuela_id
                         AND eq.rol = 'Entrenarqueros'
                         AND eq.activo IS TRUE
                         AND (eq.sucursal_id IS NULL OR u.sucursal_id = eq.sucursal_id)
  WHERE u.es_arquero IS TRUE
  ORDER BY cancha_id, entrenador_id, horario_id, sub;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_opciones_filtros_alumnos_asisport(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_opciones_filtros_alumnos_asisport(text) TO authenticated;
