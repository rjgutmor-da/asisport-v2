
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { getAlumnos } from '../../../services/alumnos';
import { getAsistenciasRango } from '../../../services/asistencias';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';

/**
 * Hook personalizado para gestionar la lógica del módulo de Estadísticas.
 * Se encarga de la carga de datos maestros, el filtrado complejo por múltiples criterios
 * y la preparación de datos para visualización en tabla y exportación a Excel.
 */
export const useEstadisticas = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE DATOS ---
    const [alumnos, setAlumnos] = useState([]);      // Listado completo de alumnos
    const [asistencias, setAsistencias] = useState([]); // Asistencias en el rango de fechas seleccionado
    const [canchas, setCanchas] = useState([]);        // Maestro de canchas disponibles
    const [horarios, setHorarios] = useState([]);      // Maestro de horarios disponibles
    const [entrenadores, setEntrenadores] = useState([]);// Maestro de entrenadores de la escuela

    // --- ESTADOS DE FILTROS ---
    const [dateRangeOption, setDateRangeOption] = useState('mes_anterior'); // Opción de pre-ajuste de fecha

    // Filtros de Selección Múltiple (Arrays vacíos significan "Seleccionar Todos")
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]);
    const [selectedCanchas, setSelectedCanchas] = useState([]);
    const [selectedHorarios, setSelectedHorarios] = useState([]);
    const [selectedCategorias, setSelectedCategorias] = useState([]);

    /**
     * Efecto inicial para cargar los datos maestros de la escuela.
     * Estos datos se utilizan para poblar los filtros de selección.
     */
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const [alumnosData, canchasData, horariosData, entrenadoresData] = await Promise.all([
                    getAlumnos(),
                    getCanchas(),
                    getHorarios(),
                    getEntrenadores()
                ]);
                setAlumnos(alumnosData);
                // Transformamos los datos para que el componente MultiSelectFilter pueda consumirlos fácilmente
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
                setEntrenadores(entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })));
            } catch (error) {
                console.error("Error cargando datos maestros:", error);
                addToast("Error al cargar datos iniciales", "error");
            }
        };
        loadMasterData();
    }, [addToast]);

    /**
     * Calcula dinámicamente el objeto de rango de fechas { start, end } basado en la opción seleccionada.
     * Soporta: Hoy, Semana Anterior (Lun-Dom), Mes Anterior (completo) e Histórico.
     */
    const dateRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateRangeOption) {
            case 'ayer': {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return { start: yesterday, end: yesterday };
            }
            case 'esta_semana': {
                // De lunes de esta semana hasta hoy
                const dayOfWeek = today.getDay();
                const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(today);
                monday.setDate(today.getDate() - daysToMonday);
                return { start: monday, end: today };
            }
            case 'semana_anterior': {
                // Retroceder al lunes de la semana pasada y al domingo siguiente
                const dayOfWeek = today.getDay();
                const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const lastMonday = new Date(today);
                lastMonday.setDate(today.getDate() - daysToLastMonday - 7);

                const lastSunday = new Date(lastMonday);
                lastSunday.setDate(lastMonday.getDate() + 6);

                return { start: lastMonday, end: lastSunday };
            }
            case 'mes_anterior': {
                // Primer día del mes anterior (ej: si hoy es Feb, devuelve 1 de Enero)
                const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                // Último día del mes anterior (día 0 del mes actual)
                const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

                return { start: firstDayPrevMonth, end: lastDayPrevMonth };
            }
            case 'este_mes': {
                // Del primer día del mes actual hasta hoy
                const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return { start: firstDayThisMonth, end: today };
            }
            case 'todo': {
                const startDate = new Date(2020, 0, 1);
                return { start: startDate, end: today };
            }
            default:
                return { start: today, end: today };
        }
    }, [dateRangeOption]);

    /**
     * Efecto que se dispara cada vez que cambia el rango de fechas.
     * Obtiene de Supabase todas las asistencias registradas en ese periodo.
     */
    useEffect(() => {
        const loadAsistencias = async () => {
            setLoading(true);
            try {
                const startStr = dateRange.start.toISOString().split('T')[0];
                const endStr = dateRange.end.toISOString().split('T')[0];

                const data = await getAsistenciasRango(startStr, endStr);
                setAsistencias(data || []);
            } catch (error) {
                console.error("Error cargando asistencias:", error);
                addToast("Error al cargar asistencias", "error");
                setAsistencias([]);
            } finally {
                setLoading(false);
            }
        };

        if (dateRange.start && dateRange.end) {
            loadAsistencias();
        }
    }, [dateRange, addToast]);

    /**
     * Lógica de filtrado en memoria optimizada con Map indexado.
     * Procesa la lista de asistencias y las filtra según los criterios elegidos por el usuario.
     * Usa un Map para búsqueda O(1) en vez de Array.find() O(n) por cada asistencia.
     */
    const filteredData = useMemo(() => {
        if (!asistencias.length || !alumnos.length) return [];

        // Crear Map indexado para búsqueda O(1) — evita O(n²) con Array.find()
        const alumnosMap = new Map(alumnos.map(a => [a.id, a]));

        return asistencias.filter(asistencia => {
            const alumno = alumnosMap.get(asistencia.alumno_id);
            if (!alumno) return false;

            // Filtrado por Entrenador (Múltiple)
            if (selectedEntrenadores.length > 0) {
                if (!selectedEntrenadores.includes(alumno.profesor_asignado_id)) {
                    return false;
                }
            }

            // Filtrado por Cancha (Múltiple)
            if (selectedCanchas.length > 0 && !selectedCanchas.includes(alumno.cancha_id)) {
                return false;
            }

            // Filtrado por Horario (Múltiple)
            if (selectedHorarios.length > 0 && !selectedHorarios.includes(alumno.horario_id)) {
                return false;
            }

            // Filtrado por Categoría (Año Actual - Año Nacimiento)
            if (selectedCategorias.length > 0) {
                const currentYear = new Date().getFullYear();
                const birthYear = new Date(alumno.fecha_nacimiento).getFullYear();
                const sub = currentYear - birthYear;
                const subLabel = `Sub-${sub}`;

                if (!selectedCategorias.includes(subLabel)) {
                    return false;
                }
            }

            return true;
        });
    }, [asistencias, alumnos, selectedEntrenadores, selectedCanchas, selectedHorarios, selectedCategorias]);

    /**
     * Calcula las métricas generales (KPIs) para las tarjetas superiores.
     */
    const metrics = useMemo(() => {
        const presentes = filteredData.filter(a => a.estado === 'Presente').length;
        const licencias = filteredData.filter(a => a.estado === 'Licencia').length;
        return { presentes, licencias };
    }, [filteredData]);

    /**
     * Prepara los datos para la tabla de visualización diaria.
     * Agrupa asistencias por fecha y cuenta totales de presentes/licencias por día.
     */
    const tableData = useMemo(() => {
        if (!filteredData.length) return [];

        const grouped = filteredData.reduce((acc, curr) => {
            const fecha = curr.fecha;
            if (!acc[fecha]) {
                acc[fecha] = { fecha, presentes: 0, licencias: 0 };
            }
            if (curr.estado === 'Presente') acc[fecha].presentes++;
            else if (curr.estado === 'Licencia') acc[fecha].licencias++;
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Orden descendente
            .map(item => {
                const dateObj = new Date(item.fecha + 'T12:00:00');
                return {
                    ...item,
                    fechaDisplay: dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                    diaDisplay: dateObj.toLocaleDateString('es-ES', { weekday: 'long' })
                };
            });
    }, [filteredData]);

    /**
     * Prepara los datos consolidados para el archivo Excel.
     * Agrupa datos por alumno, sumando sus asistencias totales en el periodo.
     */
    const exportData = useMemo(() => {
        if (!filteredData.length) return { students: [], dates: [] };

        // 1. Obtener todas las fechas únicas con registros y ordenarlas
        const dates = [...new Set(filteredData.map(a => a.fecha))].sort();

        // 2. Agrupar por alumno
        const grouped = filteredData.reduce((acc, curr) => {
            const alumnoId = curr.alumno_id;
            if (!acc[alumnoId]) {
                const alumno = alumnos.find(a => a.id === alumnoId);
                acc[alumnoId] = {
                    nombreCompleto: alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Desconocido',
                    presentes: 0,
                    licencias: 0,
                    asistenciasPorFecha: {} // mapa fecha -> 'P' o 'L'
                };
            }

            if (curr.estado === 'Presente') {
                acc[alumnoId].presentes++;
                acc[alumnoId].asistenciasPorFecha[curr.fecha] = 'P';
            }
            else if (curr.estado === 'Licencia') {
                acc[alumnoId].licencias++;
                acc[alumnoId].asistenciasPorFecha[curr.fecha] = 'L';
            }
            return acc;
        }, {});

        return {
            students: Object.values(grouped).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
            dates: dates
        };
    }, [filteredData, alumnos]);

    /**
     * Texto con el rango de fechas formateado para encabezados de reportes.
     */
    const dateRangeText = useMemo(() => {
        const format = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${format(dateRange.start)} - ${format(dateRange.end)}`;
    }, [dateRange]);

    /**
     * Obtiene todas las categorías (Sub-X) posibles basadas en la escuela.
     */
    const masterCategorias = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const subs = new Set();
        alumnos.forEach(alumno => {
            if (alumno.fecha_nacimiento) {
                const birthYear = new Date(alumno.fecha_nacimiento).getFullYear();
                const sub = currentYear - birthYear;
                subs.add(sub);
            }
        });
        return Array.from(subs)
            .sort((a, b) => a - b)
            .map(sub => ({ value: `Sub-${sub}`, label: `Sub-${sub}` }));
    }, [alumnos]);

    // --- OPCIONES DINÁMICAS (CROSS-FILTERING) ---
    const dynamicOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();

        const getAlumnosFilteredByOthers = (excludeFilter) => {
            let temp = alumnos;
            if (excludeFilter !== 'entrenador' && selectedEntrenadores.length > 0) {
                temp = temp.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
            }
            if (excludeFilter !== 'categoria' && selectedCategorias.length > 0) {
                temp = temp.filter(a => {
                    const sub = currentYear - new Date(a.fecha_nacimiento).getFullYear();
                    return selectedCategorias.includes(`Sub-${sub}`);
                });
            }
            if (excludeFilter !== 'horario' && selectedHorarios.length > 0) {
                temp = temp.filter(a => selectedHorarios.includes(a.horario_id));
            }
            if (excludeFilter !== 'cancha' && selectedCanchas.length > 0) {
                temp = temp.filter(a => selectedCanchas.includes(a.cancha_id));
            }
            return temp;
        };

        const filteredForEntrenador = getAlumnosFilteredByOthers('entrenador');
        const filteredForSub = getAlumnosFilteredByOthers('categoria');
        const filteredForHorario = getAlumnosFilteredByOthers('horario');
        const filteredForCancha = getAlumnosFilteredByOthers('cancha');

        const validEntrenadoresIds = new Set(filteredForEntrenador.map(a => a.profesor_asignado_id));
        const validSubsValues = new Set(filteredForSub.map(a => `Sub-${currentYear - new Date(a.fecha_nacimiento).getFullYear()}`));
        const validHorariosIds = new Set(filteredForHorario.map(a => a.horario_id));
        const validCanchasIds = new Set(filteredForCancha.map(a => a.cancha_id));

        return {
            entrenadores: entrenadores.map(opt => ({ ...opt, disabled: !validEntrenadoresIds.has(opt.value) })),
            availableCategorias: masterCategorias.map(opt => ({ ...opt, disabled: !validSubsValues.has(opt.value) })),
            horarios: horarios.map(opt => ({ ...opt, disabled: !validHorariosIds.has(opt.value) })),
            canchas: canchas.map(opt => ({ ...opt, disabled: !validCanchasIds.has(opt.value) }))
        };
    }, [alumnos, entrenadores, canchas, horarios, masterCategorias, selectedEntrenadores, selectedCategorias, selectedHorarios, selectedCanchas]);

    return {
        // Estado de carga y métricas
        loading,
        metrics,
        tableData,
        exportData,
        dateRangeText,

        // Maestros cruzados (Cross-filtering)
        ...dynamicOptions,

        // Controladores de filtros
        dateRangeOption, setDateRangeOption,
        selectedEntrenadores, setSelectedEntrenadores,
        selectedCanchas, setSelectedCanchas,
        selectedHorarios, setSelectedHorarios,
        selectedCategorias, setSelectedCategorias,

        alumnos
    };
};
