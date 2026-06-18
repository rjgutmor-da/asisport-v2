-- Migración: Foto grupal de asistencia
-- Descripción: Crea tabla para almacenar referencias de fotos grupales
-- y bucket de storage para las imágenes.

-- 1. Tabla para almacenar referencia de fotos grupales de asistencia
CREATE TABLE IF NOT EXISTS fotos_asistencia_grupal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escuela_id UUID NOT NULL REFERENCES escuelas(id),
    fecha DATE NOT NULL,
    cancha_id UUID REFERENCES canchas(id),
    horario_id UUID REFERENCES horarios(id),
    entrenador_id UUID NOT NULL,
    foto_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice para consultas eficientes desde SaaSport
CREATE INDEX IF NOT EXISTS idx_fotos_asistencia_grupal_escuela_fecha 
    ON fotos_asistencia_grupal(escuela_id, fecha);

-- 3. RLS (Row Level Security)
ALTER TABLE fotos_asistencia_grupal ENABLE ROW LEVEL SECURITY;

-- Política: los usuarios de la misma escuela pueden insertar
CREATE POLICY "Entrenadores pueden insertar fotos de su escuela"
    ON fotos_asistencia_grupal FOR INSERT
    WITH CHECK (escuela_id = current_user_escuela_id());

-- Política: los usuarios de la misma escuela pueden leer
CREATE POLICY "Usuarios pueden ver fotos de su escuela"
    ON fotos_asistencia_grupal FOR SELECT
    USING (escuela_id = current_user_escuela_id());

-- 4. Crear bucket para fotos de asistencia (público para visualización desde SaaSport)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-asistencias', 'fotos-asistencias', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Política de storage: usuarios autenticados pueden subir
CREATE POLICY "Usuarios autenticados pueden subir fotos de asistencia"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'fotos-asistencias');

-- 6. Política de storage: lectura pública
CREATE POLICY "Fotos de asistencia son publicas"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'fotos-asistencias');
