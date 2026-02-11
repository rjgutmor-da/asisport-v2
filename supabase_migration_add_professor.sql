-- Migration: Add assigned professor to students
-- Author: Assistant
-- Description: Adds 'profesor_asignado_id' column to 'alumnos' table to support RBAC.

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumnos' AND column_name = 'profesor_asignado_id') THEN
        ALTER TABLE public.alumnos ADD COLUMN profesor_asignado_id UUID REFERENCES public.usuarios(id);
    END IF;
END $$;

-- Update the comment for the column
COMMENT ON COLUMN public.alumnos.profesor_asignado_id IS 'ID del profesor (entrenador) asignado a este alumno. Null si no tiene asignación específica.';

-- Ensure RLS policies (if any) are updated or reviewed. 
-- Assuming specific policies will be handled in a separate script or manual review if row-level security is active.
