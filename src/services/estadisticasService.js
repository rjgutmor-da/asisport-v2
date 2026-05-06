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

    const fetchAll = async (table) => {
        let allData = [];
        let from = 0;
        let to = 999;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabase
                .from(table)
                .select('alumno_id, fecha, estado, entrenador_id, alumnos!inner(escuela_id)')
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
            // Límite de seguridad para evitar bucles infinitos
            if (allData.length >= 15000) finished = true;
        }
        return allData;
    };

    const [normalesData, arquerosData] = await Promise.all([
        fetchAll('asistencias_normales'),
        fetchAll('asistencias_arqueros')
    ]);

    return [...normalesData, ...arquerosData];
};
