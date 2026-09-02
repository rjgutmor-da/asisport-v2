import { supabase } from '../lib/supabaseClient';

/**
 * Consulta el registro de actividad de AsiSport mediante RPC acotada.
 *
 * @param {string|null} [fechaDesde=null] - Fecha/hora inicial en formato ISO o YYYY-MM-DD.
 * @param {string|null} [fechaHasta=null] - Fecha/hora final en formato ISO o YYYY-MM-DD.
 * @param {number} [limite=100] - Cantidad máxima de registros.
 * @param {Object} [options={}] - Opciones adicionales de petición.
 * @param {AbortSignal} [options.signal] - Señal para cancelar la solicitud en curso.
 * @returns {Promise<Array>}
 */
export const obtenerActividadAsisport = async (fechaDesde = null, fechaHasta = null, limite = 100, options = {}) => {
    let query = supabase.rpc('rpc_actividad_asisport', {
        p_fecha_desde: fechaDesde || null,
        p_fecha_hasta: fechaHasta || null,
        p_limite: limite || 100
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener registro de actividad de AsiSport:', error);
        throw new Error(error.message || 'Error al cargar el registro de actividad.');
    }

    return data || [];
};
