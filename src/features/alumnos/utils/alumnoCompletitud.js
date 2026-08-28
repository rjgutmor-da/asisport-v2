/**
 * Utilidad para calcular la completitud de datos de un alumno.
 * 
 * Un alumno se considera "Pendiente" (incompleto) si le falta
 * alguno de los campos obligatorios definidos aquí.
 * 
 * Reglas especiales:
 *  - Representante Legal: se necesita al menos UN padre/madre con nombre Y teléfono.
 *  - Mensualidad: puede ser 0 (becado), pero no null/undefined.
 */

/**
 * Definición de campos obligatorios con su nombre legible para el usuario.
 * Cada entrada tiene:
 *  - campo: nombre del campo en el objeto alumno
 *  - etiqueta: texto en español para mostrar al usuario
 *  - validar: función que retorna true si el campo está completo
 */
const CAMPOS_OBLIGATORIOS = [
    {
        campo: 'nombres',
        etiqueta: 'Nombres',
        validar: (alumno) => !!(alumno.nombres && alumno.nombres.trim())
    },
    {
        campo: 'apellidos',
        etiqueta: 'Apellidos',
        validar: (alumno) => !!(alumno.apellidos && alumno.apellidos.trim())
    },
    {
        campo: 'fecha_nacimiento',
        etiqueta: 'Fecha de Nacimiento',
        validar: (alumno) => !!alumno.fecha_nacimiento
    },
    {
        campo: 'carnet_identidad',
        etiqueta: 'Carnet de Identidad',
        validar: (alumno) => !!(alumno.carnet_identidad && alumno.carnet_identidad.trim())
    },
    {
        campo: 'representante_nombre',
        etiqueta: 'Nombre del Representante (Padre o Madre)',
        validar: (alumno) => {
            const tieneNombrePadre = !!(alumno.nombre_padre && alumno.nombre_padre.trim());
            const tieneNombreMadre = !!(alumno.nombre_madre && alumno.nombre_madre.trim());
            return tieneNombrePadre || tieneNombreMadre;
        }
    },
    {
        campo: 'representante_telefono',
        etiqueta: 'Teléfono del Representante (Padre o Madre)',
        validar: (alumno) => {
            const tieneTelPadre = !!(alumno.telefono_padre && alumno.telefono_padre.trim());
            const tieneTelMadre = !!(alumno.telefono_madre && alumno.telefono_madre.trim());
            return tieneTelPadre || tieneTelMadre;
        }
    },
    {
        campo: 'colegio',
        etiqueta: 'Colegio',
        validar: (alumno) => !!(alumno.colegio && alumno.colegio.trim())
    },
    {
        campo: 'direccion',
        etiqueta: 'Dirección',
        validar: (alumno) => !!(alumno.direccion && alumno.direccion.trim())
    },
    {
        campo: 'cancha_id',
        etiqueta: 'Grupo',
        validar: (alumno) => !!alumno.cancha_id
    },
    {
        campo: 'horario_id',
        etiqueta: 'Horario',
        validar: (alumno) => !!alumno.horario_id
    },
    {
        campo: 'profesor_asignado_id',
        etiqueta: 'Entrenador Asignado',
        validar: (alumno) => !!alumno.profesor_asignado_id
    },
    {
        campo: 'sucursal_id',
        etiqueta: 'Sucursal',
        validar: (alumno) => !!alumno.sucursal_id
    },
    {
        campo: 'foto_url',
        etiqueta: 'Foto',
        validar: (alumno) => !!(alumno.foto_url && alumno.foto_url.trim())
    },
    {
        campo: 'tipo',
        etiqueta: 'Tipo',
        validar: (alumno) => !!(alumno.tipo && alumno.tipo.trim())
    },
    {
        campo: 'mensualidad',
        etiqueta: 'Mensualidad',
        validar: (alumno) => alumno.mensualidad !== null && alumno.mensualidad !== undefined && alumno.mensualidad !== ''
    }
];

/**
 * Obtiene la lista de campos faltantes (incompletos) de un alumno.
 * @param {Object} alumno - Objeto con los datos del alumno
 * @returns {string[]} - Array de etiquetas legibles de campos faltantes
 */
export const getCamposFaltantes = (alumno) => {
    if (!alumno) return [];
    return CAMPOS_OBLIGATORIOS
        .filter(campo => !campo.validar(alumno))
        .map(campo => campo.etiqueta);
};

/**
 * Verifica si un alumno tiene toda su información completa.
 * @param {Object} alumno - Objeto con los datos del alumno
 * @returns {boolean} - true si todos los campos obligatorios están completos
 */
export const esAlumnoCompleto = (alumno) => {
    if (!alumno) return false;
    return CAMPOS_OBLIGATORIOS.every(campo => campo.validar(alumno));
};

/**
 * Verifica si un alumno está incompleto (tiene datos pendientes).
 * Función inversa de esAlumnoCompleto, para mayor legibilidad.
 * @param {Object} alumno - Objeto con los datos del alumno
 * @returns {boolean} - true si le falta algún campo obligatorio
 */
export const esAlumnoIncompleto = (alumno) => !esAlumnoCompleto(alumno);

export { CAMPOS_OBLIGATORIOS };
