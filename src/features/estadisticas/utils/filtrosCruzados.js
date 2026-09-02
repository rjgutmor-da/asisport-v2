/**
 * Utilidades para el filtrado inteligente bidireccional entre Entrenadores y Grupos (Canchas).
 * Permite filtrar las opciones disponibles y depurar selecciones que ya no sean válidas.
 */

/**
 * Filtra la lista de grupos según los entrenadores seleccionados.
 * Si no hay entrenadores seleccionados, retorna todos los grupos.
 *
 * @param {Array<Object>} canchas - Lista completa de grupos/canchas.
 * @param {Array<string>} selectedEntrenadores - IDs de los entrenadores seleccionados.
 * @returns {Array<Object>} Grupos que corresponden a los entrenadores seleccionados.
 */
export const filtrarGruposPorEntrenadores = (canchas = [], selectedEntrenadores = []) => {
    if (!Array.isArray(canchas)) return [];
    if (!selectedEntrenadores || selectedEntrenadores.length === 0) {
        return canchas;
    }

    const setEntrenadores = new Set(selectedEntrenadores.map(String));

    return canchas.filter(cancha => {
        const entrenadorIds = Array.isArray(cancha.entrenador_ids) ? cancha.entrenador_ids : [];
        return entrenadorIds.some(id => setEntrenadores.has(String(id)));
    });
};

/**
 * Filtra la lista de entrenadores según los grupos seleccionados.
 * Si no hay grupos seleccionados, retorna todos los entrenadores.
 *
 * @param {Array<Object>} entrenadores - Lista completa de entrenadores.
 * @param {Array<string>} selectedCanchas - IDs de los grupos seleccionados.
 * @returns {Array<Object>} Entrenadores responsables de los grupos seleccionados.
 */
export const filtrarEntrenadoresPorGrupos = (entrenadores = [], selectedCanchas = []) => {
    if (!Array.isArray(entrenadores)) return [];
    if (!selectedCanchas || selectedCanchas.length === 0) {
        return entrenadores;
    }

    const setCanchas = new Set(selectedCanchas.map(String));

    return entrenadores.filter(entrenador => {
        const grupoIds = Array.isArray(entrenador.grupo_ids) ? entrenador.grupo_ids : [];
        return grupoIds.some(id => setCanchas.has(String(id)));
    });
};

/**
 * Sanea una lista de IDs seleccionados descartando aquellos que ya no
 * se encuentren dentro del conjunto de IDs permitidos.
 *
 * @param {Array<string>} seleccionados - IDs actualmente seleccionados.
 * @param {Array<Object>} opcionesPermitidas - Lista de objetos de opciones permitidas (con propiedad .value o .id).
 * @returns {Array<string>} IDs seleccionados que siguen siendo válidos.
 */
export const sanearSeleccionIncompatible = (seleccionados = [], opcionesPermitidas = []) => {
    if (!Array.isArray(seleccionados) || seleccionados.length === 0) return [];
    if (!Array.isArray(opcionesPermitidas) || opcionesPermitidas.length === 0) return [];

    const permitidos = new Set(
        opcionesPermitidas.map(op => String(op.value ?? op.id))
    );

    return seleccionados.filter(id => permitidos.has(String(id)));
};
