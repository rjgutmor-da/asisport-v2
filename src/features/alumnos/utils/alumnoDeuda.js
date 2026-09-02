import { supabase } from '../../../lib/supabaseClient';

/**
 * Consulta el estado de deuda del alumno mediante la RPC puntual rpc_estado_deuda_alumno_asisport.
 * Separa la lógica financiera del alumno para mantener modularidad y orden en el código,
 * evitando consultar vistas compartidas pesadas.
 * 
 * @param {string} alumnoId - Identificador único del alumno.
 * @param {Object} [options={}] - Opciones de la consulta.
 * @param {AbortSignal} [options.signal] - Señal de cancelación de la petición.
 * @returns {Promise<boolean>} - Retorna true si el alumno posee saldo pendiente o cuentas por cobrar pendientes.
 */
export const verificarDeudaAlumno = async (alumnoId, options = {}) => {
    if (!alumnoId) {
        return false;
    }

    try {
        let query = supabase.rpc('rpc_estado_deuda_alumno_asisport', {
            p_alumno_id: alumnoId
        });

        if (options.signal) {
            query = query.abortSignal(options.signal);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error al verificar la deuda del alumno vía RPC:', error);
            return false;
        }

        return Boolean(data);
    } catch (error) {
        console.error('Excepción al consultar el estado de deuda del alumno:', error);
        return false;
    }
};
