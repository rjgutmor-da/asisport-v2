-- La Lista de Alumnos consume esta RPC; el orden debe reflejar la inscripción,
-- no el nombre. Conservamos toda su lógica y cambiamos únicamente su ORDER BY.
DO $$
DECLARE
  v_definicion text;
  v_orden_anterior constant text := 'ORDER BY f.nombres ASC, f.apellidos ASC, f.id ASC';
  v_orden_nuevo constant text := 'ORDER BY f.created_at DESC NULLS LAST, f.id DESC';
BEGIN
  SELECT pg_get_functiondef('public.rpc_listar_alumnos_asisport(jsonb)'::regprocedure)
  INTO v_definicion;

  IF v_definicion IS NULL OR position(v_orden_anterior IN v_definicion) = 0 THEN
    RAISE EXCEPTION
      'No se encontró el orden esperado en public.rpc_listar_alumnos_asisport(jsonb)';
  END IF;

  EXECUTE replace(v_definicion, v_orden_anterior, v_orden_nuevo);
END;
$$;
