-- ============================================================================
-- SCRIPT DE CORRECCIÓN: RLS INSERT/UPDATE/DELETE para asistencias_normales
-- ============================================================================
-- Permite que Administradores, Dueños y SuperAdministradores puedan insertar,
-- actualizar y eliminar asistencias en cualquier registro de su escuela.
-- ============================================================================

BEGIN;

-- Ojo: No elimino las políticas, sino que agrego una política nueva permisiva para los administradores.
-- Esto asume que el esquema usa auth.uid() para verificar roles

CREATE POLICY "Permitir ALL a admins en asistencias_normales"
ON public.asistencias_normales
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol = 'SuperAdministrador' OR rol = 'Administrador' OR rol = 'Dueño')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (rol = 'SuperAdministrador' OR rol = 'Administrador' OR rol = 'Dueño')
  )
);

COMMIT;
