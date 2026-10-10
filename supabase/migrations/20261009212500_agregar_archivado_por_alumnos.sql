-- Migración: Agregar columna archivado_por a alumnos y registrar usuario que archiva
-- Fecha: 2026-10-09

-- 1. Agregar columna archivado_por en tabla alumnos
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS archivado_por UUID CONSTRAINT alumnos_archivado_por_fkey REFERENCES usuarios(id) ON DELETE SET NULL;

-- 2. Actualizar función trigger marcar_fecha_archivado
CREATE OR REPLACE FUNCTION public.marcar_fecha_archivado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si se cambia archivado a TRUE, marcar la fecha y el usuario que archiva
  IF NEW.archivado = TRUE AND (OLD.archivado IS NULL OR OLD.archivado = FALSE) THEN
    NEW.archivado_at = COALESCE(NEW.archivado_at, NOW());
    IF NEW.archivado_por IS NULL THEN
      NEW.archivado_por = auth.uid();
    END IF;
  END IF;
  
  -- Si se cambia archivado a FALSE (restaurar), limpiar la fecha y el usuario
  IF NEW.archivado = FALSE AND OLD.archivado = TRUE THEN
    NEW.archivado_at = NULL;
    NEW.archivado_por = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;
