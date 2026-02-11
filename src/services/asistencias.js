import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

export const ESTADOS_ASISTENCIA = ['Presente', 'Licencia', 'Ausente'];

export const getAlumnosParaAsistencia = async (fecha, canchaId = null, horarioId = null) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = fecha.split('-').map(Number);
    const fechaSeleccionada = new Date(y, m - 1, d);

    if (fechaSeleccionada > hoy) {
        throw new Error('No se pueden registrar asistencias para fechas futuras.');
    }

    const escuelaId = await obtenerEscuelaId();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada.');

    const { data: asignaciones, error: asignError } = await supabase
        .from('alumnos_entrenadores')
        .select('alumno_id')
        .eq('entrenador_id', user.id);

    if (asignError) throw asignError;

    const alumnoIdsAsignados = asignaciones.map(a => a.alumno_id);
    if (alumnoIdsAsignados.length === 0) return [];

    let query = supabase
        .from('alumnos')
        .select(`
            id, nombres, apellidos, foto_url, es_arquero, estado, cancha_id, horario_id,
            cancha:canchas(id, nombre),
            horario:horarios(id, hora)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .in('id', alumnoIdsAsignados)
        .order('apellidos', { ascending: true });

    if (canchaId) query = query.eq('cancha_id', canchaId);
    if (horarioId) query = query.eq('horario_id', horarioId);

    const { data: alumnos, error: alumnosError } = await query;
    if (alumnosError) throw alumnosError;

    const { data: asistenciasNormales, error: anError } = await supabase
        .from('asistencias_normales')
        .select('alumno_id, estado, id')
        .eq('fecha', fecha)
        .in('alumno_id', alumnos.map(a => a.id));

    if (anError) throw anError;

    const normalesMap = new Map(asistenciasNormales.map(a => [a.alumno_id, a]));

    return alumnos.map(alumno => ({
        ...alumno,
        asistenciaNormal: normalesMap.get(alumno.id) || null
    }));
};

export const registrarAsistenciasPorLote = async (asistencias, fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = fecha.split('-').map(Number);
    const fechaSeleccionada = new Date(y, m - 1, d);

    if (fechaSeleccionada > hoy) {
        throw new Error('No se pueden registrar asistencias para fechas futuras.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada.');
    const entrenadorId = user.id;

    const alumnoIds = asistencias.map(a => a.alumnoId);
    if (alumnoIds.length === 0) return { exitosos: 0, fallidos: 0 };

    const { data: existentes, error: checkError } = await supabase
        .from('asistencias_normales')
        .select('id, alumno_id')
        .eq('fecha', fecha)
        .in('alumno_id', alumnoIds);

    if (checkError) throw checkError;

    const existentesMap = new Map(existentes.map(e => [e.alumno_id, e.id]));
    const updates = [];
    const inserts = [];

    asistencias.forEach(({ alumnoId, estado }) => {
        if (existentesMap.has(alumnoId)) {
            updates.push({ id: existentesMap.get(alumnoId), alumno_id: alumnoId, estado, entrenador_id: entrenadorId });
        } else {
            inserts.push({ alumno_id: alumnoId, fecha, estado, entrenador_id: entrenadorId });
        }
    });

    const resultados = { exitosos: 0, fallidos: 0, errores: [] };

    if (updates.length > 0) {
        const updatePromises = updates.map(u =>
            supabase.from('asistencias_normales').update({ estado: u.estado, entrenador_id: u.entrenador_id }).eq('id', u.id)
        );
        const updateResults = await Promise.allSettled(updatePromises);
        updateResults.forEach((r, i) => {
            if (r.status === 'fulfilled' && !r.value.error) resultados.exitosos++;
            else {
                resultados.fallidos++;
                resultados.errores.push({ alumnoId: updates[i].alumno_id, error: r.value?.error?.message || 'Error' });
            }
        });
    }

    if (inserts.length > 0) {
        const { error } = await supabase.from('asistencias_normales').insert(inserts);
        if (error) {
            resultados.fallidos += inserts.length;
            resultados.errores.push({ tipo: 'insert_batch', error: error.message });
        } else {
            resultados.exitosos += inserts.length;
        }
    }

    return resultados;
};

export const verificarEstadoEnvio = async (fecha) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { existe: false, cantidad: 0 };

    const { count, error } = await supabase
        .from('asistencias_normales')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', fecha)
        .eq('entrenador_id', user.id);

    if (error) return { existe: false, cantidad: 0 };

    return { existe: (count && count > 0), cantidad: count || 0 };
};

/**
 * Obtiene la asistencia de los últimos 7 días para un conjunto de alumnos
 * @param {Array} alumnoIds - Lista de IDs de alumnos
 * @returns {Promise<Object>} Mapa de alumnoId -> { 'YYYY-MM-DD': estado, ... }
 */
export const getAsistenciasUltimos7Dias = async (alumnoIds) => {
    if (!alumnoIds || alumnoIds.length === 0) return {};

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const fechaInicio = hace7Dias.toISOString().split('T')[0];
    const fechaFin = hoy.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('asistencias_normales')
        .select('alumno_id, fecha, estado')
        .in('alumno_id', alumnoIds)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

    if (error) throw error;

    // Estructurar respuesta como un mapa para acceso rápido
    const historial = {};
    data.forEach(asistencia => {
        if (!historial[asistencia.alumno_id]) {
            historial[asistencia.alumno_id] = {};
        }
        historial[asistencia.alumno_id][asistencia.fecha] = asistencia.estado;
    });

    return historial;
};

/**
 * Obtiene todas las asistencias en un rango de fechas
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 */
export const getAsistenciasRango = async (fechaInicio, fechaFin) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Opcional: filtrar por escuela
    const escuelaId = await obtenerEscuelaId();

    // Query básica: traer asistencias en rango
    // Nota: idealmente hacer join con alumnos para traer info básica, 
    // pero como traemos alumnos aparte en el hook, aquí solo necesitamos IDs y datos de asistencia.
    // Sin embargo, para agilizar reporte, confirmar que pertenecen al entrenador/escuela.

    let query = supabase
        .from('asistencias_normales')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

    // Si tenemos escuela, filtrar (aunque RLS debería encargarse)
    // De momento confiamos en el endpoint.

    const { data, error } = await query;

    if (error) {
        throw error;
    }
    return data;
};
