/**
 * Utilidades para la vista de Alumnos Archivados.
 */

/**
 * Formatea una fecha ISO a formato local de fecha legible (DD/MM/AAAA).
 * 
 * @param {string|Date|null} fechaStr - Cadena o fecha a formatear.
 * @returns {string} Fecha formateada o '—' si no existe.
 */
export const formatearFechaArchivo = (fechaStr) => {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '—';

    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Retorna la fecha y hora completa en español para tooltips informativos.
 * 
 * @param {string|Date|null} fechaStr - Cadena o fecha a formatear.
 * @returns {string} Fecha y hora legible o '—' si no existe.
 */
export const formatearFechaHoraDetallada = (fechaStr) => {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '—';

    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Obtiene el nombre del usuario que archivó al alumno (sin apellido).
 * 
 * @param {Object} alumno - Objeto del alumno con la relación del usuario archivador.
 * @returns {string} Nombre o '—' si no está registrado.
 */
export const obtenerNombreUsuarioArchivador = (alumno) => {
    if (!alumno) return '—';

    const usuario = alumno.archivado_por_usuario;
    if (usuario?.nombres) {
        return usuario.nombres.trim();
    }

    return '—';
};

/**
 * Ordena la lista de alumnos archivados del más nuevo al más antiguo
 * según su fecha de archivado (archivado_at). Si un alumno es restaurado y
 * vuelto a archivar, esa última fecha de archivado es la que manda.
 * En caso de empate o fechas nulas, se ordenan alfabéticamente por nombre.
 * 
 * @param {Array<Object>} alumnos - Lista de alumnos a ordenar.
 * @returns {Array<Object>} Lista de alumnos ordenada del más nuevo al más antiguo.
 */
export const ordenarAlumnosArchivados = (alumnos = []) => {
    if (!Array.isArray(alumnos)) return [];

    return [...alumnos].sort((a, b) => {
        const tiempoA = a?.archivado_at ? new Date(a.archivado_at).getTime() : 0;
        const tiempoB = b?.archivado_at ? new Date(b.archivado_at).getTime() : 0;

        // El más nuevo primero
        if (tiempoB !== tiempoA) {
            return tiempoB - tiempoA;
        }

        // Desempate alfabético en español
        const nombreA = `${a?.nombres || ''} ${a?.apellidos || ''}`.trim();
        const nombreB = `${b?.nombres || ''} ${b?.apellidos || ''}`.trim();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
};

