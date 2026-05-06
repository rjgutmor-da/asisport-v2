
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { getAsistenciasRango } from '../../../services/asistencias';
import { getAsistenciasRangoDetalle } from '../../../services/estadisticasService';
import { useMasterData } from '../../../hooks/useMasterData';
import { useDebounce } from '../../../hooks/useDebounce';

/**
 * Hook personalizado para gestionar la lógica del módulo de Estadísticas.
 * Se encarga de la carga de datos maestros, el filtrado complejo por múltiples criterios
 * y la preparación de datos para visualización en tabla y exportación a Excel.
 * 
 * Usa v_estadisticas_asistencia_diaria (datos agregados) para la tabla de resumen,
 * y asistencias_normales (filas individuales) solo para la exportación detallada.
 */
export const useEstadisticas = () => {
    const { addToast } = useToast();

    // --- DATOS MAESTROS (React Query en caché) ---
    const { 
        alumnos, 
        entrenadores: rawEntrenadores, 
        canchas: rawCanchas, 
        horarios: rawHorarios, 
        isLoading: isLoadingMasters, 
        isError 
    } = useMasterData();

    // Transformamos los datos para que el componente MultiSelectFilter pueda consumirlos fácilmente
    const canchas = useMemo(() => rawCanchas.map(c => ({ value: c.id, label: c.nombre })), [rawCanchas]);
    const horarios = useMemo(() => rawHorarios.map(h => ({ value: h.id, label: h.hora })), [rawHorarios]);
    const entrenadores = useMemo(() => rawEntrenadores.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })), [rawEntrenadores]);

    useEffect(() => {
        if (isError) {
            console.error("Error cargando datos maestros desde la caché.");
            addToast("Error al cargar datos iniciales", "error");
        }
    }, [isError, addToast]);

    const [loadingAsistencias, setLoadingAsistencias] = useState(true);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const loading = isLoadingMasters || loadingAsistencias;

    // --- ESTADOS DE DATOS ---
    const [asistenciasAgregadas, setAsistenciasAgregadas] = useState([]); // Datos agregados de la vista
    const [asistenciasDetalle, setAsistenciasDetalle] = useState(null); // Datos individuales para exportación (carga bajo demanda)

    // --- ESTADOS DE FILTROS ---
    const [dateRangeOption, setDateRangeOption] = useState('mes_anterior'); // Opción de pre-ajuste de fecha

    // Filtros de Selección Múltiple (Arrays vacíos significan "Seleccionar Todos")
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]);
    const [selectedCanchas, setSelectedCanchas] = useState([]);
    const [selectedHorarios, setSelectedHorarios] = useState([]);
    const [selectedCategorias, setSelectedCategorias] = useState([]);
    const [selectedDias, setSelectedDias] = useState([]);

    // --- DEBOUNCE DE FILTROS (600ms) ---
    // Evita que la interfaz se recalcule inmediatamente mientras el usuario selecciona múltiples opciones
    const debouncedEntrenadores = useDebounce(selectedEntrenadores, 600);
    const debouncedCanchas = useDebounce(selectedCanchas, 600);
    const debouncedHorarios = useDebounce(selectedHorarios, 600);
    const debouncedCategorias = useDebounce(selectedCategorias, 600);
    const debouncedDias = useDebounce(selectedDias, 600);

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

    // Función auxiliar para extraer YYYY-MM-DD sin problemas de zona horaria UTC
    const toLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * Efecto que se dispara cada vez que cambia el rango de fechas.
     * Obtiene de Supabase los datos agregados de la vista v_estadisticas_asistencia_diaria.
     */
    useEffect(() => {
        const loadAsistencias = async () => {
            setLoadingAsistencias(true);
            // Limpiar detalle cuando cambia el rango (para forzar recarga si se exporta)
            setAsistenciasDetalle(null);
            try {
                const startStr = toLocalDateString(dateRange.start);
                const endStr = toLocalDateString(dateRange.end);

                const data = await getAsistenciasRango(startStr, endStr);
                setAsistenciasAgregadas(data || []);
            } catch (error) {
                console.error("Error cargando asistencias:", error);
                addToast("Error al cargar asistencias", "error");
                setAsistenciasAgregadas([]);
            } finally {
                setLoadingAsistencias(false);
            }
        };

        if (dateRange.start && dateRange.end) {
            loadAsistencias();
        }
    }, [dateRange, addToast]);

    /**
     * Filtrado de datos AGREGADOS de la vista.
     * Filtra por entrenador, cancha, horario usando las columnas de la vista directamente.
     * Para categoría, filtra por los alumnos que pertenecen a esas categorías.
     */
    const filteredData = useMemo(() => {
        if (!asistenciasAgregadas.length) return [];

        return asistenciasAgregadas.filter(row => {
            // Filtrado por Entrenador (la vista tiene profesor_asignado_id)
            if (debouncedEntrenadores.length > 0) {
                if (!debouncedEntrenadores.includes(row.profesor_asignado_id)) {
                    return false;
                }
            }

            // Filtrado por Cancha (la vista tiene cancha_id)
            if (debouncedCanchas.length > 0 && !debouncedCanchas.includes(row.cancha_id)) {
                return false;
            }

            // Filtrado por Horario (la vista tiene horario_id)
            if (debouncedHorarios.length > 0 && !debouncedHorarios.includes(row.horario_id)) {
                return false;
            }

            // Filtrado por Categoría — necesitamos verificar si hay alumnos con esa categoría
            // asignados al entrenador/cancha/horario de esta fila
            if (debouncedCategorias.length > 0) {
                const hayAlumnoEnCategoria = alumnos.some(alumno => {
                    const subLabel = `Sub-${alumno.sub}`;
                    if (!debouncedCategorias.includes(subLabel)) return false;
                    // Verificar que el alumno coincida con los criterios de esta fila agregada
                    if (row.profesor_asignado_id && alumno.profesor_asignado_id !== row.profesor_asignado_id) return false;
                    if (row.cancha_id && alumno.cancha_id !== row.cancha_id) return false;
                    if (row.horario_id && alumno.horario_id !== row.horario_id) return false;
                    return true;
                });
                if (!hayAlumnoEnCategoria) return false;
            }

            // Filtrado por Día de la Semana
            if (debouncedDias.length > 0) {
                const dateObj = new Date(row.fecha + 'T12:00:00');
                const diaNombre = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                if (!debouncedDias.map(d => d.toLowerCase()).includes(diaNombre.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });
    }, [asistenciasAgregadas, alumnos, debouncedEntrenadores, debouncedCanchas, debouncedHorarios, debouncedCategorias, debouncedDias]);

    /**
     * Calcula las métricas generales (KPIs) sumando los conteos de la vista agregada.
     */
    const metrics = useMemo(() => {
        const presentes = filteredData.reduce((sum, row) => sum + (Number(row.presentes) || 0), 0);
        const licencias = filteredData.reduce((sum, row) => sum + (Number(row.licencias) || 0), 0);
        return { presentes, licencias };
    }, [filteredData]);

    /**
     * Prepara los datos para la tabla de visualización diaria.
     * Agrupa los registros agregados por fecha y suma los totales.
     */
    const tableData = useMemo(() => {
        if (!filteredData.length) return [];

        // Agrupar por fecha (puede haber múltiples filas por fecha por diferentes entrenador/cancha/horario)
        const grouped = filteredData.reduce((acc, curr) => {
            const fecha = curr.fecha;
            if (!acc[fecha]) {
                acc[fecha] = { fecha, presentes: 0, licencias: 0 };
            }
            acc[fecha].presentes += Number(curr.presentes) || 0;
            acc[fecha].licencias += Number(curr.licencias) || 0;
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
     * Carga asistencias individuales bajo demanda para la exportación a Excel.
     * Solo se ejecuta cuando el usuario solicita exportar.
     */
    const loadDetalleForExport = async () => {
        // Forzamos la recarga siempre para asegurar que tenemos los datos completos (evitar caché de 1000 filas)
        setLoadingDetalle(true);
        try {
            const startStr = toLocalDateString(dateRange.start);
            const endStr = toLocalDateString(dateRange.end);
            const data = await getAsistenciasRangoDetalle(startStr, endStr);
            setAsistenciasDetalle(data || []);
            return data;
        } catch (error) {
            console.error("Error al cargar detalle para exportación:", error);
            return [];
        } finally {
            setLoadingDetalle(false);
        }
    };

    /**
     * Prepara los datos consolidados para el archivo Excel.
     * Usa datos individuales (cargados bajo demanda) para el detalle por alumno.
     */
    const exportData = useMemo(() => {
        // Si no hay datos de detalle aún, devolver estructura vacía
        // (se llenará cuando el usuario solicite exportar)
        if (!asistenciasDetalle || !asistenciasDetalle.length) {
            // Devolver un resumen básico basado en los datos agregados
            if (filteredData.length > 0) {
                return { 
                    students: [], 
                    dates: [],
                    hasAggregateData: true // Indicador para UI
                };
            }
            return { students: [], dates: [], hasAggregateData: false };
        }

        // Filtrar las asistencias individuales
        const alumnosMap = new Map(alumnos.map(a => [a.id, a]));
        
        const filteredDetalle = asistenciasDetalle.filter(asistencia => {
            const alumno = alumnosMap.get(asistencia.alumno_id);
            if (!alumno) return false;

            // Filtrado por Entrenador: 
            // Incluimos si el entrenador que tomó la asistencia coincide
            // O si el alumno está asignado actualmente a ese entrenador (para no perder registros históricos si cambió el profesor)
            if (debouncedEntrenadores.length > 0) {
                const matchRegistro = asistencia.entrenador_id && debouncedEntrenadores.includes(asistencia.entrenador_id);
                const matchAlumno = alumno.profesor_asignado_id && debouncedEntrenadores.includes(alumno.profesor_asignado_id);
                if (!matchRegistro && !matchAlumno) return false;
            }

            if (debouncedCanchas.length > 0 && !debouncedCanchas.includes(alumno.cancha_id)) return false;
            if (debouncedHorarios.length > 0 && !debouncedHorarios.includes(alumno.horario_id)) return false;
            if (debouncedCategorias.length > 0 && !debouncedCategorias.includes(alumno.categoria_id)) return false;
            
            if (debouncedDias.length > 0) {
                const dateObj = new Date(asistencia.fecha + 'T12:00:00');
                const diaNombre = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                if (!debouncedDias.map(d => d.toLowerCase()).includes(diaNombre.toLowerCase())) return false;
            }
            return true;
        });

        if (!filteredDetalle.length) return { students: [], dates: [], hasAggregateData: false };

        const dates = [...new Set(filteredDetalle.map(a => a.fecha))].sort();

        const grouped = filteredDetalle.reduce((acc, curr) => {
            const alumnoId = curr.alumno_id;
            if (!acc[alumnoId]) {
                const alumno = alumnosMap.get(alumnoId);
                const nombreFormateado = alumno 
                    ? `${alumno.nombres} ${alumno.apellidos}` 
                    : 'Desconocido';
                
                acc[alumnoId] = {
                    id: alumnoId,
                    nombreCompleto: nombreFormateado,
                    apellidos: alumno?.apellidos || '',
                    nombres: alumno?.nombres || '',
                    presentes: 0,
                    licencias: 0,
                    asistenciasPorFecha: {}
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
            students: Object.values(grouped).sort((a, b) => {
                // Ordenamos por nombre completo tal como se muestra
                return a.nombreCompleto.localeCompare(b.nombreCompleto);
            }),
            dates: dates,
            hasAggregateData: false
        };
    }, [asistenciasDetalle, alumnos, filteredData, debouncedEntrenadores, debouncedCanchas, debouncedHorarios, debouncedCategorias, debouncedDias]);

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
        const subs = new Set();
        alumnos.forEach(alumno => {
            if (alumno.sub !== undefined) {
                subs.add(alumno.sub);
            }
        });
        return Array.from(subs)
            .sort((a, b) => a - b)
            .map(sub => ({ value: `Sub-${sub}`, label: `Sub-${sub}` }));
    }, [alumnos]);

    // --- OPCIONES DINÁMICAS (CROSS-FILTERING) ---
    const dynamicOptions = useMemo(() => {
        const getAlumnosFilteredByOthers = (excludeFilter) => {
            let temp = alumnos;
            if (excludeFilter !== 'entrenador' && debouncedEntrenadores.length > 0) {
                temp = temp.filter(a => debouncedEntrenadores.includes(a.profesor_asignado_id));
            }
            if (excludeFilter !== 'categoria' && debouncedCategorias.length > 0) {
                temp = temp.filter(a => debouncedCategorias.includes(`Sub-${a.sub}`));
            }
            if (excludeFilter !== 'horario' && debouncedHorarios.length > 0) {
                temp = temp.filter(a => debouncedHorarios.includes(a.horario_id));
            }
            if (excludeFilter !== 'cancha' && debouncedCanchas.length > 0) {
                temp = temp.filter(a => debouncedCanchas.includes(a.cancha_id));
            }
            return temp;
        };

        const filteredForEntrenador = getAlumnosFilteredByOthers('entrenador');
        const filteredForSub = getAlumnosFilteredByOthers('categoria');
        const filteredForHorario = getAlumnosFilteredByOthers('horario');
        const filteredForCancha = getAlumnosFilteredByOthers('cancha');

        const validEntrenadoresIds = new Set(filteredForEntrenador.map(a => a.profesor_asignado_id));
        const validSubsValues = new Set(filteredForSub.map(a => `Sub-${a.sub}`));
        const validHorariosIds = new Set(filteredForHorario.map(a => a.horario_id));
        const validCanchasIds = new Set(filteredForCancha.map(a => a.cancha_id));

        return {
            entrenadores: entrenadores.map(opt => ({ ...opt, disabled: !validEntrenadoresIds.has(opt.value) })),
            availableCategorias: masterCategorias.map(opt => ({ ...opt, disabled: !validSubsValues.has(opt.value) })),
            horarios: horarios.map(opt => ({ ...opt, disabled: !validHorariosIds.has(opt.value) })),
            canchas: canchas.map(opt => ({ ...opt, disabled: !validCanchasIds.has(opt.value) }))
        };
    }, [alumnos, entrenadores, canchas, horarios, masterCategorias, debouncedEntrenadores, debouncedCategorias, debouncedHorarios, debouncedCanchas]);

    return {
        // Estado de carga y métricas
        loading,
        loadingDetalle,
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
        selectedDias, setSelectedDias,

        alumnos,
        
        // Función para cargar detalle bajo demanda (para exportar)
        loadDetalleForExport
    };
};
