-- Migración: Fix de RLS para creación de usuarios por parte de Dueños y Administradores
-- Fecha: 2026-03-26

-- 1. Eliminar políticas anteriores que impedían la gestión completa a los Dueños
DROP POLICY IF EXISTS "solo_superadmin_gestiona_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow owner to update all" ON public.usuarios;

-- 2. Nueva política: Permitir a Dueño, Administrador y SuperAdministrador gestionar 
-- (INSERT, SELECT, UPDATE, DELETE) a cualquier usuario de su propia escuela.
CREATE POLICY "gestion_usuarios_escuela" ON public.usuarios
FOR ALL TO authenticated
USING (
    (current_user_rol() IN ('Dueño', 'Administrador', 'SuperAdministrador'))
    AND (escuela_id = current_user_escuela_id())
)
WITH CHECK (
    (current_user_rol() IN ('Dueño', 'Administrador', 'SuperAdministrador'))
    AND (escuela_id = current_user_escuela_id())
);

-- Notas:
-- 'current_user_rol()' y 'current_user_escuela_id()' son funciones personalizadas que usamos en este proyecto.
-- Esta política habilita la gestión descentralizada de usuarios por cada escuela.
