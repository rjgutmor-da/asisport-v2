const VALOR_VACIO = '-';

/**
 * Formatea una fecha YYYY-MM-DD a formato legible DD/MM/YYYY si aplica.
 * Si el usuario ingresó otro formato o texto libre, lo devuelve tal cual.
 *
 * @param {string} valorFecha - Fecha en formato ISO o texto.
 * @returns {string} Fecha formateada.
 */
export const formatearFechaConvocatoria = (valorFecha) => {
    if (!valorFecha || typeof valorFecha !== 'string') return '';
    const limpia = valorFecha.trim();
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpia);
    if (!coincidencia) return limpia;
    const [, anio, mes, dia] = coincidencia;
    return `${dia}/${mes}/${anio}`;
};

/**
 * Genera el mensaje de texto de la convocatoria para compartir por WhatsApp.
 * Incluye encabezado, datos opcionales del encuentro (Torneo, Fecha, Hora, Dirección)
 * y la lista numerada exclusivamente con los nombres de pila de los alumnos.
 *
 * @param {Array<Object>} alumnos - Lista de alumnos convocados.
 * @param {Object} datosPartido - Datos del partido o evento.
 * @param {string} [datosPartido.torneo] - Nombre del torneo.
 * @param {string} [datosPartido.fecha] - Fecha del partido.
 * @param {string} [datosPartido.hora] - Hora de citación o partido.
 * @param {string} [datosPartido.direccion] - Dirección o cancha del encuentro.
 * @param {string} [datosPartido.encabezado] - Texto de encabezado inicial.
 * @returns {string} Mensaje formateado listo para enviar por WhatsApp.
 */
export const generarMensajeWhatsAppConvocatoria = (alumnos, datosPartido = {}) => {
    if (!Array.isArray(alumnos) || alumnos.length === 0) {
        return '';
    }

    const {
        torneo = '',
        fecha = '',
        hora = '',
        direccion = '',
        encabezado = 'Esta es la lista de Convocados:'
    } = datosPartido;

    const bloques = [];

    const textoEncabezado = (encabezado || '').trim();
    if (textoEncabezado) {
        bloques.push(`📋 *${textoEncabezado}*`);
    }

    const lineasDetalles = [];
    if (torneo.trim()) {
        lineasDetalles.push(`🏆 *Torneo:* ${torneo.trim()}`);
    }
    if (fecha.trim()) {
        lineasDetalles.push(`📅 *Fecha:* ${formatearFechaConvocatoria(fecha)}`);
    }
    if (hora.trim()) {
        lineasDetalles.push(`⏰ *Hora:* ${hora.trim()}`);
    }
    if (direccion.trim()) {
        lineasDetalles.push(`📍 *Dirección:* ${direccion.trim()}`);
    }

    if (lineasDetalles.length > 0) {
        bloques.push(lineasDetalles.join('\n'));
    }

    const listaNombres = alumnos
        .map((alumno, indice) => {
            const nombre = (alumno?.nombres || '').trim().replace(/\s+/g, ' ');
            return `${indice + 1}. ${nombre || VALOR_VACIO}`;
        })
        .join('\n');

    bloques.push(listaNombres);

    return bloques.join('\n\n');
};
