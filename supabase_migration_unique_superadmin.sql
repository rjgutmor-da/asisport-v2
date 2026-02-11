-- ============================================================================
-- MIGRACIÓN: Garantizar un único SuperAdministrador activo por escuela
-- ============================================================================
-- Fecha: 2026-02-10
-- Descripción: Esta migración asegura que solo puede existir un 
--              SuperAdministrador activo por escuela mediante un índice único parcial.
--              También desactiva usuarios duplicados para evitar conflictos.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PASO 1: Desactivar usuario SuperAdministrador duplicado
-- ----------------------------------------------------------------------------
-- Motivo: Evitar duplicados de SuperAdministrador activo por escuela 
--         sin violar la constraint CHECK sobre la columna rol.
-- Usuario afectado: 5a8cbc54-c739-4a0a-aad9-5bcbc36152a7
-- ----------------------------------------------------------------------------

UPDATE public.usuarios
SET activo = false
WHERE id = '5a8cbc54-c739-4a0a-aad9-5bcbc36152a7';

-- ----------------------------------------------------------------------------
-- PASO 2: Crear índice único parcial para SuperAdministrador
-- ----------------------------------------------------------------------------
-- Propósito: Garantizar que por cada escuela_id exista como máximo 
--            un SuperAdministrador activo.
-- Índice: uniq_superadmin_per_escuela
-- Condición: Solo aplica a filas donde rol = 'SuperAdministrador' AND activo = true
-- ----------------------------------------------------------------------------

-- Eliminar índice previo si existe (para evitar conflictos de nombre)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'uniq_superadmin_per_escuela'
  ) THEN
    EXECUTE 'DROP INDEX public.uniq_superadmin_per_escuela';
  END IF;
END$$;

-- Crear el índice único parcial
CREATE UNIQUE INDEX uniq_superadmin_per_escuela
ON public.usuarios(escuela_id)
WHERE rol = 'SuperAdministrador' AND activo = true;

COMMIT;

-- ============================================================================
-- QUERIES DE VERIFICACIÓN
-- ============================================================================

-- Verificar el usuario modificado
-- SELECT id, email, rol, activo, escuela_id, updated_at
-- FROM public.usuarios
-- WHERE id = '5a8cbc54-c739-4a0a-aad9-5bcbc36152a7';

-- Verificar que el índice fue creado correctamente
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' 
--   AND tablename = 'usuarios' 
--   AND indexname = 'uniq_superadmin_per_escuela';

-- Listar SuperAdministradores activos por escuela (detectar conflictos)
-- SELECT escuela_id, count(*) AS superadmin_count,
--        json_agg(json_build_object('id', id, 'email', email, 'activo', activo)) AS usuarios
-- FROM public.usuarios
-- WHERE rol = 'SuperAdministrador' AND activo = true
-- GROUP BY escuela_id
-- HAVING count(*) > 0;

-- ============================================================================
-- ROLLBACK (si es necesario revertir los cambios)
-- ============================================================================

-- Reactivar el usuario desactivado
-- UPDATE public.usuarios
-- SET activo = true
-- WHERE id = '5a8cbc54-c739-4a0a-aad9-5bcbc36152a7';

-- Eliminar el índice único
-- DROP INDEX IF EXISTS public.uniq_superadmin_per_escuela;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Este índice parcial NO afecta a usuarios con otros roles.
-- 2. Permite múltiples SuperAdministradores inactivos por escuela.
-- 3. Solo restringe SuperAdministradores activos (uno por escuela).
-- 4. Si intentas activar un segundo SuperAdministrador para la misma escuela,
--    PostgreSQL lanzará un error de violación de índice único.
-- 5. Antes de activar un nuevo SuperAdministrador, debes desactivar el actual.
-- ============================================================================
