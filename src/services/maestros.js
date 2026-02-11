import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

export const getCanchas = async () => {
    // Obtener escuela_id del usuario actual mediante RPC
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('canchas')
        .select('*')
        .eq('escuela_id', escuelaId)
        .eq('activo', true);

    if (error) throw error;
    return data;
};

export const getHorarios = async () => {
    // Obtener escuela_id del usuario actual mediante RPC
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('escuela_id', escuelaId)
        .eq('activo', true)
        .order('hora', { ascending: true });

    if (error) throw error;
    return data;
};

export const getEntrenadores = async () => {
    // Obtener escuela_id del usuario actual mediante RPC
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos')
        .eq('escuela_id', escuelaId)
        .eq('rol', 'Entrenador')
        .eq('activo', true);

    if (error) throw error;
    return data;
};

// ============================================================================
// CRUD de Canchas
// ============================================================================

/**
 * Obtener todas las canchas (activas e inactivas)
 * Regla #18: Canchas son específicas de cada escuela
 */
export const getAllCanchas = async () => {
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('canchas')
        .select('*')
        .eq('escuela_id', escuelaId)
        .order('nombre', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Crear nueva cancha
 * Regla #18: Solo Admin/SuperAdmin pueden gestionar canchas
 */
export const createCancha = async (nombre) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la cancha es obligatorio.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados
    const { data: existing } = await supabase
        .from('canchas')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una cancha con este nombre.');
    }

    const { data, error } = await supabase
        .from('canchas')
        .insert([{
            nombre: nombre.trim(),
            escuela_id: escuelaId,
            activo: true
        }])
        .select()
        .single();

    if (error) throw new Error('Error al crear cancha: ' + error.message);
    return data;
};

/**
 * Actualizar nombre de cancha
 */
export const updateCancha = async (id, nombre) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la cancha es obligatorio.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados (excepto la misma cancha)
    const { data: existing } = await supabase
        .from('canchas')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .neq('id', id)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una cancha con este nombre.');
    }

    const { data, error } = await supabase
        .from('canchas')
        .update({ nombre: nombre.trim() })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al actualizar cancha: ' + error.message);
    return data;
};

/**
 * Activar/Desactivar cancha (soft delete)
 * Validar que no tenga alumnos activos asignados antes de desactivar
 */
export const toggleCanchaStatus = async (id, currentStatus) => {
    const escuelaId = await obtenerEscuelaId();

    // Si está activando, permitir directamente
    if (!currentStatus) {
        const { data, error } = await supabase
            .from('canchas')
            .update({ activo: true })
            .eq('id', id)
            .eq('escuela_id', escuelaId)
            .select()
            .single();

        if (error) throw new Error('Error al activar cancha: ' + error.message);
        return data;
    }

    // Si está desactivando, verificar que no tenga alumnos activos
    const { count, error: countError } = await supabase
        .from('alumnos')
        .select('id', { count: 'exact', head: true })
        .eq('cancha_id', id)
        .eq('archivado', false);

    if (countError) throw new Error('Error al verificar alumnos: ' + countError.message);

    if (count > 0) {
        throw new Error(`No se puede desactivar. Hay ${count} alumno(s) activo(s) asignado(s) a esta cancha.`);
    }

    const { data, error } = await supabase
        .from('canchas')
        .update({ activo: false })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al desactivar cancha: ' + error.message);
    return data;
};

// ============================================================================
// CRUD de Horarios
// ============================================================================

/**
 * Obtener todos los horarios (activos e inactivos)
 * Regla #18: Horarios son específicos de cada escuela
 */
export const getAllHorarios = async () => {
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('escuela_id', escuelaId)
        .order('hora', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Crear nuevo horario
 * Regla #18: Solo Admin/SuperAdmin pueden gestionar horarios
 */
export const createHorario = async (hora) => {
    if (!hora || hora.trim() === '') {
        throw new Error('La hora es obligatoria.');
    }

    // Validar formato HH:MM
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(hora.trim())) {
        throw new Error('Formato de hora inválido. Use HH:MM (ejemplo: 18:00).');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados
    const { data: existing } = await supabase
        .from('horarios')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('hora', hora.trim())
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe un horario con esta hora.');
    }

    const { data, error } = await supabase
        .from('horarios')
        .insert([{
            hora: hora.trim(),
            escuela_id: escuelaId,
            activo: true
        }])
        .select()
        .single();

    if (error) throw new Error('Error al crear horario: ' + error.message);
    return data;
};

/**
 * Actualizar horario
 */
export const updateHorario = async (id, hora) => {
    if (!hora || hora.trim() === '') {
        throw new Error('La hora es obligatoria.');
    }

    // Validar formato HH:MM
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(hora.trim())) {
        throw new Error('Formato de hora inválido. Use HH:MM (ejemplo: 18:00).');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados (excepto el mismo horario)
    const { data: existing } = await supabase
        .from('horarios')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('hora', hora.trim())
        .neq('id', id)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe un horario con esta hora.');
    }

    const { data, error } = await supabase
        .from('horarios')
        .update({ hora: hora.trim() })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al actualizar horario: ' + error.message);
    return data;
};

/**
 * Activar/Desactivar horario (soft delete)
 * Validar que no tenga alumnos activos asignados antes de desactivar
 */
export const toggleHorarioStatus = async (id, currentStatus) => {
    const escuelaId = await obtenerEscuelaId();

    // Si está activando, permitir directamente
    if (!currentStatus) {
        const { data, error } = await supabase
            .from('horarios')
            .update({ activo: true })
            .eq('id', id)
            .eq('escuela_id', escuelaId)
            .select()
            .single();

        if (error) throw new Error('Error al activar horario: ' + error.message);
        return data;
    }

    // Si está desactivando, verificar que no tenga alumnos activos
    const { count, error: countError } = await supabase
        .from('alumnos')
        .select('id', { count: 'exact', head: true })
        .eq('horario_id', id)
        .eq('archivado', false);

    if (countError) throw new Error('Error al verificar alumnos: ' + countError.message);

    if (count > 0) {
        throw new Error(`No se puede desactivar. Hay ${count} alumno(s) activo(s) asignado(s) a este horario.`);
    }

    const { data, error } = await supabase
        .from('horarios')
        .update({ activo: false })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al desactivar horario: ' + error.message);
    return data;
};

