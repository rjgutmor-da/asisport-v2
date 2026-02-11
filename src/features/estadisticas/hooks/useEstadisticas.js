
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
            case 'hoy': {
                return { start: new Date(today), end: new Date(today) };
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
     * Lógica de filtrado en memoria. 
     * Procesa la lista de asistencias y las filtra según los criterios elegidos por el usuario.
     */
    const filteredData = useMemo(() => {
        if (!asistencias.length) return [];

        return asistencias.filter(asistencia => {
            const alumno = alumnos.find(a => a.id === asistencia.alumno_id);
            if (!alumno) return false;

            // Filtrado por Entrenador (Múltiple)
            if (selectedEntrenadores.length > 0) {
                const tieneEntrenador = alumno.alumnos_entrenadores?.some(
                    ae => selectedEntrenadores.includes(ae.entrenador_id)
                );
                if (!tieneEntrenador) return false;
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
        if (!filteredData.length) return [];

        const grouped = filteredData.reduce((acc, curr) => {
            const alumnoId = curr.alumno_id;
            if (!acc[alumnoId]) {
                const alumno = alumnos.find(a => a.id === alumnoId);
                acc[alumnoId] = {
                    nombreCompleto: alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Desconocido',
                    presentes: 0,
                    licencias: 0
                };
            }
            if (curr.estado === 'Presente') acc[alumnoId].presentes++;
            else if (curr.estado === 'Licencia') acc[alumnoId].licencias++;
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    }, [filteredData, alumnos]);

    /**
     * Texto con el rango de fechas formateado para encabezados de reportes.
     */
    const dateRangeText = useMemo(() => {
        const format = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${format(dateRange.start)} - ${format(dateRange.end)}`;
    }, [dateRange]);

    /**
     * Obtiene dinámicamente todas las categorías (Sub-X) disponibles basadas en los alumnos activos.
     */
    const availableCategorias = useMemo(() => {
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

    return {
        // Estado de carga y métricas
        loading,
        metrics,
        tableData,
        exportData,
        dateRangeText,

        // Maestros para combos
        canchas,
        horarios,
        entrenadores,
        availableCategorias,

        // Controladores de filtros
        dateRangeOption, setDateRangeOption,
        selectedEntrenadores, setSelectedEntrenadores,
        selectedCanchas, setSelectedCanchas,
        selectedHorarios, setSelectedHorarios,
        selectedCategorias, setSelectedCategorias,

        alumnos
    };
};
