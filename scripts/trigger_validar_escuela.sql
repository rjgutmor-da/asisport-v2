-- ══════════════════════════════════════════════════════════════
-- Trigger: Prevenir usuarios huérfanos
-- 
-- Valida que al insertar o actualizar un registro en `usuarios`,
-- el `escuela_id` sea una escuela activa que existe en `escuelas`.
--
-- Ejecutar en el SQL Editor de Supabase Dashboard.
-- ══════════════════════════════════════════════════════════════

-- 1. Crear la función del trigger
CREATE OR REPLACE FUNCTION validar_escuela_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir escuela_id NULL solo si el usuario es SuperAdministrador
    IF NEW.escuela_id IS NULL THEN
        IF NEW.rol = 'SuperAdministrador' THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'El campo escuela_id es obligatorio para el rol %', NEW.rol;
        END IF;
    END IF;

    -- Verificar que la escuela existe y está activa
    IF NOT EXISTS (
        SELECT 1 FROM escuelas 
        WHERE id = NEW.escuela_id 
        AND activa = true
    ) THEN
        RAISE EXCEPTION 'La escuela_id % no existe o no está activa', NEW.escuela_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear el trigger en la tabla usuarios
DROP TRIGGER IF EXISTS trigger_validar_escuela ON usuarios;

CREATE TRIGGER trigger_validar_escuela
    BEFORE INSERT OR UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION validar_escuela_usuario();

-- ══════════════════════════════════════════════════════════════
-- Verificación: Probar que funciona
-- ══════════════════════════════════════════════════════════════

-- Esto debe FALLAR (escuela_id inexistente):
-- INSERT INTO usuarios (id, email, nombres, apellidos, rol, escuela_id, activo)
-- VALUES (gen_random_uuid(), 'test@test.com', 'Test', 'User', 'Entrenador', gen_random_uuid(), true);

-- Esto debe FUNCIONAR (escuela_id válida):
-- INSERT INTO usuarios (id, email, nombres, apellidos, rol, escuela_id, activo)
-- VALUES (gen_random_uuid(), 'test@test.com', 'Test', 'User', 'Entrenador', '91b2a748-f956-41e7-8efe-075257a0889a', true);
