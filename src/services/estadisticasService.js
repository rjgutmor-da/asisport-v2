/**
 * Servicio de Estadísticas — Funciones para el módulo de Estadísticas de AsiSport.
 * Integrado con RPCs de alto rendimiento en PostgreSQL para eliminar agregaciones pesadas en el navegador.
 */
import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

/**
 * Consulta las métricas y la serie diaria para el módulo de Estadísticas mediante la RPC rpc_resumen_estadisticas_asisport.
 *
 * @param {Object} [filtros={}] - Filtros de consulta.
 * @param {string|null} [filtros.gestionId=null] - ID de gestión deportiva.
 * @param {string|null} [filtros.fechaDesde=null] - Fecha inicio (YYYY-MM-DD).
 * @param {string|null} [filtros.fechaHasta=null] - Fecha fin (YYYY-MM-DD).
 * @param {Array<string>} [filtros.entrenadorIds] - IDs de entrenadores.
 * @param {Array<string>} [filtros.canchaIds] - IDs de canchas/grupos.
 * @param {Array<string>} [filtros.horarioIds] - IDs de horarios.
 * @param {Array<string>} [filtros.dias] - Nombres de días en español.
 * @param {string|null} [filtros.alumnoId=null] - ID opcional de alumno para desglose.
 * @param {Object} [options={}] - Opciones de petición.
 * @param {AbortSignal} [options.signal] - Señal para abortar la petición.
 * @returns {Promise<{ resumen: Object, serie_diaria: Array, gestion: Object, alumno_seleccionado: Object|null }>}
 */
export const obtenerResumenEstadisticas = async (filtros = {}, options = {}) => {
    let query = supabase.rpc('rpc_resumen_estadisticas_asisport', {
        p_gestion_id: filtros.gestionId || null,
        p_fecha_desde: filtros.fechaDesde || null,
        p_fecha_hasta: filtros.fechaHasta || null,
        p_entrenador_ids: filtros.entrenadorIds && filtros.entrenadorIds.length > 0 ? filtros.entrenadorIds : null,
        p_cancha_ids: filtros.canchaIds && filtros.canchaIds.length > 0 ? filtros.canchaIds : null,
        p_horario_ids: filtros.horarioIds && filtros.horarioIds.length > 0 ? filtros.horarioIds : null,
        p_dias: filtros.dias && filtros.dias.length > 0 ? filtros.dias : null,
        p_alumno_id: filtros.alumnoId || null
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener resumen de estadísticas vía RPC:', error);
        throw new Error(error.message || 'Error al calcular las estadísticas.');
    }

    return data || {
        resumen: { total_registros: 0, presentes: 0, licencias: 0, ausentes: 0, porcentaje_asistencia: 0, total_alumnos_unicos: 0 },
        serie_diaria: [],
        gestion: null,
        alumno_seleccionado: null
    };
};

/**
 * Consulta el detalle paginado de asistencias para exportación a Excel mediante rpc_exportar_asistencias_asisport.
 *
 * @param {Object} [filtros={}] - Filtros de exportación.
 * @param {string|null} [filtros.gestionId] - ID de gestión deportiva.
 * @param {string|null} [filtros.fechaDesde] - Fecha inicio (YYYY-MM-DD).
 * @param {string|null} [filtros.fechaHasta] - Fecha fin (YYYY-MM-DD).
 * @param {Array<string>} [filtros.entrenadorIds] - IDs de entrenadores.
 * @param {Array<string>} [filtros.canchaIds] - IDs de canchas/grupos.
 * @param {Array<string>} [filtros.horarioIds] - IDs de horarios.
 * @param {Array<string>} [filtros.dias] - Nombres de días en español.
 * @param {string|null} [filtros.alumnoId] - ID opcional de alumno.
 * @param {number} [filtros.page=1] - Página.
 * @param {number} [filtros.limit=5000] - Cantidad máxima de filas.
 * @param {Object} [options={}] - Opciones de la petición.
 * @param {AbortSignal} [options.signal] - Señal de cancelación.
 * @returns {Promise<{ items: Array, total_resultados: number, pagina: number, items_por_pagina: number }>}
 */
export const exportarAsistenciasAsisport = async (filtros = {}, options = {}) => {
    let query = supabase.rpc('rpc_exportar_asistencias_asisport', {
        p_gestion_id: filtros.gestionId || null,
        p_fecha_desde: filtros.fechaDesde || null,
        p_fecha_hasta: filtros.fechaHasta || null,
        p_entrenador_ids: filtros.entrenadorIds && filtros.entrenadorIds.length > 0 ? filtros.entrenadorIds : null,
        p_cancha_ids: filtros.canchaIds && filtros.canchaIds.length > 0 ? filtros.canchaIds : null,
        p_horario_ids: filtros.horarioIds && filtros.horarioIds.length > 0 ? filtros.horarioIds : null,
        p_dias: filtros.dias && filtros.dias.length > 0 ? filtros.dias : null,
        p_alumno_id: filtros.alumnoId || null,
        p_pagina: filtros.page || 1,
        p_limite: filtros.limit || 5000
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al exportar asistencias vía RPC:', error);
        throw new Error(error.message || 'Error al exportar los datos de asistencias.');
    }

    return data || {
        items: [],
        total_resultados: 0,
        pagina: filtros.page || 1,
        items_por_pagina: filtros.limit || 5000
    };
};

/**
 * Función heredada de compatibilidad (por si algún componente previo la invoca).
 */
export const getAsistenciasRangoDetalle = async (fechaInicio, fechaFin) => {
    const escuelaId = await obtenerEscuelaId();

    const fetchAll = async (table) => {
        let allData = [];
        let from = 0;
        let to = 999;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabase
                .from(table)
                .select('alumno_id, fecha, estado, entrenador_id, entrenador:usuarios!asistencias_normales_entrenador_id_fkey(nombres, apellidos, rol), alumnos!inner(escuela_id)')
                .eq('alumnos.escuela_id', escuelaId)
                .gte('fecha', fechaInicio)
                .lte('fecha', fechaFin)
                .order('fecha', { ascending: true })
                .range(from, to);

            if (error) throw error;
            if (!data || data.length === 0) {
                finished = true;
            } else {
                allData = [...allData, ...data];
                if (data.length < 1000) {
                    finished = true;
                } else {
                    from += 1000;
                    to += 1000;
                }
            }
            if (allData.length >= 15000) finished = true;
        }
        return allData;
    };

    return fetchAll('asistencias_normales');
};
