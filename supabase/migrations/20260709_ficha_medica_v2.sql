-- =============================================================================
-- MIGRACIÓN: Reestructuración de Ficha Médica v2
-- Fecha: 2026-07-09
-- Descripción:
--   1. Agrega columnas de antecedentes JSONB a fichas_medicas
--   2. Agrega columnas de evaluación clínica por sistemas y funcional a evaluaciones_medicas
-- =============================================================================

-- 1. Agregar campos a fichas_medicas (Antecedentes estáticos)
ALTER TABLE public.fichas_medicas
    ADD COLUMN IF NOT EXISTS antecedentes_familiares jsonb NULL,
    ADD COLUMN IF NOT EXISTS sintomas_esfuerzo jsonb NULL,
    ADD COLUMN IF NOT EXISTS trauma_craneal jsonb NULL;

COMMENT ON COLUMN public.fichas_medicas.antecedentes_familiares IS
    'JSONB structure: { tiene: boolean, detalle: string } - Cribado de Muerte Súbita familiar';
COMMENT ON COLUMN public.fichas_medicas.sintomas_esfuerzo IS
    'JSONB structure: { palpitaciones: bool, dolor_pecho: bool, sincope: bool, disnea: bool, detalle: string } - Síntomas durante esfuerzo';
COMMENT ON COLUMN public.fichas_medicas.trauma_craneal IS
    'JSONB structure: { tiene: boolean, detalle: string } - Historial de conmociones por choque';

-- 2. Agregar campos a evaluaciones_medicas (Evaluación periódica)
ALTER TABLE public.evaluaciones_medicas
    ADD COLUMN IF NOT EXISTS pulsos_perifericos varchar(50) NULL,
    ADD COLUMN IF NOT EXISTS eval_cardiovascular jsonb NULL,
    ADD COLUMN IF NOT EXISTS eval_respiratorio jsonb NULL,
    ADD COLUMN IF NOT EXISTS eval_musculoesqueletico jsonb NULL,
    ADD COLUMN IF NOT EXISTS eval_funcional jsonb NULL,
    ADD COLUMN IF NOT EXISTS deporte varchar(100) NOT NULL DEFAULT 'Fútbol',
    ADD COLUMN IF NOT EXISTS restricciones_aptitud text NULL;

COMMENT ON COLUMN public.evaluaciones_medicas.pulsos_perifericos IS
    'Simétricos y presentes / Asimétricos o ausentes';
COMMENT ON COLUMN public.evaluaciones_medicas.eval_cardiovascular IS
    'JSONB structure: { auscultacion_supino: string, auscultacion_bipedestacion: string, soplos: bool, observaciones: string }';
COMMENT ON COLUMN public.evaluaciones_medicas.eval_respiratorio IS
    'JSONB structure: { auscultacion: string, hallazgos: string }';
COMMENT ON COLUMN public.evaluaciones_medicas.eval_musculoesqueletico IS
    'JSONB structure: { estabilidad_ligamentosa: string, test_adams: string, osgood_schlatter: string, observaciones: string }';
COMMENT ON COLUMN public.evaluaciones_medicas.eval_funcional IS
    'JSONB structure: { marcha: string, equilibrio: string, fuerza: string, dolor_movimiento: boolean, dolor_zona: string }';
COMMENT ON COLUMN public.evaluaciones_medicas.deporte IS
    'Deporte que practica el alumno';
COMMENT ON COLUMN public.evaluaciones_medicas.restricciones_aptitud IS
    'Condiciones obligatorias si aptitud_deportiva es Apto con restricciones';
