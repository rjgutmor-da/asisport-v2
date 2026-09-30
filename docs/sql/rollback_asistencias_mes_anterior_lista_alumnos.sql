CREATE OR REPLACE FUNCTION public.rpc_listar_alumnos_asisport(p_filtros jsonb DEFAULT '{}'::jsonb)
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
$function$
;
