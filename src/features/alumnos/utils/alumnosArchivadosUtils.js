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
 * Obtiene el nombre completo del usuario que archivó al alumno.
 * 
 * @param {Object} alumno - Objeto del alumno con la relación del usuario archivador.
 * @returns {string} Nombre y apellido o '—' si no está registrado.
 */
export const obtenerNombreUsuarioArchivador = (alumno) => {
    if (!alumno) return '—';

    const usuario = alumno.archivado_por_usuario;
    if (usuario && (usuario.nombres || usuario.apellidos)) {
        const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
        return nombreCompleto || '—';
    }

    return '—';
};
