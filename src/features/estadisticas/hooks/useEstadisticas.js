import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { useCatalogosAsisport, queryKeys } from '../../../hooks/useMasterData';
import { obtenerResumenEstadisticas, exportarAsistenciasAsisport } from '../../../services/estadisticasService';
import { useDebounce } from '../../../hooks/useDebounce';
import {
    filtrarGruposPorEntrenadores,
    filtrarEntrenadoresPorGrupos,
    sanearSeleccionIncompatible
} from '../utils/filtrosCruzados';

/**
 * Hook para gestionar las estadísticas de AsiSport mediante TanStack Query y RPCs de PostgreSQL.
 * Elimina la descarga masiva y agregación en el cliente.
 */
export const useEstadisticas = () => {
    const { addToast } = useToast();
    const { user, userProfile, escuelaId } = useAuth();

    // Catálogos autorizados (gestiones, canchas, entrenadores, horarios)
    const { data: catalogosData, isLoading: loadingCatalogos } = useCatalogosAsisport(userProfile?.sucursal_id, {
        userId: user?.id,
        escuelaId
    });

    const gestiones = useMemo(() => catalogosData?.gestiones || [], [catalogosData?.gestiones]);
    const canchas = useMemo(() => (catalogosData?.canchas || []).map(c => ({
        value: c.id,
        label: c.nombre,
        entrenador_ids: c.entrenador_ids || []
    })), [catalogosData?.canchas]);
    const entrenadores = useMemo(() => (catalogosData?.entrenadores || []).map(e => ({
        value: e.id,
        label: `${e.nombres} ${e.apellidos}`,
        grupo_ids: e.grupo_ids || []
    })), [catalogosData?.entrenadores]);
    const horarios = useMemo(() => (catalogosData?.horarios || []).map(h => ({ value: h.id, label: h.hora })), [catalogosData?.horarios]);

    // Estados de filtros
    const [selectedGestionId, setSelectedGestionId] = useState(null);
    const [dateRangeOption, setDateRangeOption] = useState('este_mes');
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]);
    const [selectedCanchas, setSelectedCanchas] = useState([]);
    const [selectedHorarios, setSelectedHorarios] = useState([]);
    const [selectedDias, setSelectedDias] = useState([]);
    const [selectedAlumnoId, setSelectedAlumnoId] = useState(null);

    // Opciones dinámicas para desplegables con filtrado inteligente bidireccional
    const canchasDisponibles = useMemo(() => {
        return filtrarGruposPorEntrenadores(canchas, selectedEntrenadores);
    }, [canchas, selectedEntrenadores]);

    const entrenadoresDisponibles = useMemo(() => {
        return filtrarEntrenadoresPorGrupos(entrenadores, selectedCanchas);
    }, [entrenadores, selectedCanchas]);

    // Manejadores con saneamiento automático de selecciones incompatibles
    const handleEntrenadoresChange = useCallback((nuevosEntrenadores) => {
        setSelectedEntrenadores(nuevosEntrenadores);

        if (nuevosEntrenadores && nuevosEntrenadores.length > 0) {
            const gruposPermitidos = filtrarGruposPorEntrenadores(canchas, nuevosEntrenadores);
            setSelectedCanchas(prevCanchas => sanearSeleccionIncompatible(prevCanchas, gruposPermitidos));
        }
    }, [canchas]);

    const handleCanchasChange = useCallback((nuevasCanchas) => {
        setSelectedCanchas(nuevasCanchas);

        if (nuevasCanchas && nuevasCanchas.length > 0) {
            const entrenadoresPermitidos = filtrarEntrenadoresPorGrupos(entrenadores, nuevasCanchas);
            setSelectedEntrenadores(prevEntrenadores => sanearSeleccionIncompatible(prevEntrenadores, entrenadoresPermitidos));
        }
    }, [entrenadores]);

    // Debounce único de 300 ms conforme a las directrices de rendimiento
    const debouncedEntrenadores = useDebounce(selectedEntrenadores, 300);
    const debouncedCanchas = useDebounce(selectedCanchas, 300);
    const debouncedHorarios = useDebounce(selectedHorarios, 300);
    const debouncedDias = useDebounce(selectedDias, 300);

    // Cálculo del rango de fechas local
    const dateRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateRangeOption) {
            case 'hoy':
                return { start: today, end: today };
            case 'ayer': {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return { start: yesterday, end: yesterday };
            }
            case 'esta_semana': {
                const dayOfWeek = today.getDay();
                const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(today);
                monday.setDate(today.getDate() - daysToMonday);
                return { start: monday, end: today };
            }
            case 'semana_anterior': {
                const dayOfWeek = today.getDay();
                const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const lastMonday = new Date(today);
                lastMonday.setDate(today.getDate() - daysToLastMonday - 7);
                const lastSunday = new Date(lastMonday);
                lastSunday.setDate(lastMonday.getDate() + 6);
                return { start: lastMonday, end: lastSunday };
            }
            case 'mes_anterior': {
                const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                return { start: firstDayPrevMonth, end: lastDayPrevMonth };
            }
            case 'este_mes': {
                const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return { start: firstDayThisMonth, end: today };
            }
            default:
                return { start: today, end: today };
        }
    }, [dateRangeOption]);

    const toLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fechaDesde = toLocalDateString(dateRange.start);
    const fechaHasta = toLocalDateString(dateRange.end);

    const estadisticasQueryKey = useMemo(() => [
        'estadisticas',
        'resumen',
        {
            userId: user?.id || 'sin-usuario',
            escuelaId: escuelaId || 'sin-escuela',
            sucursalId: catalogosData?.sucursal_efectiva || userProfile?.sucursal_id || 'todas',
            gestionId: selectedGestionId || 'sin-gestion',
            fechaDesde,
            fechaHasta,
            entrenadorIds: debouncedEntrenadores,
            canchaIds: debouncedCanchas,
            horarioIds: debouncedHorarios,
            dias: debouncedDias,
            alumnoId: selectedAlumnoId || 'sin-alumno'
        }
    ], [user?.id, escuelaId, userProfile?.sucursal_id, catalogosData?.sucursal_efectiva, selectedGestionId, fechaDesde, fechaHasta, debouncedEntrenadores, debouncedCanchas, debouncedHorarios, debouncedDias, selectedAlumnoId]);

    const {
        data: estadisticasData,
        isLoading: loadingEstadisticas,
        isFetching: fetchingEstadisticas,
        error: estadisticasError
    } = useQuery({
        queryKey: estadisticasQueryKey,
        queryFn: ({ signal }) => obtenerResumenEstadisticas({
            gestionId: selectedGestionId,
            fechaDesde,
            fechaHasta,
            entrenadorIds: debouncedEntrenadores,
            canchaIds: debouncedCanchas,
            horarioIds: debouncedHorarios,
            dias: debouncedDias,
            alumnoId: selectedAlumnoId
        }, { signal }),
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        enabled: Boolean(user?.id)
    });

    const metrics = useMemo(() => {
        const res = estadisticasData?.resumen;
        return {
            presentes: res?.presentes || 0,
            licencias: res?.licencias || 0,
            ausentes: res?.ausentes || 0,
            total: res?.total_registros || 0,
            porcentaje_asistencia: res?.porcentaje_asistencia || 0,
            total_alumnos_unicos: res?.total_alumnos_unicos || 0
        };
    }, [estadisticasData?.resumen]);

    const tableData = useMemo(() => {
        const serie = estadisticasData?.serie_diaria || [];
        return serie
            .slice()
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .map(item => {
                const dateObj = new Date(item.fecha + 'T12:00:00');
                return {
                    ...item,
                    fechaDisplay: dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                    diaDisplay: item.dia_nombre || dateObj.toLocaleDateString('es-ES', { weekday: 'long' })
                };
            });
    }, [estadisticasData?.serie_diaria]);

    const alumnoSeleccionado = estadisticasData?.alumno_seleccionado || null;

    const dateRangeText = useMemo(() => {
        const format = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${format(dateRange.start)} - ${format(dateRange.end)}`;
    }, [dateRange]);

    // Función optimizada para exportar a Excel mediante RPC con filtros aplicados
    const loadDetalleForExport = async () => {
        try {
            const items = [];
            let pagina = 1;
            let totalResultados = 0;

            do {
                const result = await exportarAsistenciasAsisport({
                    gestionId: selectedGestionId,
                    fechaDesde,
                    fechaHasta,
                    entrenadorIds: debouncedEntrenadores,
                    canchaIds: debouncedCanchas,
                    horarioIds: debouncedHorarios,
                    dias: debouncedDias,
                    alumnoId: selectedAlumnoId,
                    page: pagina,
                    limit: 5000
                });
                const pageItems = result.items || [];
                items.push(...pageItems);
                totalResultados = Number(result.total_resultados || 0);
                if (pageItems.length === 0 && items.length < totalResultados) {
                    throw new Error('La paginación de asistencias terminó antes de alcanzar el total informado.');
                }
                pagina += 1;
            } while (items.length < totalResultados);

            return items;
        } catch (error) {
            console.error('Error al exportar asistencias:', error);
            addToast('Error al exportar los datos de asistencia', 'error');
            return [];
        }
    };

    return {
        loading: loadingCatalogos || loadingEstadisticas,
        isFetching: fetchingEstadisticas,
        metrics,
        tableData,
        alumnoSeleccionado,
        dateRangeText,
        gestiones,
        canchas,
        entrenadores,
        horarios,
        canchasDisponibles,
        entrenadoresDisponibles,
        handleEntrenadoresChange,
        handleCanchasChange,
        availableCategorias: [], // Preservar retiro de Categoría

        // Filtros y setters
        selectedGestionId, setSelectedGestionId,
        dateRangeOption, setDateRangeOption,
        selectedEntrenadores, setSelectedEntrenadores,
        selectedCanchas, setSelectedCanchas,
        selectedHorarios, setSelectedHorarios,
        selectedCategorias: [], setSelectedCategorias: () => {},
        selectedDias, setSelectedDias,
        selectedAlumnoId, setSelectedAlumnoId,

        loadDetalleForExport
    };
};
