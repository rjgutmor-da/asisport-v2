import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import { obtenerLunesDeEstaSemana } from '../lib/dateHelpers';
import { can, getDataScope } from '../config/roles';

export const ESTADOS_ASISTENCIA = ['Presente', 'Licencia', 'Ausente'];

export const getAlumnosParaAsistencia = async (fecha, canchaId = null, horarioId = null, entrenadorId = null) => {
    let userIdForLog = 'unknown';
    try {
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
        userIdForLog = user.id;

        // Verificar rol del usuario y sucursal
        const { data: usuarioDB, error: userError } = await supabase
            .from('usuarios')
            .select('rol, sucursal_id')
            .eq('id', user.id)
            .single();

        if (userError) throw userError;

        const esAdmin = can(usuarioDB.rol, 'asisport.manageAttendanceForOthers');
        const dataScope = getDataScope(usuarioDB.rol);
        let targetEntrenadorId = user.id;

        if (esAdmin && entrenadorId) {
            targetEntrenadorId = entrenadorId;
        } else if (esAdmin && !entrenadorId) {
            targetEntrenadorId = user.id;
        }

        // --- PLATTER PRINCIPLE: Una sola query trae todo combinado ---
        let query = supabase
            .from('alumnos')
            .select(`
                id, nombres, apellidos, foto_url, es_arquero, estado, cancha_id, horario_id, fecha_nacimiento,
                cancha:grupos!alumnos_cancha_id_fkey1(id, nombre),
                horario:horarios(id, hora),
                asistenciaNormal:asistencias_normales(
                    id, estado, fecha, entrenador_id,
                    entrenador:usuarios!asistencias_normales_entrenador_id_fkey(id, nombres, apellidos, rol)
                )
            `)
            .eq('escuela_id', escuelaId)
            .eq('archivado', false)
            .neq('estado', 'ELIMINADO SISTEMA')
            .eq('asistencias_normales.fecha', fecha); // Filtro en la relación (join filter)

        if (dataScope === 'goalkeepers') {
            query = query.eq('es_arquero', true);
        } else {
            query = query.eq('profesor_asignado_id', targetEntrenadorId);
        }

        if (dataScope !== 'school') {
            if (usuarioDB.sucursal_id) {
                query = query.eq('sucursal_id', usuarioDB.sucursal_id);
            }
        }

        query = query.order('apellidos', { ascending: true });

        if (canchaId) query = query.eq('cancha_id', canchaId);
        if (horarioId) query = query.eq('horario_id', horarioId);

        const { data: alumnos, error: alumnosError } = await query;
        if (alumnosError) throw alumnosError;

        // Normalizamos la salida: Supabase devuelve un array para la relación 1:N
        return alumnos.map(alumno => ({
            ...alumno,
            asistenciaNormal: alumno.asistenciaNormal?.[0] || null
        }));
    } catch (error) {
        console.error(`[Error B2B Asistencias] getAlumnosParaAsistencia falló. UserID: ${userIdForLog}`, error);
        throw error;
    }
};

export const registrarAsistenciasPorLote = async (asistencias, fecha, targetEntrenadorId = null) => {
    let userIdForLog = 'unknown';
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const [y, m, d] = fecha.split('-').map(Number);
        const fechaSeleccionada = new Date(y, m - 1, d);

        if (fechaSeleccionada > hoy) {
            throw new Error('No se pueden registrar asistencias para fechas futuras.');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sesión expirada.');
        userIdForLog = user.id;

        const { data: usuarioDB, error: usuarioError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();
        if (usuarioError) throw usuarioError;

        const bloqueaEdiciones = usuarioDB.rol === 'Entrenarqueros';
        let entrenadorId = user.id;

        if (targetEntrenadorId && targetEntrenadorId !== user.id) {
            if (can(usuarioDB.rol, 'asisport.manageAttendanceForOthers')) {
                entrenadorId = targetEntrenadorId;
            }
        }

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
            if (existentesMap.has(alumnoId) && !bloqueaEdiciones) {
                updates.push({ id: existentesMap.get(alumnoId), alumno_id: alumnoId, estado });
            } else if (!existentesMap.has(alumnoId)) {
                inserts.push({ alumno_id: alumnoId, fecha, estado, entrenador_id: entrenadorId });
            }
        });

        const resultados = { exitosos: 0, fallidos: 0, errores: [] };

        if (updates.length > 0) {
            const updatePromises = updates.map(u =>
                supabase.from('asistencias_normales').update({ estado: u.estado }).eq('id', u.id)
            );
            const updateResults = await Promise.allSettled(updatePromises);
            updateResults.forEach((r, i) => {
                if (r.status === 'fulfilled' && !r.value.error) {
                    resultados.exitosos++;
                } else {
                    const errorResultado = r.status === 'fulfilled' ? r.value.error : r.reason;
                    resultados.fallidos++;
                    console.error(`[Data Integrity Error] Fallo al actualizar asistencia ID: ${updates[i].id} generada por User: ${userIdForLog}.`, errorResultado);
                    resultados.errores.push({ alumnoId: updates[i].alumno_id, error: errorResultado?.message || 'Error' });
                }
            });
        }

        if (inserts.length > 0) {
            const { error } = await supabase.from('asistencias_normales').insert(inserts);
            if (error) {
                resultados.fallidos += inserts.length;
                console.error(`[Data Integrity Error] Inserción masiva de asistencias falló. Lote creado por User: ${userIdForLog}. Error: ${error.message}`);
                resultados.errores.push({ tipo: 'insert_batch', error: error.message });
            } else {
                resultados.exitosos += inserts.length;
            }
        }

        return resultados;
    } catch (error) {
        console.error(`[Error B2B Asistencias] registrarAsistenciasPorLote falló por completo. UserID: ${userIdForLog}`, error);
        throw error;
    }
};

export const verificarEstadoEnvio = async (fecha, canchaId = null, horarioId = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { existe: false, cantidad: 0 };

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('rol, sucursal_id')
        .eq('id', user.id)
        .single();

    // Si no hay filtros de cancha/horario, verificar globalmente (para admins)
    if (!canchaId && !horarioId) {
        const { count, error } = await supabase
            .from('asistencias_normales')
            .select('id', { count: 'exact', head: true })
            .eq('fecha', fecha)
            .eq('entrenador_id', user.id);

        if (error) return { existe: false, cantidad: 0 };
        return { existe: (count && count > 0), cantidad: count || 0 };
    }

    // Obtener los IDs de alumnos que pertenecen a esta cancha/horario específico
    let alumnosQuery = supabase
        .from('alumnos')
        .select('id')
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (userProfile && userProfile.rol !== 'SuperAdministrador') {
        if (userProfile.sucursal_id) {
            alumnosQuery = alumnosQuery.eq('sucursal_id', userProfile.sucursal_id);
        }
    }

    if (canchaId) alumnosQuery = alumnosQuery.eq('cancha_id', canchaId);
    if (horarioId) alumnosQuery = alumnosQuery.eq('horario_id', horarioId);

    const { data: alumnosData, error: alumnosError } = await alumnosQuery;
    if (alumnosError || !alumnosData || alumnosData.length === 0) {
        return { existe: false, cantidad: 0 };
    }

    const alumnoIds = alumnosData.map(a => a.id);

    // Contar asistencias solo de estos alumnos para esta fecha y entrenador
    const { count, error } = await supabase
        .from('asistencias_normales')
        .select('id', { count: 'exact', head: true })
        .eq('fecha', fecha)
        .eq('entrenador_id', user.id)
        .in('alumno_id', alumnoIds);

    if (error) return { existe: false, cantidad: 0 };

    return { existe: (count && count > 0), cantidad: count || 0 };
};

/**
 * Obtiene la asistencia de la semana en curso (desde el lunes hasta hoy) para un conjunto de alumnos
 * @param {Array} alumnoIds - Lista de IDs de alumnos
 * @returns {Promise<Object>} Mapa de alumnoId -> { 'YYYY-MM-DD': estado, ... }
 */
export const getAsistenciasEstaSemana = async (alumnoIds) => {
    if (!alumnoIds || alumnoIds.length === 0) return {};

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    // Últimos 7 días contando hoy (hoy - 6 días)
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const fechaInicio = hace7Dias.toISOString().split('T')[0];
    const fechaFin = hoy.toISOString().split('T')[0];

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('asistencias_normales')
        .select('alumno_id, fecha, estado, alumnos!inner(escuela_id)')
        .eq('alumnos.escuela_id', escuelaId)
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
 * PLATTER PRINCIPLE: Usa la VIEW v_estadisticas_asistencia_diaria para traer agregados.
 * Esto elimina el fetch de miles de filas individuales en el Dashboard/Estadísticas.
 */
export const getAsistenciasRango = async (fechaInicio, fechaFin) => {
    const escuelaId = await obtenerEscuelaId();
    let from = 0;
    const pageSize = 1000;
    const registros = [];
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from('asistencias_normales')
            .select('fecha, estado, alumnos!inner(escuela_id, profesor_asignado_id, cancha_id, horario_id)')
            .eq('alumnos.escuela_id', escuelaId)
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .range(from, from + pageSize - 1);

        if (error) throw error;
        registros.push(...(data || []));
        finished = !data || data.length < pageSize;
        from += pageSize;
    }

    const agregados = new Map();
    registros.forEach(registro => {
        const alumno = Array.isArray(registro.alumnos) ? registro.alumnos[0] : registro.alumnos;
        if (!alumno) return;
        const key = [registro.fecha, alumno.profesor_asignado_id, alumno.cancha_id, alumno.horario_id].join('|');
        if (!agregados.has(key)) {
            agregados.set(key, {
                fecha: registro.fecha,
                presentes: 0,
                licencias: 0,
                profesor_asignado_id: alumno.profesor_asignado_id,
                cancha_id: alumno.cancha_id,
                horario_id: alumno.horario_id,
                escuela_id: alumno.escuela_id
            });
        }
        const agregado = agregados.get(key);
        if (registro.estado === 'Presente') agregado.presentes++;
        if (registro.estado === 'Licencia') agregado.licencias++;
    });

    return Array.from(agregados.values());
};

/**
 * Carga candidatos autorizados, asistencias de la fecha y estado de envío en una sola llamada RPC.
 *
 * @param {string} fecha - Fecha en formato YYYY-MM-DD.
 * @param {string|null} [canchaId=null] - ID opcional de cancha.
 * @param {string|null} [horarioId=null] - ID opcional de horario.
 * @param {string|null} [entrenadorId=null] - ID opcional de entrenador.
 * @param {Object} [options={}] - Opciones de la petición.
 * @param {AbortSignal} [options.signal] - Señal de cancelación.
 * @returns {Promise<{ candidatos: Array, asistencias_existentes: Array, estado_envio: { existe: boolean, cantidad: number } }>}
 */
export const cargarAsistenciaAsisport = async (fecha, canchaId = null, horarioId = null, entrenadorId = null, options = {}) => {
    let query = supabase.rpc('rpc_cargar_asistencia_asisport', {
        p_fecha: fecha,
        p_cancha_id: canchaId || null,
        p_horario_id: horarioId || null,
        p_entrenador_id: entrenadorId || null
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar asistencia vía RPC:', error);
        throw new Error(error.message || 'Error al cargar los datos de asistencia.');
    }

    return data || {
        candidatos: [],
        asistencias_existentes: [],
        estado_envio: { existe: false, cantidad: 0 }
    };
};
