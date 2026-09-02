import { supabase } from '../lib/supabaseClient';

/**
 * Consulta los catálogos autorizados de AsiSport (gestiones, entrenadores, canchas y horarios).
 * Resuelve el contexto mediante auth.uid() en el backend.
 *
 * @param {string|null} [sucursalId=null] - ID opcional de sucursal para filtrar catálogo.
 * @param {Object} [options={}] - Opciones de petición.
 * @param {AbortSignal} [options.signal] - Señal para abortar la petición HTTP si se cancela.
 * @returns {Promise<{ gestiones: Array, entrenadores: Array, canchas: Array, horarios: Array, sucursal_efectiva: string|null }>}
 */
export const obtenerCatalogosAsisport = async (sucursalId = null, options = {}) => {
    let query = supabase.rpc('rpc_catalogos_asisport', {
        p_sucursal_id: sucursalId || null
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener catálogos autorizados de AsiSport:', error);
        throw new Error(error.message || 'Error al cargar los catálogos.');
    }

    return data || {
        gestiones: [],
        entrenadores: [],
        canchas: [],
        horarios: [],
        sucursal_efectiva: null
    };
};
