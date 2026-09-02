import { supabase } from '../lib/supabaseClient';

/**
 * Consulta los alumnos con cumpleaños (hoy, ayer, mañana y próximos 7 días).
 *
 * @param {Object} [options={}] - Opciones de petición.
 * @param {AbortSignal} [options.signal] - Señal para abortar la petición si se desmonta el componente.
 * @returns {Promise<{ today: Array, yesterday: Array, tomorrow: Array, upcoming: Array }>}
 */
export const obtenerCumpleanosAsisport = async (options = {}) => {
    let query = supabase.rpc('rpc_cumpleanos_asisport');

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener cumpleaños de AsiSport:', error);
        throw new Error(error.message || 'Error al cargar la lista de cumpleaños.');
    }

    return data || {
        today: [],
        yesterday: [],
        tomorrow: [],
        upcoming: []
    };
};
