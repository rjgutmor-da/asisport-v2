import { supabase } from '../../../lib/supabaseClient';
import { obtenerEscuelaId } from '../../../lib/rpcHelper';

/**
 * Obtiene los antecedentes médicos estáticos de un alumno.
 * @param {string} alumnoId
 * @returns {Promise<object|null>}
 */
export const getFichaMedica = async (alumnoId) => {
    const { data, error } = await supabase
        .from('fichas_medicas')
        .select('*')
        .eq('alumno_id', alumnoId)
        .maybeSingle();

    if (error) throw error;
    return data;
};

/**
 * Crea o actualiza la ficha médica (antecedentes) de un alumno.
 * Solo el rol Médico puede ejecutar esto (RLS lo garantiza en BD).
 * @param {object} fichaData - { alumno_id, antecedentes_personales, alergias, cirugias_previas, club_anterior }
 */
export const upsertFichaMedica = async (fichaData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    const payload = {
        alumno_id: fichaData.alumno_id,
        escuela_id: escuelaId,
        antecedentes_personales: fichaData.antecedentes_personales?.trim() || null,
        alergias: fichaData.alergias?.trim() || null,
        cirugias_previas: fichaData.cirugias_previas?.trim() || null,
        club_anterior: fichaData.club_anterior?.trim() || null,
        antecedentes_familiares: fichaData.antecedentes_familiares || null,
        sintomas_esfuerzo: fichaData.sintomas_esfuerzo || null,
        trauma_craneal: fichaData.trauma_craneal || null,
        updated_by: user.id,
    };

    // Si es creación, agregar created_by
    if (!fichaData.id) {
        payload.created_by = user.id;
    }

    const { data, error } = await supabase
        .from('fichas_medicas')
        .upsert(payload, { onConflict: 'alumno_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Obtiene el historial de evaluaciones médicas de un alumno, ordenadas de más reciente a más antigua.
 * @param {string} alumnoId
 * @returns {Promise<Array>}
 */
export const getEvaluaciones = async (alumnoId) => {
    const { data, error } = await supabase
        .from('evaluaciones_medicas')
        .select(`
            *,
            medico:medico_id (
                id,
                nombres,
                apellidos,
                matricula_medica
            )
        `)
        .eq('alumno_id', alumnoId)
        .order('fecha_evaluacion', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Crea una nueva evaluación médica para un alumno.
 * Solo 1 por día (garantizado por constraint UNIQUE en BD).
 * @param {object} evalData
 */
export const createEvaluacion = async (evalData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    const payload = {
        alumno_id: evalData.alumno_id,
        escuela_id: escuelaId,
        fecha_evaluacion: evalData.fecha_evaluacion || new Date().toISOString().split('T')[0],
        presion_arterial: evalData.presion_arterial?.trim() || null,
        frecuencia_cardiaca: evalData.frecuencia_cardiaca ? parseInt(evalData.frecuencia_cardiaca) : null,
        frecuencia_respiratoria: evalData.frecuencia_respiratoria ? parseInt(evalData.frecuencia_respiratoria) : null,
        saturacion_oxigeno: evalData.saturacion_oxigeno ? parseFloat(evalData.saturacion_oxigeno) : null,
        peso_kg: evalData.peso_kg ? parseFloat(evalData.peso_kg) : null,
        talla_cm: evalData.talla_cm ? parseFloat(evalData.talla_cm) : null,
        estado_general: evalData.estado_general || null,
        examen_fisico: evalData.examen_fisico?.trim() || null,
        aptitud_deportiva: evalData.aptitud_deportiva,
        observaciones: evalData.observaciones?.trim() || null,
        proxima_revision: evalData.proxima_revision || null,
        pulsos_perifericos: evalData.pulsos_perifericos || null,
        eval_cardiovascular: evalData.eval_cardiovascular || null,
        eval_respiratorio: evalData.eval_respiratorio || null,
        eval_musculoesqueletico: evalData.eval_musculoesqueletico || null,
        eval_funcional: evalData.eval_funcional || null,
        deporte: evalData.deporte || 'Fútbol',
        restricciones_aptitud: evalData.restricciones_aptitud?.trim() || null,
        medico_id: user.id,
    };

    if (!payload.aptitud_deportiva) {
        throw new Error('El campo "Aptitud Deportiva" es obligatorio.');
    }

    const { data, error } = await supabase
        .from('evaluaciones_medicas')
        .insert(payload)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('Ya existe una evaluación registrada para este alumno hoy.');
        }
        throw error;
    }
    return data;
};

/**
 * Actualiza una evaluación existente. Solo permitido el mismo día de creación.
 * @param {string} evaluacionId
 * @param {object} evalData
 */
export const updateEvaluacion = async (evaluacionId, evalData) => {
    const hoy = new Date().toISOString().split('T')[0];

    // Verificar que la evaluación es de hoy
    const { data: existing, error: fetchError } = await supabase
        .from('evaluaciones_medicas')
        .select('fecha_evaluacion')
        .eq('id', evaluacionId)
        .single();

    if (fetchError) throw fetchError;
    if (existing.fecha_evaluacion !== hoy) {
        throw new Error('Solo puedes editar evaluaciones del día de hoy.');
    }

    const payload = {
        presion_arterial: evalData.presion_arterial?.trim() || null,
        frecuencia_cardiaca: evalData.frecuencia_cardiaca ? parseInt(evalData.frecuencia_cardiaca) : null,
        frecuencia_respiratoria: evalData.frecuencia_respiratoria ? parseInt(evalData.frecuencia_respiratoria) : null,
        saturacion_oxigeno: evalData.saturacion_oxigeno ? parseFloat(evalData.saturacion_oxigeno) : null,
        peso_kg: evalData.peso_kg ? parseFloat(evalData.peso_kg) : null,
        talla_cm: evalData.talla_cm ? parseFloat(evalData.talla_cm) : null,
        estado_general: evalData.estado_general || null,
        examen_fisico: evalData.examen_fisico?.trim() || null,
        aptitud_deportiva: evalData.aptitud_deportiva,
        observaciones: evalData.observaciones?.trim() || null,
        proxima_revision: evalData.proxima_revision || null,
        pulsos_perifericos: evalData.pulsos_perifericos || null,
        eval_cardiovascular: evalData.eval_cardiovascular || null,
        eval_respiratorio: evalData.eval_respiratorio || null,
        eval_musculoesqueletico: evalData.eval_musculoesqueletico || null,
        eval_funcional: evalData.eval_funcional || null,
        deporte: evalData.deporte || 'Fútbol',
        restricciones_aptitud: evalData.restricciones_aptitud?.trim() || null,
    };

    const { data, error } = await supabase
        .from('evaluaciones_medicas')
        .update(payload)
        .eq('id', evaluacionId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Obtiene el estado de la escuela del usuario actual respecto al módulo de Ficha Médica.
 * @returns {Promise<boolean>}
 */
export const isFichaMedicaHabilitada = async () => {
    const escuelaId = await obtenerEscuelaId();
    const { data, error } = await supabase
        .from('escuelas')
        .select('ficha_medica_habilitada')
        .eq('id', escuelaId)
        .single();

    if (error) return false;
    return data?.ficha_medica_habilitada === true;
};
