-- ==============================================================================
-- MIGRACIÓN 1: OPTIMIZACIÓN INTEGRAL DE BUSCADORES Y RLS CENTRAL DE ASISPORT
-- Archivo: 20260902132351_optimizacion_buscadores_rls_rpcs.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Endurecimiento de funciones auxiliares y revocación de accesos anónimos
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.current_user_escuela_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_escuela_id() TO authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_user_escuela_id_asisport()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.escuela_id
  FROM public.usuarios u
  WHERE u.id = (SELECT auth.uid())
    AND u.activo IS TRUE
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION private.current_user_escuela_id_asisport() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_escuela_id_asisport() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Políticas RLS RESTRICTIVE (FOR SELECT TO authenticated)
--    Garantizan aislamiento absoluto por escuela y sucursal según el perfil activo
-- ------------------------------------------------------------------------------

-- Tabla alumnos: política restrictiva por escuela
DROP POLICY IF EXISTS alumnos_restrictive_select_escuela ON public.alumnos;
CREATE POLICY alumnos_restrictive_select_escuela
ON public.alumnos
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla asistencias_normales: política restrictiva por pertenencia escolar
DROP POLICY IF EXISTS asistencias_normales_restrictive_select_escuela ON public.asistencias_normales;
CREATE POLICY asistencias_normales_restrictive_select_escuela
ON public.asistencias_normales
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = asistencias_normales.alumno_id
      AND a.escuela_id = (SELECT private.current_user_escuela_id_asisport())
  )
);

-- Tabla asistencias_arqueros: política restrictiva por pertenencia escolar
DROP POLICY IF EXISTS asistencias_arqueros_restrictive_select_escuela ON public.asistencias_arqueros;
CREATE POLICY asistencias_arqueros_restrictive_select_escuela
ON public.asistencias_arqueros
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.id = asistencias_arqueros.alumno_id
      AND a.escuela_id = (SELECT private.current_user_escuela_id_asisport())
  )
);

-- Tabla usuarios: perfil propio o usuarios de la misma escuela
DROP POLICY IF EXISTS usuarios_restrictive_select_escuela ON public.usuarios;
CREATE POLICY usuarios_restrictive_select_escuela
ON public.usuarios
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid()) OR escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla sucursales
DROP POLICY IF EXISTS sucursales_restrictive_select_escuela ON public.sucursales;
CREATE POLICY sucursales_restrictive_select_escuela
ON public.sucursales
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla grupos (canchas)
DROP POLICY IF EXISTS grupos_restrictive_select_escuela ON public.grupos;
CREATE POLICY grupos_restrictive_select_escuela
ON public.grupos
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla horarios
DROP POLICY IF EXISTS horarios_restrictive_select_escuela ON public.horarios;
CREATE POLICY horarios_restrictive_select_escuela
ON public.horarios
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla gestiones_deportivas
DROP POLICY IF EXISTS gestiones_deportivas_restrictive_select_escuela ON public.gestiones_deportivas;
CREATE POLICY gestiones_deportivas_restrictive_select_escuela
ON public.gestiones_deportivas
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla grupos_gestion
DROP POLICY IF EXISTS grupos_gestion_restrictive_select_escuela ON public.grupos_gestion;
CREATE POLICY grupos_gestion_restrictive_select_escuela
ON public.grupos_gestion
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla alumnos_grupos
DROP POLICY IF EXISTS alumnos_grupos_restrictive_select_escuela ON public.alumnos_grupos;
CREATE POLICY alumnos_grupos_restrictive_select_escuela
ON public.alumnos_grupos
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);

-- Tabla entrenadores_grupos
DROP POLICY IF EXISTS entrenadores_grupos_restrictive_select_escuela ON public.entrenadores_grupos;
CREATE POLICY entrenadores_grupos_restrictive_select_escuela
ON public.entrenadores_grupos
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  escuela_id = (SELECT private.current_user_escuela_id_asisport())
);


-- ------------------------------------------------------------------------------
-- 3. Vista estrecha v_asistencias_gestion_efectiva (security_invoker = true)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_asistencias_gestion_efectiva
WITH (security_invoker = true)
AS
SELECT
  an.id,
  an.alumno_id,
  an.fecha,
  an.estado,
  an.entrenador_id,
  an.created_at,
  COALESCE(an.grupo_gestion_id, ag.grupo_gestion_id) AS grupo_gestion_id,
  COALESCE(gg_exact.gestion_id, gd.id) AS gestion_id,
  COALESCE(gg_exact.grupo_id, gg_compat.grupo_id, a.cancha_id, a.grupo_id) AS cancha_id,
  COALESCE(gg_exact.horario_id, gg_compat.horario_id, a.horario_id) AS horario_id,
  COALESCE(gg_exact.sucursal_id, gg_compat.sucursal_id, a.sucursal_id) AS sucursal_id,
  a.escuela_id,
  CASE
    WHEN an.grupo_gestion_id IS NOT NULL THEN 'exacto'
    WHEN gd.id IS NOT NULL AND ag.id IS NOT NULL THEN 'compatibilidad_anual'
    ELSE 'sin_gestion'
  END AS origen
FROM public.asistencias_normales an
JOIN public.alumnos a ON a.id = an.alumno_id
LEFT JOIN public.grupos_gestion gg_exact ON gg_exact.id = an.grupo_gestion_id
LEFT JOIN public.gestiones_deportivas gd ON gd.escuela_id = a.escuela_id
                                        AND gd.anio = EXTRACT(YEAR FROM an.fecha)::smallint
LEFT JOIN public.alumnos_grupos ag ON an.grupo_gestion_id IS NULL
                                   AND ag.alumno_id = an.alumno_id
                                   AND ag.gestion_id = gd.id
                                   AND ag.estado IN ('activa', 'planificada')
LEFT JOIN public.grupos_gestion gg_compat ON gg_compat.id = ag.grupo_gestion_id;

REVOKE ALL ON public.v_asistencias_gestion_efectiva FROM PUBLIC, anon;
GRANT SELECT ON public.v_asistencias_gestion_efectiva TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. RPC: rpc_catalogos_asisport
--    Retorna gestiones, entrenadores, canchas/grupos y horarios autorizados
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_catalogos_asisport(
  p_sucursal_id uuid DEFAULT NULL
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
    -- Validar que la sucursal pertenezca a la escuela
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

  -- 4. Horarios autorizados
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'value', h.id,
      'label', h.hora,
      'hora', h.hora,
      'dias', h.dias
    ) ORDER BY h.hora
  ), '[]'::jsonb)
  INTO v_horarios
  FROM public.horarios h
  WHERE h.escuela_id = v_escuela_id;

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


-- ------------------------------------------------------------------------------
-- 5. RPC: rpc_listar_alumnos_asisport
--    Listado paginado, búsqueda multi-término, facetas y resumen de contadores
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_listar_alumnos_asisport(
  p_filtros jsonb DEFAULT '{}'::jsonb
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

  -- Filtros desempaquetados
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

  -- Variables de salida
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

  -- Desempaquetado y normalización de parámetros
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

  -- Procesamiento de términos de búsqueda (mínimo 2 caracteres)
  IF LENGTH(v_termino) = 1 THEN
    RAISE EXCEPTION 'Escribe al menos 2 caracteres';
  ELSIF LENGTH(v_termino) >= 2 THEN
    v_palabras := regexp_split_to_array(public.unaccent(LOWER(v_termino)), '\s+');
  ELSE
    v_palabras := NULL;
  END IF;

  -- Consulta central con CTEs optimizadas
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
      AND (v_entrenador_ids IS NULL OR u.profesor_asignado_id = ANY(v_entrenador_ids))
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
    ORDER BY f.nombres ASC, f.apellidos ASC, f.id ASC
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

  -- Construir resumen
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

  -- Construir facetas autorizadas
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
$$;

REVOKE ALL ON FUNCTION public.rpc_listar_alumnos_asisport(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_listar_alumnos_asisport(jsonb) TO authenticated;


-- ------------------------------------------------------------------------------
-- 6. RPC: rpc_sugerir_alumnos_asisport
--    Sugerencias compactas de hasta 10 alumnos para selectores rápidos
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_sugerir_alumnos_asisport(
  p_termino text,
  p_limite integer DEFAULT 10,
  p_filtros jsonb DEFAULT '{}'::jsonb
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
      AND (v_entrenador_ids IS NULL OR a.profesor_asignado_id = ANY(v_entrenador_ids))
      AND (
        SELECT bool_and(a.terminos_busqueda ILIKE ('%' || palabra || '%'))
        FROM unnest(v_palabras) AS palabra
      )
    ORDER BY a.nombres ASC, a.apellidos ASC, a.id ASC
    LIMIT v_limite_real
  ) c;

  RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_sugerir_alumnos_asisport(text, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_sugerir_alumnos_asisport(text, integer, jsonb) TO authenticated;


-- ------------------------------------------------------------------------------
-- 7. RPC: rpc_estado_deuda_alumno_asisport
--    Booleano puntual ultra-rápido para consultar si un alumno tiene deuda
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_estado_deuda_alumno_asisport(
  p_alumno_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_escuela_id uuid;
  v_tiene_deuda boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sesión no autenticada';
  END IF;

  SELECT u.escuela_id
  INTO v_escuela_id
  FROM public.usuarios u
  WHERE u.id = v_user_id AND u.activo IS TRUE;

  IF v_escuela_id IS NULL THEN
    RAISE EXCEPTION 'Usuario inactivo o sin escuela';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.v_cuentas_cobrar cc
    WHERE cc.alumno_id = p_alumno_id
      AND cc.escuela_id = v_escuela_id
      AND cc.anulada IS FALSE
      AND cc.estado <> 'borrador'
    GROUP BY cc.alumno_id
    HAVING
      COALESCE(SUM(CASE WHEN cc.es_anticipo THEN -cc.saldo_pendiente ELSE cc.saldo_pendiente END), 0) > 0
      OR COUNT(*) FILTER (
        WHERE cc.estado IN ('pendiente', 'parcial')
          AND cc.es_anticipo IS FALSE
      ) > 0
  ) INTO v_tiene_deuda;

  RETURN COALESCE(v_tiene_deuda, false);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_estado_deuda_alumno_asisport(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_estado_deuda_alumno_asisport(uuid) TO authenticated;
