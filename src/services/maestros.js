import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import { cacheService } from '../lib/cacheService';

export const getCanchas = async () => {
    // Verificar caché antes de consultar Supabase
    const cached = cacheService.get('canchas');
    if (cached) return cached;

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('canchas')
        .select('*')
        .eq('escuela_id', escuelaId)
        .eq('activo', true);

    if (error) throw error;

    // Guardar en caché (5 minutos por defecto)
    cacheService.set('canchas', data);
    return data;
};

export const getHorarios = async () => {
    // Verificar caché antes de consultar Supabase
    const cached = cacheService.get('horarios');
    if (cached) return cached;

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('escuela_id', escuelaId)
        .eq('activo', true)
        .order('hora', { ascending: true });

    if (error) throw error;

    // Guardar en caché (5 minutos por defecto)
    cacheService.set('horarios', data);
    return data;
};

/**
 * Obtiene las canchas únicas de los alumnos asignados a un entrenador.
 * Si userId no se provee (admin), devuelve todas las canchas activas.
 * @param {string|null} userId - ID del entrenador (null para admins)
 * @param {string|null} userRole - Rol del usuario
 */
export const getCanchasParaEntrenador = async (userId = null, userRole = null) => {
    const esEntrenador = userRole === 'Entrenador' || userRole === 'Entrenarqueros';

    if (!esEntrenador) {
        // Para admins devolver todas las canchas activas
        return getCanchas();
    }

    const escuelaId = await obtenerEscuelaId();

    // Obtener cancha_id únicos de los alumnos del entrenador
    let query = supabase
        .from('alumnos')
        .select('cancha_id, cancha:canchas(id, nombre)')
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (userRole === 'Entrenador' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    } else if (userRole === 'Entrenarqueros') {
        query = query.eq('es_arquero', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Extraer canchas únicas
    const canchasMap = new Map();
    data.forEach(a => {
        if (a.cancha_id && a.cancha) {
            canchasMap.set(a.cancha_id, { id: a.cancha_id, nombre: a.cancha.nombre });
        }
    });

    return Array.from(canchasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

/**
 * Obtiene los horarios únicos de los alumnos asignados a un entrenador.
 * Si userId no se provee (admin), devuelve todos los horarios activos.
 * @param {string|null} userId - ID del entrenador (null para admins)
 * @param {string|null} userRole - Rol del usuario
 */
export const getHorariosParaEntrenador = async (userId = null, userRole = null) => {
    const esEntrenador = userRole === 'Entrenador' || userRole === 'Entrenarqueros';

    if (!esEntrenador) {
        // Para admins devolver todos los horarios activos
        return getHorarios();
    }

    const escuelaId = await obtenerEscuelaId();

    let query = supabase
        .from('alumnos')
        .select('horario_id, horario:horarios(id, hora)')
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (userRole === 'Entrenador' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    } else if (userRole === 'Entrenarqueros') {
        query = query.eq('es_arquero', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Extraer horarios únicos
    const horariosMap = new Map();
    data.forEach(a => {
        if (a.horario_id && a.horario) {
            horariosMap.set(a.horario_id, { id: a.horario_id, hora: a.horario.hora });
        }
    });

    return Array.from(horariosMap.values()).sort((a, b) => a.hora.localeCompare(b.hora));
};

export const getEntrenadores = async () => {
    // Se usa 'entrenadores_v2' como clave de caché para forzar recarga fresca
    // que incluya el campo sucursal_id (nuevo desde el filtrado por sucursal)
    const cached = cacheService.get('entrenadores_v2');
    if (cached) return cached;

    const escuelaId = await obtenerEscuelaId();

    // Se incluye sucursal_id para poder filtrar entrenadores por sucursal en el formulario de registro
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos, sucursal_id')
        .eq('escuela_id', escuelaId)
        .eq('rol', 'Entrenador')
        .eq('activo', true);

    if (error) throw error;

    // Guardar en caché (5 minutos por defecto)
    cacheService.set('entrenadores_v2', data);
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
        // Se incluye la sucursal relacionada para mostrarla en la UI
        .select('*, sucursal:sucursales(id, nombre)')
        .eq('escuela_id', escuelaId)
        .order('nombre', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Crear nueva cancha
 * Regla #18: Solo Admin/SuperAdmin pueden gestionar canchas
 */
export const createCancha = async (nombre, sucursalId = null) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la cancha es obligatorio.');
    }
    if (!sucursalId) {
        throw new Error('Debes seleccionar una sucursal para la cancha.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados dentro de la misma sucursal
    const { data: existing } = await supabase
        .from('canchas')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .eq('sucursal_id', sucursalId)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una cancha con este nombre en esa sucursal.');
    }

    const { data, error } = await supabase
        .from('canchas')
        .insert([{
            nombre: nombre.trim(),
            escuela_id: escuelaId,
            sucursal_id: sucursalId,
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
export const updateCancha = async (id, nombre, sucursalId = null) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la cancha es obligatorio.');
    }
    if (!sucursalId) {
        throw new Error('Debes seleccionar una sucursal para la cancha.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados (excepto la misma cancha, dentro de la misma sucursal)
    const { data: existing } = await supabase
        .from('canchas')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .eq('sucursal_id', sucursalId)
        .neq('id', id)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una cancha con este nombre en esa sucursal.');
    }

    const { data, error } = await supabase
        .from('canchas')
        .update({ nombre: nombre.trim(), sucursal_id: sucursalId })
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

