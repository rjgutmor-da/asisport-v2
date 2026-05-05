/**
 * Servicio de Estadísticas — Funciones auxiliares para el módulo de Estadísticas.
 * 
 * Separado del servicio principal de asistencias para mantener modularidad.
 * Provee la consulta de detalle individual (para exportación a Excel).
 */
import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

/**
 * Obtiene las asistencias individuales en un rango de fechas.
 * Se usa exclusivamente para la exportación detallada a Excel,
 * donde se necesita saber qué alumno asistió en qué fecha específica.
 * 
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Lista de asistencias individuales con alumno_id, fecha y estado
 */
export const getAsistenciasRangoDetalle = async (fechaInicio, fechaFin) => {
    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('asistencias_normales')
        .select('alumno_id, fecha, estado, alumnos!inner(escuela_id)')
        .eq('alumnos.escuela_id', escuelaId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

    if (error) throw error;
    return data;
};
