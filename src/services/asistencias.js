import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import { obtenerLunesDeEstaSemana } from '../lib/dateHelpers';
import { can, getDataScope } from '../config/roles';

export const ESTADOS_ASISTENCIA = ['Presente', 'Licencia', 'Ausente'];

export const getAlumnosParaAsistenciaLegacy = async (fecha, grupoId = null, horarioId = null, entrenadorId = null) => {
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
                id, nombres, apellidos, foto_url, es_arquero, estado, grupo_id, horario_id, fecha_nacimiento,
                grupo:grupos(id, nombre),
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

        if (grupoId) query = query.eq('grupo_id', grupoId);
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

export const registrarAsistenciasPorLoteLegacy = async (asistencias, fecha, targetEntrenadorId = null) => {
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
                if (r.status === 'fulfilled' && !r.value.error) resultados.exitosos++;
                else {
                    resultados.fallidos++;
                    console.error(`[Data Integrity Error] Fallo al actualizar asistencia ID: ${updates[i].id} generada por User: ${userIdForLog}.`, r.value?.error || r.reason);
                    resultados.errores.push({ alumnoId: updates[i].alumno_id, error: r.value?.error?.message || 'Error' });
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

// API histórica por grupo de gestión. Las funciones legadas anteriores se
// conservan únicamente para compatibilidad de módulos no migrados.
export const getAlumnosParaAsistencia = async (fecha, grupoGestionId = null) => {
    if (!grupoGestionId) return [];
    const hoy = new Date();
    const seleccionada = new Date(`${fecha}T23:59:59`);
    if (seleccionada > hoy) throw new Error('No se pueden registrar asistencias para fechas futuras.');
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = user
        ? await supabase.from('usuarios').select('rol').eq('id', user.id).maybeSingle()
        : { data: null };
    const { data, error } = await supabase
        .from('alumnos')
        .select(`id, nombres, apellidos, foto_url, es_arquero, estado, grupo_gestion_id, fecha_nacimiento,
            asistenciaNormal:asistencias_normales(id, estado, fecha, entrenador_id, grupo_gestion_id,
                entrenador:usuarios!asistencias_normales_entrenador_id_fkey(id, nombres, apellidos, rol))`)
        .eq('grupo_gestion_id', grupoGestionId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA')
        .eq('asistencias_normales.fecha', fecha)
        .order('apellidos', { ascending: true });
    if (perfil?.rol === 'Entrenarqueros') query = query.eq('es_arquero', true);
    if (error) throw error;
    return (data || []).map((alumno) => ({ ...alumno, asistenciaNormal: alumno.asistenciaNormal?.[0] || null }));
};

export const registrarAsistenciasPorLote = async (asistencias, fecha, grupoGestionId) => {
    if (!grupoGestionId || !asistencias?.length) return { exitosos: 0, fallidos: 0, errores: [] };
    const { data, error } = await supabase.rpc('rpc_registrar_asistencias_lote', {
        p_fecha: fecha,
        p_grupo_gestion_id: grupoGestionId,
        p_asistencias: asistencias.map(({ alumnoId, estado }) => ({ alumno_id: alumnoId, estado })),
    });
    if (error) throw error;
    return {
        exitosos: Number(data?.total || 0),
        fallidos: 0,
        errores: [],
        insertadas: Number(data?.insertadas || 0),
        actualizadas: Number(data?.actualizadas || 0),
    };
};

export const verificarEstadoEnvio = async (fecha, grupoId = null, horarioId = null, grupoGestionId = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { existe: false, cantidad: 0 };

    if (grupoGestionId) {
        const { count, error } = await supabase
            .from('asistencias_normales')
            .select('id', { count: 'exact', head: true })
            .eq('fecha', fecha)
            .eq('grupo_gestion_id', grupoGestionId);
        if (error) return { existe: false, cantidad: 0 };
        return { existe: (count || 0) > 0, cantidad: count || 0 };
    }

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('rol, sucursal_id')
        .eq('id', user.id)
        .single();

    // Si no hay filtros de grupo/horario, verificar globalmente (para admins)
    if (!grupoId && !horarioId) {
        const { count, error } = await supabase
            .from('asistencias_normales')
            .select('id', { count: 'exact', head: true })
            .eq('fecha', fecha)
            .eq('entrenador_id', user.id);

        if (error) return { existe: false, cantidad: 0 };
        return { existe: (count && count > 0), cantidad: count || 0 };
    }

    // Obtener los IDs de alumnos que pertenecen a esta grupo/horario específico
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

    if (grupoId) alumnosQuery = alumnosQuery.eq('grupo_id', grupoId);
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
    const lunes = obtenerLunesDeEstaSemana(hoy);

    const fechaInicio = lunes.toISOString().split('T')[0];
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
export const getAsistenciasRangoLegacy = async (fechaInicio, fechaFin) => {
    const escuelaId = await obtenerEscuelaId();
    let from = 0;
    const pageSize = 1000;
    const registros = [];
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase
            .from('asistencias_normales')
            .select('fecha, estado, alumnos!inner(escuela_id, profesor_asignado_id, grupo_id, horario_id)')
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
        const alumno = registro.alumnos;
        const key = [registro.fecha, alumno.profesor_asignado_id, alumno.grupo_id, alumno.horario_id].join('|');
        if (!agregados.has(key)) {
            agregados.set(key, {
                fecha: registro.fecha,
                presentes: 0,
                licencias: 0,
                profesor_asignado_id: alumno.profesor_asignado_id,
                grupo_id: alumno.grupo_id,
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

export const getAsistenciasRango = async (fechaInicio, fechaFin) => {
    const { data, error } = await supabase
        .from('v_asistencias_contexto')
        .select('fecha, estado, escuela_id, entrenador_id, grupo_gestion_id, grupo_nombre, grupo_hora, grupo_id, horario_id, registrado_por')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);
    if (error) throw error;
    const agregados = new Map();
    (data || []).forEach((registro) => {
        const key = [registro.fecha, registro.entrenador_id, registro.grupo_gestion_id || 'sin-grupo'].join('|');
        if (!agregados.has(key)) agregados.set(key, {
            fecha: registro.fecha, presentes: 0, licencias: 0,
            profesor_asignado_id: registro.entrenador_id,
            entrenador_id: registro.entrenador_id,
            registrado_por: registro.registrado_por,
            grupo_gestion_id: registro.grupo_gestion_id,
            grupo_nombre: registro.grupo_nombre,
            grupo_hora: registro.grupo_hora,
            grupo_id: registro.grupo_id, horario_id: registro.horario_id,
            escuela_id: registro.escuela_id,
        });
        const row = agregados.get(key);
        if (registro.estado === 'Presente') row.presentes += 1;
        if (registro.estado === 'Licencia') row.licencias += 1;
    });
    return Array.from(agregados.values());
};
