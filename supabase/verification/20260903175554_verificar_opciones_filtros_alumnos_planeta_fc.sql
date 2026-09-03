-- Verificación posterior a la migración.
-- Prueba real: PLANETA FC, escuela 218ea007-49c4-4fa2-9e81-3b6663496f26.
-- El usuario de prueba se obtiene de producción: SuperAdministrador activo de esa escuela.
WITH usuario_prueba AS MATERIALIZED (
  SELECT u.id
  FROM public.usuarios u
  WHERE u.escuela_id = '218ea007-49c4-4fa2-9e81-3b6663496f26'::uuid
    AND u.rol = 'SuperAdministrador'
    AND u.activo IS TRUE
  ORDER BY u.id
  LIMIT 1
),
contexto AS MATERIALIZED (
  SELECT
    set_config('request.jwt.claim.sub', u.id::text, true) AS usuario_id,
    set_config('request.jwt.claim.role', 'authenticated', true) AS rol_jwt
  FROM usuario_prueba u
),
rpc AS MATERIALIZED (
  SELECT r.*
  FROM contexto c
  CROSS JOIN LATERAL public.rpc_opciones_filtros_alumnos_asisport('todos') r
),
manual AS MATERIALIZED (
  SELECT DISTINCT
    a.profesor_asignado_id AS entrenador_id,
    a.cancha_id,
    a.horario_id,
    (EXTRACT(YEAR FROM timezone('America/La_Paz', now())::date)::integer
      - EXTRACT(YEAR FROM a.fecha_nacimiento)::integer) AS sub
  FROM public.alumnos a
  WHERE a.escuela_id = '218ea007-49c4-4fa2-9e81-3b6663496f26'::uuid
    AND NOT a.archivado
    AND a.estado <> 'ELIMINADO SISTEMA'
),
solo_rpc AS (
  SELECT * FROM rpc
  EXCEPT
  SELECT * FROM manual
),
solo_manual AS (
  SELECT * FROM manual
  EXCEPT
  SELECT * FROM rpc
),
tipos_esperados(columna, tipo) AS (
  VALUES
    ('entrenador_id'::text, 'uuid'::text),
    ('cancha_id'::text, 'uuid'::text),
    ('horario_id'::text, 'uuid'::text),
    ('sub'::text, 'integer'::text)
),
tipos_reales AS (
  SELECT
    p.proargnames[i] AS columna,
    format_type(p.proallargtypes[i], NULL) AS tipo
  FROM pg_proc p
  CROSS JOIN LATERAL generate_subscripts(p.proallargtypes, 1) AS i
  WHERE p.oid = 'public.rpc_opciones_filtros_alumnos_asisport(text)'::regprocedure
    AND p.proargmodes[i] IN ('o', 't')
),
tipos_comparados AS (
  SELECT
    e.columna,
    e.tipo AS tipo_declarado,
    r.tipo AS tipo_catalogo,
    r.tipo = e.tipo AS coincide
  FROM tipos_esperados e
  LEFT JOIN tipos_reales r USING (columna)
),
privilegios AS (
  SELECT
    has_function_privilege('authenticated', 'public.rpc_opciones_filtros_alumnos_asisport(text)', 'EXECUTE') AS authenticated_execute,
    has_function_privilege('anon', 'public.rpc_opciones_filtros_alumnos_asisport(text)', 'EXECUTE') AS anon_execute
)
SELECT jsonb_build_object(
  'escuela_prueba', 'PLANETA FC',
  'escuela_id', '218ea007-49c4-4fa2-9e81-3b6663496f26',
  'usuario_prueba_encontrado', EXISTS (SELECT 1 FROM usuario_prueba),
  'parametros_rpc', jsonb_build_object('p_estado_filtro', 'todos'),
  'filas_rpc', (SELECT count(*) FROM rpc),
  'filas_manual', (SELECT count(*) FROM manual),
  'solo_en_rpc', (SELECT count(*) FROM solo_rpc),
  'solo_en_manual', (SELECT count(*) FROM solo_manual),
  'resultado_coincide_manual', NOT EXISTS (SELECT 1 FROM solo_rpc) AND NOT EXISTS (SELECT 1 FROM solo_manual),
  'tipos', (SELECT jsonb_agg(jsonb_build_object(
    'columna', columna,
    'tipo_declarado', tipo_declarado,
    'tipo_catalogo', tipo_catalogo,
    'coincide', coincide
  ) ORDER BY columna) FROM tipos_comparados),
  'tipos_correctos', COALESCE((SELECT bool_and(coincide) FROM tipos_comparados), false)
    AND (SELECT count(*) FROM tipos_comparados) = 4,
  'authenticated_execute', (SELECT authenticated_execute FROM privilegios),
  'anon_execute', (SELECT anon_execute FROM privilegios),
  'verificacion_ok',
    EXISTS (SELECT 1 FROM usuario_prueba)
    AND NOT EXISTS (SELECT 1 FROM solo_rpc)
    AND NOT EXISTS (SELECT 1 FROM solo_manual)
    AND COALESCE((SELECT bool_and(coincide) FROM tipos_comparados), false)
    AND (SELECT count(*) FROM tipos_comparados) = 4
    AND (SELECT authenticated_execute FROM privilegios)
    AND NOT (SELECT anon_execute FROM privilegios)
) AS verificacion;