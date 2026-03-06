-- ============================================================================
-- SCRIPT DE CORRECCIÓN DEFINITIVO: RLS para la tabla ALUMNOS (Refinado por Sucursales)
-- ============================================================================
-- REGLAS DE ACCESO PARA ALUMNOS:
-- 1. Dueño / SuperAdministrador: Ver, Editar, Archivar y Borrar alumnos en TODA la escuela.
-- 2. Administrador: Ver, Editar y Archivar alumnos de SU SUCURSAL asignada. 
--    (Si no tiene sucursal asignada, puede ver/editar en toda la escuela).
-- 3. Entrenador: Ver, Editar y Archivar alumnos de SU SUCURSAL asignada.
--    (Incluimos edición y archivado operativo para entrenadores según solicitud).
-- ============================================================================

BEGIN;

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "alumnos_select_all_in_school" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_insert_in_school" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_update_all_admins_and_assigned" ON public.alumnos;
DROP POLICY IF EXISTS "alumnos_delete_admins_only" ON public.alumnos;
DROP POLICY IF EXISTS "Permitir update a admin/superadmin" ON public.alumnos;

-- 3. POLÍTICA DE SELECT (LECTURA)
CREATE POLICY "alumnos_select_policy"
ON public.alumnos
FOR SELECT
TO authenticated
USING (
  -- Misma escuela obligatoriamente
  escuela_id IN (SELECT escuela_id FROM public.usuarios WHERE id = auth.uid())
  AND (
    -- Dueño/SuperAdmin: Ven todo
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('Dueño', 'SuperAdministrador'))
    OR
    -- Otros (Admin/Entrenador): Ven su sucursal o todo si el usuario NO tiene sucursal
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND (sucursal_id IS NULL OR sucursal_id = public.alumnos.sucursal_id)
    )
  )
);

-- 4. POLÍTICA DE INSERT (CREACIÓN)
CREATE POLICY "alumnos_insert_policy"
ON public.alumnos
FOR INSERT
TO authenticated
WITH CHECK (
  -- Misma escuela obligatoriamente
  escuela_id IN (SELECT escuela_id FROM public.usuarios WHERE id = auth.uid())
  AND (
    -- Dueño/SuperAdmin: Insertan donde quieran
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('Dueño', 'SuperAdministrador'))
    OR
    -- Otros: Deben insertar en su propia sucursal o si no tienen sucursal asiganda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND (sucursal_id IS NULL OR sucursal_id = public.alumnos.sucursal_id)
    )
  )
);

-- 5. POLÍTICA DE UPDATE (EDICIÓN / ARCHIVADO)
-- Se usa tanto para editar datos como para el campo 'archivado'
CREATE POLICY "alumnos_update_policy"
ON public.alumnos
FOR UPDATE
TO authenticated
USING (
  escuela_id IN (SELECT escuela_id FROM public.usuarios WHERE id = auth.uid())
  AND (
    -- Dueño/SuperAdmin: Todo
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('Dueño', 'SuperAdministrador'))
    OR
    -- Administradores y Entrenadores: Solo su sucursal o toda la escuela si no tienen sucursal asignada
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND (rol IN ('Administrador', 'Entrenador', 'Entrenarqueros'))
      AND (sucursal_id IS NULL OR sucursal_id = public.alumnos.sucursal_id)
    )
    OR
    -- Por si acaso, permitir siempre al profesor asignado explícitamente
    profesor_asignado_id = auth.uid()
  )
)
WITH CHECK (
  escuela_id IN (SELECT escuela_id FROM public.usuarios WHERE id = auth.uid())
  AND (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('Dueño', 'SuperAdministrador'))
    OR
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND (rol IN ('Administrador', 'Entrenador', 'Entrenarqueros'))
      AND (sucursal_id IS NULL OR sucursal_id = public.alumnos.sucursal_id)
    )
    OR
    profesor_asignado_id = auth.uid()
  )
);

-- 6. POLÍTICA DE DELETE (BORRADO FÍSICO)
-- Solo Dueño y SuperAdmin pueden borrar físicamente un registro
CREATE POLICY "alumnos_delete_policy"
ON public.alumnos
FOR DELETE
TO authenticated
USING (
  escuela_id IN (SELECT escuela_id FROM public.usuarios WHERE id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('Dueño', 'SuperAdministrador'))
);

COMMIT;
