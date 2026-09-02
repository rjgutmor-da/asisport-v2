/**
 * Utilidades para el filtrado inteligente bidireccional entre Entrenadores y Grupos (Canchas)
 * en el módulo de alumnos de AsiSport.
 * 
 * Permite filtrar las opciones disponibles de forma cruzada y sanear selecciones
 * que dejen de ser válidas ante cambios de criterio.
 */

/**
 * Filtra la lista de grupos según los entrenadores seleccionados.
 * Si no hay entrenadores seleccionados, retorna la totalidad de los grupos.
 *
 * @param {Array<Object>} canchas - Catálogo completo de grupos/canchas.
 * @param {Array<string>} selectedEntrenadores - IDs de los entrenadores seleccionados.
 * @returns {Array<Object>} Grupos vinculados a los entrenadores seleccionados.
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
 * Si no hay grupos seleccionados, retorna la totalidad de los entrenadores.
 *
 * @param {Array<Object>} entrenadores - Catálogo completo de entrenadores.
 * @param {Array<string>} selectedCanchas - IDs de los grupos seleccionados.
 * @returns {Array<Object>} Entrenadores a cargo de los grupos seleccionados.
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
 * se encuentren dentro del conjunto de opciones permitidas.
 *
 * @param {Array<string>} seleccionados - IDs actualmente seleccionados.
 * @param {Array<Object>} opcionesPermitidas - Lista de objetos de opciones permitidas (con propiedad .value o .id).
 * @returns {Array<string>} IDs seleccionados que continúan siendo válidos.
 */
export const sanearSeleccionIncompatible = (seleccionados = [], opcionesPermitidas = []) => {
    if (!Array.isArray(seleccionados) || seleccionados.length === 0) return [];
    if (!Array.isArray(opcionesPermitidas) || opcionesPermitidas.length === 0) return [];

    const permitidos = new Set(
        opcionesPermitidas.map(op => String(op.value ?? op.id))
    );

    return seleccionados.filter(id => permitidos.has(String(id)));
};
