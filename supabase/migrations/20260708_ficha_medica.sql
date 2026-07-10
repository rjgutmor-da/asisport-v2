-- =============================================================================
-- MIGRACIÓN: Módulo Ficha Médica
-- Fecha: 2026-07-08
-- Descripción:
--   1. Agrega rol 'Medico' al constraint de usuarios
--   2. Agrega columna matricula_medica a usuarios
--   3. Agrega columna ficha_medica_habilitada a escuelas
--   4. Crea tabla fichas_medicas (antecedentes estáticos por alumno)
--   5. Crea tabla evaluaciones_medicas (historial periódico)
--   6. RLS policies para ambas tablas
-- =============================================================================

-- -------------------------------------------------------
-- 1. Actualizar constraint de roles en usuarios
-- -------------------------------------------------------
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check
    CHECK (rol = ANY (ARRAY[
        'Administrador'::text,
        'Entrenador'::text,
        'Entrenarqueros'::text,
        'SuperAdministrador'::text,
        'Asistente'::text,
        'Medico'::text
    ]));

-- -------------------------------------------------------
-- 2. Columna matrícula médica en usuarios
-- -------------------------------------------------------
ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS matricula_medica varchar(50) NULL;

COMMENT ON COLUMN public.usuarios.matricula_medica IS
    'Número de matrícula del médico. Solo aplica para el rol Medico.';

-- -------------------------------------------------------
-- 3. Flag de módulo en escuelas
-- -------------------------------------------------------
ALTER TABLE public.escuelas
    ADD COLUMN IF NOT EXISTS ficha_medica_habilitada boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.escuelas.ficha_medica_habilitada IS
    'Habilita el módulo de Ficha Médica para esta escuela (módulo de pago).';

-- -------------------------------------------------------
-- 4. Tabla: fichas_medicas (antecedentes estáticos, 1 por alumno)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fichas_medicas (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    escuela_id      uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,

    -- Antecedentes estáticos
    antecedentes_personales text,
    alergias                text,
    cirugias_previas        text,

    -- Auditoría
    created_by  uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    updated_by  uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    -- Un solo registro de antecedentes por alumno
    CONSTRAINT fichas_medicas_alumno_unique UNIQUE (alumno_id)
);

COMMENT ON TABLE public.fichas_medicas IS
    'Antecedentes médicos estáticos de un alumno. Se crea una vez y puede actualizarse.';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_fichas_medicas_updated_at ON public.fichas_medicas;
CREATE TRIGGER set_fichas_medicas_updated_at
    BEFORE UPDATE ON public.fichas_medicas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------
-- 5. Tabla: evaluaciones_medicas (historial periódico)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluaciones_medicas (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id       uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    escuela_id      uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,

    -- Identificación de la evaluación
    fecha_evaluacion    date NOT NULL DEFAULT CURRENT_DATE,

    -- Signos vitales
    presion_arterial        varchar(20),   -- Ej: "120/70"
    frecuencia_cardiaca     integer,       -- lpm
    frecuencia_respiratoria integer,       -- rpm
    saturacion_oxigeno      numeric(5,2),  -- %
    peso_kg                 numeric(5,2),  -- kg
    talla_cm                numeric(5,2),  -- cm

    -- Evaluación clínica
    estado_general      varchar(10) CHECK (estado_general IN ('Bueno', 'Regular', 'Malo')),
    examen_fisico       text,
    aptitud_deportiva   varchar(30) NOT NULL CHECK (aptitud_deportiva IN ('Apto', 'Apto con restricciones', 'No apto')),
    observaciones       text,
    proxima_revision    date,

    -- Auditoría
    medico_id   uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),

    -- Máximo 1 evaluación por alumno por día
    CONSTRAINT evaluaciones_medicas_alumno_fecha_unique UNIQUE (alumno_id, fecha_evaluacion)
);

COMMENT ON TABLE public.evaluaciones_medicas IS
    'Historial de evaluaciones médicas periódicas de un alumno. Inmutable salvo el día de creación.';

COMMENT ON COLUMN public.evaluaciones_medicas.aptitud_deportiva IS
    'Estado de aptitud: Apto (verde), Apto con restricciones (ámbar), No apto (rojo).';

-- Índice para consultas frecuentes (alumno + fecha descendente)
CREATE INDEX IF NOT EXISTS idx_evaluaciones_alumno_fecha
    ON public.evaluaciones_medicas (alumno_id, fecha_evaluacion DESC);

-- Índice para filtrar por escuela
CREATE INDEX IF NOT EXISTS idx_evaluaciones_escuela
    ON public.evaluaciones_medicas (escuela_id);

-- -------------------------------------------------------
-- 6. RLS: Habilitar en ambas tablas
-- -------------------------------------------------------
ALTER TABLE public.fichas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_medicas ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES: fichas_medicas
-- =============================================================================

-- Médico: acceso total a fichas de su escuela
DROP POLICY IF EXISTS "medico_full_fichas" ON public.fichas_medicas;
CREATE POLICY "medico_full_fichas" ON public.fichas_medicas
    FOR ALL TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Medico'
    )
    WITH CHECK (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Medico'
    );

-- SuperAdministrador y Administrador: solo lectura, filtrada por escuela
DROP POLICY IF EXISTS "admin_read_fichas" ON public.fichas_medicas;
CREATE POLICY "admin_read_fichas" ON public.fichas_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = ANY (ARRAY['SuperAdministrador', 'Administrador', 'Asistente'])
    );

-- Entrenador: solo lectura de fichas de sus alumnos asignados
DROP POLICY IF EXISTS "entrenador_read_fichas" ON public.fichas_medicas;
CREATE POLICY "entrenador_read_fichas" ON public.fichas_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Entrenador'
        AND EXISTS (
            SELECT 1 FROM public.alumnos a
            WHERE a.id = fichas_medicas.alumno_id
              AND (
                  a.profesor_asignado_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.alumnos_entrenadores ae
                      WHERE ae.alumno_id = a.id AND ae.entrenador_id = auth.uid()
                  )
              )
        )
    );

-- Entrenador de Arqueros: solo lectura de fichas de sus arqueros
DROP POLICY IF EXISTS "entrenarqueros_read_fichas" ON public.fichas_medicas;
CREATE POLICY "entrenarqueros_read_fichas" ON public.fichas_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Entrenarqueros'
        AND EXISTS (
            SELECT 1 FROM public.alumnos a
            WHERE a.id = fichas_medicas.alumno_id
              AND a.es_arquero = true
              AND (
                  a.profesor_asignado_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.alumnos_entrenadores ae
                      WHERE ae.alumno_id = a.id AND ae.entrenador_id = auth.uid()
                  )
              )
        )
    );

-- =============================================================================
-- RLS POLICIES: evaluaciones_medicas
-- =============================================================================

-- Médico: acceso total a evaluaciones de su escuela
DROP POLICY IF EXISTS "medico_full_evaluaciones" ON public.evaluaciones_medicas;
CREATE POLICY "medico_full_evaluaciones" ON public.evaluaciones_medicas
    FOR ALL TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Medico'
    )
    WITH CHECK (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Medico'
    );

-- SuperAdministrador, Administrador y Asistente: solo lectura por escuela
DROP POLICY IF EXISTS "admin_read_evaluaciones" ON public.evaluaciones_medicas;
CREATE POLICY "admin_read_evaluaciones" ON public.evaluaciones_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = ANY (ARRAY['SuperAdministrador', 'Administrador', 'Asistente'])
    );

-- Entrenador: solo lectura de evaluaciones de sus alumnos asignados
DROP POLICY IF EXISTS "entrenador_read_evaluaciones" ON public.evaluaciones_medicas;
CREATE POLICY "entrenador_read_evaluaciones" ON public.evaluaciones_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Entrenador'
        AND EXISTS (
            SELECT 1 FROM public.alumnos a
            WHERE a.id = evaluaciones_medicas.alumno_id
              AND (
                  a.profesor_asignado_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.alumnos_entrenadores ae
                      WHERE ae.alumno_id = a.id AND ae.entrenador_id = auth.uid()
                  )
              )
        )
    );

-- Entrenador de Arqueros: solo lectura de evaluaciones de sus arqueros
DROP POLICY IF EXISTS "entrenarqueros_read_evaluaciones" ON public.evaluaciones_medicas;
CREATE POLICY "entrenarqueros_read_evaluaciones" ON public.evaluaciones_medicas
    FOR SELECT TO authenticated
    USING (
        escuela_id = current_user_escuela_id()
        AND (current_user_rol())::text = 'Entrenarqueros'
        AND EXISTS (
            SELECT 1 FROM public.alumnos a
            WHERE a.id = evaluaciones_medicas.alumno_id
              AND a.es_arquero = true
              AND (
                  a.profesor_asignado_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.alumnos_entrenadores ae
                      WHERE ae.alumno_id = a.id AND ae.entrenador_id = auth.uid()
                  )
              )
        )
    );
