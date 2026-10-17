-- Migración: Optimización y ordenamiento de alumnos archivados por fecha reciente
-- Fecha: 2026-10-17
-- Objetivo: Garantizar que los alumnos archivados se ordenen del más nuevo al más antiguo
-- según su última fecha de archivado, y que al restaurar y volver a archivar se actualice la fecha.

-- 1. Actualizar función trigger marcar_fecha_archivado
CREATE OR REPLACE FUNCTION public.marcar_fecha_archivado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si se marca como archivado (TRUE)
  IF NEW.archivado = TRUE THEN
    -- Si el alumno era activo (se archiva por primera vez o tras ser restaurado),
    -- o si archivado_at no fue provisto o es idéntico al valor previo: la última fecha manda.
    IF (OLD.archivado IS DISTINCT FROM TRUE) OR NEW.archivado_at IS NULL OR NEW.archivado_at = OLD.archivado_at THEN
      NEW.archivado_at = NOW();
    END IF;
    IF (OLD.archivado IS DISTINCT FROM TRUE) OR NEW.archivado_por IS NULL OR NEW.archivado_por = OLD.archivado_por THEN
      NEW.archivado_por = COALESCE(auth.uid(), NEW.archivado_por);
    END IF;
  END IF;
  
  -- Si se restaura el alumno (archivado pasa a FALSE), limpiar fecha y usuario archivador
  IF NEW.archivado = FALSE THEN
    NEW.archivado_at = NULL;
    NEW.archivado_por = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Asegurar que el trigger esté asignado a la tabla alumnos
DROP TRIGGER IF EXISTS set_archivado_at ON public.alumnos;
CREATE TRIGGER set_archivado_at
  BEFORE UPDATE ON public.alumnos
  FOR EACH ROW
  EXECUTE FUNCTION public.marcar_fecha_archivado();

-- 3. Índice optimizado para consulta de alumnos archivados ordenados por fecha descendente
CREATE INDEX IF NOT EXISTS idx_alumnos_archivados_fecha 
  ON public.alumnos (escuela_id, archivado_at DESC NULLS LAST) 
  WHERE archivado IS TRUE;

-- 4. Actualizar rpc_archivar_alumno para registrar explícitamente la fecha y usuario
CREATE OR REPLACE FUNCTION public.rpc_archivar_alumno(p_alumno_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE 
  v_actor public.usuarios%ROWTYPE; 
  v_alumno public.alumnos%ROWTYPE; 
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_actor FROM public.usuarios WHERE id = auth.uid() AND activo IS TRUE;
  IF NOT FOUND OR v_actor.rol NOT IN ('Administrador', 'SuperAdministrador') THEN 
    RAISE EXCEPTION 'No tienes permiso para archivar alumnos.' USING ERRCODE = '42501'; 
  END IF;

  SELECT * INTO v_alumno FROM public.alumnos WHERE id = p_alumno_id FOR UPDATE;
  IF NOT FOUND OR v_alumno.escuela_id <> v_actor.escuela_id THEN 
    RAISE EXCEPTION 'El alumno no pertenece a tu escuela.' USING ERRCODE = '42501'; 
  END IF;

  IF v_actor.rol = 'Administrador' AND v_actor.sucursal_id IS NOT NULL AND v_alumno.sucursal_id IS DISTINCT FROM v_actor.sucursal_id THEN 
    RAISE EXCEPTION 'No puedes archivar alumnos de otra sucursal.' USING ERRCODE = '42501'; 
  END IF;

  UPDATE public.alumnos_grupos 
  SET estado = 'cerrada', vigente_hasta = v_now, motivo = 'archivo', updated_at = v_now 
  WHERE alumno_id = v_alumno.id AND estado = 'activa';

  UPDATE public.alumnos 
  SET archivado = true, 
      archivado_at = v_now, 
      archivado_por = v_actor.id, 
      grupo_gestion_id = NULL, 
      profesor_asignado_id = NULL 
  WHERE id = v_alumno.id;

  DELETE FROM public.alumnos_entrenadores WHERE alumno_id = v_alumno.id;

  RETURN jsonb_build_object('alumno_id', v_alumno.id, 'archivado', true);
END; $$;

-- 5. Actualizar rpc_restaurar_alumno para limpiar explícitamente archivado_at y archivado_por
CREATE OR REPLACE FUNCTION public.rpc_restaurar_alumno(p_alumno_id uuid, p_grupo_gestion_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE 
  v_actor public.usuarios%ROWTYPE; 
  v_alumno public.alumnos%ROWTYPE; 
  v_grupo public.grupos_gestion%ROWTYPE; 
  v_entrenador uuid; 
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_actor FROM public.usuarios WHERE id = auth.uid() AND activo IS TRUE;
  IF NOT FOUND OR v_actor.rol NOT IN ('Administrador', 'SuperAdministrador') THEN 
    RAISE EXCEPTION 'No tienes permiso para restaurar alumnos.' USING ERRCODE = '42501'; 
  END IF;

  SELECT * INTO v_alumno FROM public.alumnos WHERE id = p_alumno_id FOR UPDATE;
  IF NOT FOUND OR v_alumno.escuela_id <> v_actor.escuela_id THEN 
    RAISE EXCEPTION 'El alumno no pertenece a tu escuela.' USING ERRCODE = '42501'; 
  END IF;

  SELECT gg.* INTO v_grupo 
  FROM public.grupos_gestion gg 
  JOIN public.gestiones_deportivas gd ON gd.id = gg.gestion_id AND gd.estado = 'activa'
  WHERE gg.id = COALESCE(p_grupo_gestion_id, (
    SELECT ag.grupo_gestion_id 
    FROM public.alumnos_grupos ag 
    WHERE ag.alumno_id = v_alumno.id 
    ORDER BY ag.vigente_hasta DESC NULLS LAST 
    LIMIT 1
  ))
  AND gg.escuela_id = v_actor.escuela_id FOR UPDATE;

  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Selecciona un grupo activo para restaurar al alumno.' USING ERRCODE = '22023'; 
  END IF;

  SELECT entrenador_id INTO v_entrenador 
  FROM public.entrenadores_grupos 
  WHERE grupo_gestion_id = v_grupo.id AND estado = 'activa';

  IF v_entrenador IS NULL THEN 
    RAISE EXCEPTION 'El grupo destino no tiene profesor principal.' USING ERRCODE = '22023'; 
  END IF;

  UPDATE public.alumnos 
  SET archivado = false, 
      archivado_at = NULL, 
      archivado_por = NULL, 
      grupo_gestion_id = v_grupo.id, 
      grupo_id = v_grupo.grupo_id, 
      horario_id = v_grupo.horario_id, 
      sucursal_id = v_grupo.sucursal_id, 
      profesor_asignado_id = v_entrenador 
  WHERE id = v_alumno.id;

  INSERT INTO public.alumnos_grupos (escuela_id, alumno_id, grupo_gestion_id, gestion_id, estado, decision, vigente_desde, motivo, creado_por)
  VALUES (v_actor.escuela_id, v_alumno.id, v_grupo.id, v_grupo.gestion_id, 'activa', 'migrara', v_now, 'restauracion', v_actor.id);

  INSERT INTO public.alumnos_entrenadores (alumno_id, entrenador_id) 
  VALUES (v_alumno.id, v_entrenador) 
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('alumno_id', v_alumno.id, 'grupo_gestion_id', v_grupo.id, 'restaurado', true);
END; $$;
