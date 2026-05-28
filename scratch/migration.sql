-- Ejecuta este script en el editor SQL de tu panel de Supabase
ALTER TABLE alumnos ADD COLUMN tipo TEXT DEFAULT 'Formativo';
ALTER TABLE alumnos ADD COLUMN mensualidad NUMERIC;
