import { supabase } from '../../../lib/supabaseClient';

/**
 * Consulta la vista v_alumnos_deuda para verificar si el alumno tiene deuda pendiente.
 * Separa la lógica financiera del alumno para mantener modularidad y orden en el código.
 * 
 * @param {string} alumnoId - Identificador único del alumno.
 * @returns {Promise<boolean>} - Retorna true si el alumno posee saldo pendiente o cuentas por cobrar pendientes.
 */
export const verificarDeudaAlumno = async (alumnoId) => {
    if (!alumnoId) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('v_alumnos_deuda')
            .select('saldo_pendiente, cxc_pendientes')
            .eq('alumno_id', alumnoId)
            .maybeSingle();

        if (error) {
            console.error('Error al verificar la deuda del alumno:', error);
            return false;
        }

        if (!data) {
            return false;
        }

        const saldo = Number(data.saldo_pendiente || 0);
        const pendientes = Number(data.cxc_pendientes || 0);

        // Si existe un saldo mayor a cero o cuentas por cobrar pendientes, se considera con deuda
        return saldo > 0 || pendientes > 0;
    } catch (error) {
        console.error('Excepción al consultar el estado de deuda del alumno:', error);
        return false;
    }
};
