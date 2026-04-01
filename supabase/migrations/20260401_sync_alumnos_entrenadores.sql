-- Función para sincronizar de forma automática la tabla alumnos_entrenadores (seguridad/visibilidad) 
-- con el campo profesor_asignado_id de la tabla alumnos.

CREATE OR REPLACE FUNCTION public.sync_alumnos_entrenadores()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso: Actualización de profesor asignado
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.profesor_asignado_id IS DISTINCT FROM NEW.profesor_asignado_id) THEN
            
            -- 1. Si hay un nuevo profesor, lo agregamos primero para evitar el error del trigger de "mínimo 1 entrenador"
            IF (NEW.profesor_asignado_id IS NOT NULL) THEN
                INSERT INTO public.alumnos_entrenadores (alumno_id, entrenador_id)
                VALUES (NEW.id, NEW.profesor_asignado_id)
                ON CONFLICT (alumno_id, entrenador_id) DO NOTHING;
            END IF;

            -- 2. Si había un profesor anterior, lo removemos
            -- NOTA: El trigger en alumnos_entrenadores fallará si intentamos remover el último entrenador,
            -- por eso el orden de los pasos 1 y 2 es crítico si solo hay un entrenador en la tabla puente.
            IF (OLD.profesor_asignado_id IS NOT NULL) THEN
                DELETE FROM public.alumnos_entrenadores 
                WHERE alumno_id = OLD.id 
                  AND entrenador_id = OLD.profesor_asignado_id;
            END IF;
        END IF;

    -- Caso: Inserción de un nuevo alumno con profesor ya asignado
    ELSIF (TG_OP = 'INSERT') THEN
        IF (NEW.profesor_asignado_id IS NOT NULL) THEN
            INSERT INTO public.alumnos_entrenadores (alumno_id, entrenador_id)
            VALUES (NEW.id, NEW.profesor_asignado_id)
            ON CONFLICT (alumno_id, entrenador_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se activa al insertar o actualizar el profesor asignado
DROP TRIGGER IF EXISTS trigger_sync_alumnos_entrenadores ON public.alumnos;
CREATE TRIGGER trigger_sync_alumnos_entrenadores
AFTER INSERT OR UPDATE OF profesor_asignado_id ON public.alumnos
FOR EACH ROW EXECUTE FUNCTION public.sync_alumnos_entrenadores();

-- COMENTARIO DE DOCUMENTACIÓN:
-- Este trigger asegura que la visibilidad para los entrenadores esté siempre sincronizada.
-- El frontend de AsiSport v2 ya actualiza el profesor_asignado_id en la tabla alumnos, 
-- pero la política de seguridad RLS utiliza la tabla puente alumnos_entrenadores para filtrar.
-- Esta automatización elimina la necesidad de manejar dos tablas desde el frontend en cambios de entrenador.
