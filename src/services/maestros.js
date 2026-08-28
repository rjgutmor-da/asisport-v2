import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import { cacheService } from '../lib/cacheService';
import { getDataScope } from '../config/roles';

export const getGrupos = async () => {
    // Verificar caché antes de consultar Supabase
    const cached = cacheService.get('grupos_v4_canchas');
    if (cached) return cached;

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('canchas')
        .select('id, nombre, sucursal_id, canchas_horarios(horario_id)')
        .eq('escuela_id', escuelaId)
        .eq('activo', true);

    if (error) throw error;

    const formatted = (data || []).map(c => ({
        id: c.id,
        nombre: c.nombre,
        sucursal_id: c.sucursal_id,
        horario_ids: (c.canchas_horarios || []).map(ch => ch.horario_id)
    }));

    // Guardar en caché (5 minutos por defecto)
    cacheService.set('grupos_v4_canchas', formatted);
    return formatted;
};

export const getHorarios = async () => {
    // Verificar caché antes de consultar Supabase
    const cached = cacheService.get('horarios');
    if (cached) return cached;

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('horarios')
        .select('id, hora')
        .eq('escuela_id', escuelaId)
        .eq('activo', true)
        .order('hora', { ascending: true });

    if (error) throw error;

    // Guardar en caché (5 minutos por defecto)
    cacheService.set('horarios', data);
    return data;
};

/**
 * Obtiene las grupos únicas de los alumnos asignados a un entrenador.
 * Si userId no se provee (admin), devuelve todas las grupos activas.
 * @param {string|null} userId - ID del entrenador (null para admins)
 * @param {string|null} userRole - Rol del usuario
 */
export const getGruposParaEntrenador = async (userId = null, userRole = null) => {
    const dataScope = getDataScope(userRole);
    const esEntrenador = dataScope === 'assigned_students' || dataScope === 'goalkeepers';

    if (!esEntrenador) {
        // Para admins devolver todas las grupos activas
        return getGrupos();
    }

    const escuelaId = await obtenerEscuelaId();

    let query = supabase
        .from('alumnos')
        .select('grupo_id, grupo:grupos(id, nombre)')
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (dataScope === 'assigned_students' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    } else if (dataScope === 'goalkeepers') {
        query = query.eq('es_arquero', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Extraer grupos únicas
    const gruposMap = new Map();
    data.forEach(a => {
        if (a.grupo_id && a.grupo) {
            gruposMap.set(a.grupo_id, { id: a.grupo_id, nombre: a.grupo.nombre });
        }
    });

    return Array.from(gruposMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

/**
 * Obtiene los horarios únicos de los alumnos asignados a un entrenador.
 * Si userId no se provee (admin), devuelve todos los horarios activos.
 * @param {string|null} userId - ID del entrenador (null para admins)
 * @param {string|null} userRole - Rol del usuario
 */
export const getHorariosParaEntrenador = async (userId = null, userRole = null) => {
    const dataScope = getDataScope(userRole);
    const esEntrenador = dataScope === 'assigned_students' || dataScope === 'goalkeepers';

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

    if (dataScope === 'assigned_students' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    } else if (dataScope === 'goalkeepers') {
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
// CRUD de Grupos
// ============================================================================

/**
 * Obtener todas las grupos (activas e inactivas)
 * Regla #18: Grupos son específicas de cada escuela
 */
export const getAllGrupos = async () => {
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('grupos')
        // Se incluye la sucursal relacionada para mostrarla en la UI
        .select('id, nombre, activo, sucursal_id, sucursal:sucursales(id, nombre)')
        .eq('escuela_id', escuelaId)
        .order('nombre', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Crear nueva grupo
 * Regla #18: Solo Admin/SuperAdmin pueden gestionar grupos
 */
export const createGrupo = async (nombre, sucursalId = null) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la grupo es obligatorio.');
    }
    if (!sucursalId) {
        throw new Error('Debes seleccionar una sucursal para la grupo.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados dentro de la misma sucursal
    const { data: existing } = await supabase
        .from('grupos')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .eq('sucursal_id', sucursalId)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una grupo con este nombre en esa sucursal.');
    }

    const { data, error } = await supabase
        .from('grupos')
        .insert([{
            nombre: nombre.trim(),
            escuela_id: escuelaId,
            sucursal_id: sucursalId,
            activo: true
        }])
        .select()
        .single();

    if (error) throw new Error('Error al crear grupo: ' + error.message);
    return data;
};

/**
 * Actualizar nombre de grupo
 */
export const updateGrupo = async (id, nombre, sucursalId = null) => {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la grupo es obligatorio.');
    }
    if (!sucursalId) {
        throw new Error('Debes seleccionar una sucursal para la grupo.');
    }

    const escuelaId = await obtenerEscuelaId();

    // Validar duplicados (excepto la misma grupo, dentro de la misma sucursal)
    const { data: existing } = await supabase
        .from('grupos')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('nombre', nombre.trim())
        .eq('sucursal_id', sucursalId)
        .neq('id', id)
        .maybeSingle();

    if (existing) {
        throw new Error('Ya existe una grupo con este nombre en esa sucursal.');
    }

    const { data, error } = await supabase
        .from('grupos')
        .update({ nombre: nombre.trim(), sucursal_id: sucursalId })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al actualizar grupo: ' + error.message);
    return data;
};

/**
 * Activar/Desactivar grupo (soft delete)
 * Validar que no tenga alumnos activos asignados antes de desactivar
 */
export const toggleGrupoStatus = async (id, currentStatus) => {
    const escuelaId = await obtenerEscuelaId();

    // Si está activando, permitir directamente
    if (!currentStatus) {
        const { data, error } = await supabase
            .from('grupos')
            .update({ activo: true })
            .eq('id', id)
            .eq('escuela_id', escuelaId)
            .select()
            .single();

        if (error) throw new Error('Error al activar grupo: ' + error.message);
        return data;
    }

    // Si está desactivando, verificar que no tenga alumnos activos
    const { count, error: countError } = await supabase
        .from('alumnos')
        .select('id', { count: 'exact', head: true })
        .eq('grupo_id', id)
        .eq('archivado', false);

    if (countError) throw new Error('Error al verificar alumnos: ' + countError.message);

    if (count > 0) {
        throw new Error(`No se puede desactivar. Hay ${count} alumno(s) activo(s) asignado(s) a esta grupo.`);
    }

    const { data, error } = await supabase
        .from('grupos')
        .update({ activo: false })
        .eq('id', id)
        .eq('escuela_id', escuelaId)
        .select()
        .single();

    if (error) throw new Error('Error al desactivar grupo: ' + error.message);
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
        .select('id, hora, activo, escuela_id')
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

