import * as XLSX from 'xlsx';

const VALOR_VACIO = '-';

const serialFechaExcel = (anio, mes, dia) => (
    Date.UTC(anio, mes - 1, dia) / 86400000 + 25569
);

const fechaExcelDesdeIso = (fechaIso) => {
    if (!fechaIso) return VALOR_VACIO;

    const [anio, mes, dia] = String(fechaIso).split('-').map(Number);
    if (!anio || !mes || !dia) return VALOR_VACIO;

    return serialFechaExcel(anio, mes, dia);
};

const fechaExcelDesdeDate = (fecha) => serialFechaExcel(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    fecha.getDate()
);

const obtenerAnchosDesdeDatos = (filas) => {
    const cantidadColumnas = 4;

    return Array.from({ length: cantidadColumnas }, (_, columna) => {
        const largos = filas.map(fila => (
            columna === 2 && fila[columna] !== VALOR_VACIO
                ? 10
                : String(fila[columna] ?? '').length
        ));
        const largoMaximo = Math.max(
            ...largos,
            1
        );

        // Se ignoran deliberadamente los encabezados al calcular el ancho.
        return { wch: largoMaximo + 2 };
    });
};

/**
 * Obtiene el o los nombres de grupo para la cabecera de la Lista de Buena Fe.
 * Prioriza los grupos seleccionados en el filtro, y si no se filtró por grupo,
 * toma los grupos reales a los que pertenecen los alumnos incluidos en el reporte.
 *
 * @param {Array} alumnos - Lista de alumnos a exportar.
 * @param {Object} [opciones={}] - Opciones de filtrado.
 * @param {string} [opciones.grupo] - Grupo forzado explícitamente.
 * @param {Array<string>} [opciones.selectedCanchas] - IDs de grupos seleccionados.
 * @param {Array<Object>} [opciones.canchas] - Catálogo de grupos disponibles.
 * @returns {string} Nombre(s) de grupo formateado(s).
 */
export const obtenerGrupoListaBuenaFe = (alumnos, opciones = {}) => {
    const {
        grupo,
        selectedCanchas = [],
        canchas = []
    } = opciones;

    // 1. Grupo explícito si fue proporcionado
    if (grupo && typeof grupo === 'string' && grupo.trim()) {
        return grupo.trim();
    }

    // 2. Si el usuario filtró por canchas/grupos en la interfaz
    if (Array.isArray(selectedCanchas) && selectedCanchas.length > 0) {
        const mapaCanchas = new Map(
            (canchas || []).map(c => [
                String(c.value ?? c.id),
                (c.nombre || c.label || '').replace(/\s*\(\d+\)\s*$/, '').trim()
            ])
        );

        const nombresSeleccionados = [...new Set(
            selectedCanchas
                .map(id => mapaCanchas.get(String(id)))
                .filter(Boolean)
        )];

        if (nombresSeleccionados.length > 0) {
            return nombresSeleccionados.join(', ');
        }
    }

    // 3. Obtener los grupos reales asignados a los alumnos exportados
    if (Array.isArray(alumnos) && alumnos.length > 0) {
        const gruposAlumnos = [...new Set(
            alumnos
                .map(a => (a.cancha_nombre || a.cancha?.nombre || '').trim())
                .filter(Boolean)
        )];

        if (gruposAlumnos.length > 0) {
            return gruposAlumnos.join(', ');
        }
    }

    return VALOR_VACIO;
};

// Alias para mantener compatibilidad si se invoca con el nombre anterior
export const obtenerCategoriaListaBuenaFe = obtenerGrupoListaBuenaFe;

export const obtenerEntrenadoresListaBuenaFe = ({
    alumnos,
    entrenadores,
    usuarioActual
}) => {
    const nombresPorId = new Map(
        entrenadores.map(entrenador => [entrenador.value, entrenador.label])
    );

    if (usuarioActual?.id) {
        nombresPorId.set(
            usuarioActual.id,
            `${usuarioActual.nombres || ''} ${usuarioActual.apellidos || ''}`.trim()
        );
    }

    const nombres = [...new Set(
        alumnos
            .map(alumno => nombresPorId.get(alumno.profesor_asignado_id))
            .filter(Boolean)
    )];

    return nombres.length > 0 ? nombres.join(', ') : VALOR_VACIO;
};

export const crearHojaListaBuenaFe = ({
    alumnos,
    nombreEscuela,
    nombresEntrenadores,
    grupo,
    categoria,
    selectedCanchas,
    canchas,
    fechaGeneracion = new Date()
}) => {
    const filasAlumnos = alumnos.map(alumno => [
        alumno.nombres || VALOR_VACIO,
        alumno.apellidos || VALOR_VACIO,
        fechaExcelDesdeIso(alumno.fecha_nacimiento),
        alumno.carnet_identidad || VALOR_VACIO
    ]);

    const grupoFinal = grupo || categoria || obtenerGrupoListaBuenaFe(alumnos, {
        selectedCanchas,
        canchas
    });

    const filas = [
        ['LISTA DE BUENA FE', nombreEscuela || VALOR_VACIO],
        ['Fecha:', fechaExcelDesdeDate(fechaGeneracion)],
        ['Entrenador:', nombresEntrenadores || VALOR_VACIO],
        ['Grupo:', grupoFinal],
        [],
        ['Nombres', 'Apellidos', 'Fecha Nacimiento', 'Carnet Identidad'],
        ...filasAlumnos
    ];

    const hoja = XLSX.utils.aoa_to_sheet(filas);

    hoja.B2.z = 'd/m/yyyy';
    filasAlumnos.forEach((fila, indice) => {
        if (fila[2] !== VALOR_VACIO) {
            hoja[`C${indice + 7}`].z = 'd/m/yyyy';
        }
    });

    hoja['!cols'] = obtenerAnchosDesdeDatos(filasAlumnos);

    return hoja;
};

const fechaArchivo = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

export const exportarListaBuenaFe = (opciones) => {
    const fechaGeneracion = new Date();
    const hoja = crearHojaListaBuenaFe({ ...opciones, fechaGeneracion });
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, 'Lista de Buena Fe');
    XLSX.writeFile(libro, `Lista_Buena_Fe_${fechaArchivo(fechaGeneracion)}.xlsx`);
};

/**
 * Genera el texto de la lista de buena fe para compartir por WhatsApp.
 * Considera exclusivamente los nombres de los alumnos (sin apellidos).
 *
 * @param {Array} alumnos - Lista de alumnos seleccionados
 * @param {string} mensajeEncabezado - Texto o encabezado inicial del mensaje
 * @returns {string} Mensaje formateado listo para enviar por WhatsApp
 */
export const generarMensajeWhatsAppListaBuenaFe = (alumnos, mensajeEncabezado = '') => {
    if (!Array.isArray(alumnos) || alumnos.length === 0) {
        return '';
    }

    const listaNombres = alumnos
        .map((alumno, indice) => {
            const nombre = (alumno?.nombres || '').trim().replace(/\s+/g, ' ');
            return `${indice + 1}. ${nombre || VALOR_VACIO}`;
        })
        .join('\n');

    const encabezado = (mensajeEncabezado || '').trim();
    return encabezado ? `${encabezado}\n\n${listaNombres}` : listaNombres;
};

