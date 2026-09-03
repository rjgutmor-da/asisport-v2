-- Opciones bidireccionales basadas en las relaciones reales de alumnos.
-- No modifica datos ni columnas: expone combinaciones autorizadas para los filtros.
DROP FUNCTION IF EXISTS public.rpc_opciones_filtros_alumnos_asisport(text);

CREATE FUNCTION public.rpc_opciones_filtros_alumnos_asisport(
  p_estado_filtro text DEFAULT 'todos'
)
RETURNS TABLE (
  entrenador_id uuid,
  cancha_id uuid,
  horario_id uuid,
  sub integer
)
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
  ORDER BY u.cancha_id, u.profesor_asignado_id, u.horario_id, u.sub;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_opciones_filtros_alumnos_asisport(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_opciones_filtros_alumnos_asisport(text) TO authenticated;
NOTIFY pgrst, 'reload schema';