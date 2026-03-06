-- ============================================================================
-- SCRIPT DE CORRECCIÓN DEFINITIVO: RLS para la tabla ALUMNOS
-- ============================================================================
-- Este script asegura que:
-- 1. Los Administradores, Dueños y SuperAdministradores puedan ver, editar y borrar
--    a cualquier alumno de su propia escuela.
-- 2. Los Entrenadores puedan ver a todos los alumnos de la escuela (para búsquedas)
--    pero SOLAMENTE puedan editar a los alumnos que tienen ASIGNADOS.
-- ============================================================================

BEGIN;

-- 1. Habilitar RLS en la tabla alumnos
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que puedan causar conflicto
-- Nota: Intentamos borrar nombres comunes usados en scripts previos
DROP POLICY IF EXISTS "Permitir update a admin/superadmin" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_select_policy" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_insert_policy" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_update_policy" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_delete_policy" ON public.alumnos;
DROP POLICY IF EXISTS "Permitir select a todos en escuela" ON public.alumnos;

-- 3. POLÍTICA DE SELECT (LECTURA)
-- Permite que cualquier usuario autenticado vea a los alumnos de su escuela.
CREATE POLICY "alumnos_select_all_in_school"
ON public.alumnos
FOR SELECT
TO authenticated
USING (
  escuela_id IN (
    SELECT escuela_id FROM public.usuarios WHERE id = auth.uid()
  )
);

-- 4. POLÍTICA DE INSERT (CREACIÓN)
-- Permite que cualquier usuario autenticado cree alumnos en su escuela.
CREATE POLICY "alumnos_insert_in_school"
ON public.alumnos
FOR INSERT
TO authenticated
WITH CHECK (
  escuela_id IN (
    SELECT escuela_id FROM public.usuarios WHERE id = auth.uid()
  )
);

-- 5. POLÍTICA DE UPDATE (EDICIÓN) - ¡ESTA ES LA CRÍTICA!
-- Permite editar si:
--   a) El usuario es Administrador/Dueño/SuperAdmin de la escuela del alumno.
--   b) El usuario es el Entrenador Asignado al alumno.
CREATE POLICY "alumnos_update_all_admins_and_assigned"
ON public.alumnos
FOR UPDATE
TO authenticated
USING (
  (escuela_id IN (
    SELECT escuela_id FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol IN ('SuperAdministrador', 'Administrador', 'Dueño'))
  ))
  OR 
  (profesor_asignado_id = auth.uid())
)
WITH CHECK (
  (escuela_id IN (
    SELECT escuela_id FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol IN ('SuperAdministrador', 'Administrador', 'Dueño'))
  ))
  OR 
  (profesor_asignado_id = auth.uid())
);

-- 6. POLÍTICA DE DELETE/ARCHIVAR
-- Solo los administradores pueden borrar o archivar definitivamente.
CREATE POLICY "alumnos_delete_admins_only"
ON public.alumnos
FOR DELETE
TO authenticated
USING (
  escuela_id IN (
    SELECT escuela_id FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol IN ('SuperAdministrador', 'Administrador', 'Dueño'))
  )
);

COMMIT;
