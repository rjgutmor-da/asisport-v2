/**
 * Obtiene el objeto Date correspondiente al lunes de la semana actual
 * a las 00:00:00.000 horas.
 *
 * @param {Date|string|number} [fecha] - Fecha de referencia (opcional, por defecto hoy)
 * @returns {Date} Lunes de la semana actual
 */
export const obtenerLunesDeEstaSemana = (fecha = new Date()) => {
    const d = new Date(fecha);
    const day = d.getDay();
    // Si hoy es domingo (0), la diferencia al lunes anterior es 6 días.
    // Si es otro día (1-6), la diferencia es (day - 1) días.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    return lunes;
};
