-- ============================================================================
-- SCRIPT DE CORRECCIÓN: RLS UPDATE para alumnos (SuperAdministrador)
-- ============================================================================
-- Este script soluciona el problema de actualizaciones "silenciosas" fallidas
-- al permitir que un SuperAdministrador o Administrador pueda hacer UPDATE 
-- sobre los registros de la tabla `alumnos` que pertenezcan a su misma escuela.
-- ============================================================================

BEGIN;

-- 1. Eliminar la política de UPDATE anterior si existe (opcional, ajusta el nombre al tuyo)
-- DROP POLICY IF EXISTS "Permitir actualizar alumnos a admins/entrenadores" ON public.alumnos;

-- 2. Crear una nueva política de permisos RLS que garantice el acceso al SuperAdministrador
CREATE POLICY "Permitir update a admin/superadmin" 
ON public.alumnos
FOR UPDATE 
TO authenticated 
USING (
  escuela_id IN (
    SELECT escuela_id FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol = 'SuperAdministrador' OR rol = 'Administrador' OR rol = 'Dueño')
  )
);

COMMIT;
