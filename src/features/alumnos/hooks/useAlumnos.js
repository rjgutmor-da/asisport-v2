import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { listarAlumnosAsisport, archivarAlumno } from '../../../services/alumnos';
import { combinarAlumnos } from '../../../services/combinarAlumnos';
import { getAsistenciasEstaSemana } from '../../../services/asistencias';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCatalogosAsisport, queryKeys } from '../../../hooks/useMasterData';
import {
    filtrarGruposPorEntrenadores,
    filtrarEntrenadoresPorGrupos,
    sanearSeleccionIncompatible
} from '../utils/filtrosCruzados';

/** Clave de sessionStorage donde se persiste el estado de filtros de la lista de alumnos */
const FILTROS_SESSION_KEY = 'asisport_lista_alumnos_filtros';

/**
 * Lee el estado de filtros guardado en sessionStorage.
 */
const leerFiltrosGuardados = () => {
    try {
        const raw = sessionStorage.getItem(FILTROS_SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/**
 * Guarda el estado actual de filtros en sessionStorage.
 */
const guardarFiltros = (estado) => {
    try {
        sessionStorage.setItem(FILTROS_SESSION_KEY, JSON.stringify(estado));
    } catch {
        // Ignorar si sessionStorage no está disponible
    }
};

/**
 * Hook para manejar la lista de alumnos con TanStack Query, paginación y filtrado en servidor.
 */
export const useAlumnos = () => {
    const { addToast } = useToast();
    const { user, role, userProfile, escuelaId } = useAuth();
    const queryClient = useQueryClient();

    // Restaurar filtros previos de sessionStorage
    const filtrosGuardados = leerFiltrosGuardados();

    const [activeFilter, setActiveFilter] = useState(filtrosGuardados?.activeFilter ?? 'todos');
    const [searchTerm, setSearchTerm] = useState(filtrosGuardados?.searchTerm ?? '');
    const [selectedCanchas, setSelectedCanchas] = useState(filtrosGuardados?.selectedCanchas ?? []);
    const [selectedEntrenadores, setSelectedEntrenadores] = useState(filtrosGuardados?.selectedEntrenadores ?? []);
    const [selectedSubs, setSelectedSubs] = useState(filtrosGuardados?.selectedSubs ?? []);
    const [selectedTipos, setSelectedTipos] = useState(filtrosGuardados?.selectedTipos ?? []);
    const [currentPage, setCurrentPage] = useState(filtrosGuardados?.currentPage ?? 1);
    const [viewMode, setViewMode] = useState(filtrosGuardados?.viewMode ?? 'list');
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);
    const [introMessage, setIntroMessage] = useState('Esta es la lista de Convocados:');
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    const itemsPerPage = 30;
    const esEntrenador = role === 'Entrenador' || role === 'Entrenarqueros';

    // Debounce único de 300 ms conforme a las directrices de rendimiento
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const debouncedCanchas = useDebounce(selectedCanchas, 300);
    const debouncedEntrenadores = useDebounce(selectedEntrenadores, 300);
    const debouncedSubs = useDebounce(selectedSubs, 300);
    const debouncedTipos = useDebounce(selectedTipos, 300);

    // Validación de búsqueda con 1 carácter: advertir y no consultar
    const searchToastShownRef = useRef(false);
    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.length === 1 && !searchToastShownRef.current) {
            addToast('Escribe al menos 2 caracteres', 'info');
            searchToastShownRef.current = true;
        } else if (trimmed.length !== 1) {
            searchToastShownRef.current = false;
        }
    }, [searchTerm, addToast]);

    // Término efectivo para consultar: solo si tiene al menos 2 caracteres
    const terminoEfectivo = debouncedSearchTerm.trim().length >= 2 ? debouncedSearchTerm.trim() : '';

    // Catálogos autorizados desde TanStack Query
    const { data: catalogosData } = useCatalogosAsisport(userProfile?.sucursal_id, {
        userId: user?.id,
        escuelaId
    });
    const gestionActivaId = catalogosData?.gestiones?.find(gestion => gestion.es_activa)?.id || null;

    // Persistir filtros en sessionStorage
    useEffect(() => {
        guardarFiltros({
            activeFilter,
            selectedCanchas,
            selectedEntrenadores,
            selectedSubs,
            selectedTipos,
            searchTerm,
            currentPage,
            viewMode,
        });
    }, [activeFilter, selectedCanchas, selectedEntrenadores, selectedSubs, selectedTipos, searchTerm, currentPage, viewMode]);

    // Query principal de alumnos con TanStack Query
    const alumnosQueryKey = useMemo(() => [
        'alumnos',
        'lista',
        {
            userId: user?.id,
            escuelaId: escuelaId || 'sin-escuela',
            userRole: role,
            sucursalId: catalogosData?.sucursal_efectiva || userProfile?.sucursal_id || 'todas',
            gestionId: gestionActivaId || 'sin-gestion',
            activeFilter,
            canchaIds: debouncedCanchas,
            horarioIds: [],
            entrenadorIds: debouncedEntrenadores,
            subAnios: debouncedSubs,
            tipos: debouncedTipos,
            searchTerm: terminoEfectivo,
            page: currentPage,
            limit: itemsPerPage
        }
    ], [
        user?.id,
        escuelaId,
        role,
        userProfile?.sucursal_id,
        catalogosData?.sucursal_efectiva,
        gestionActivaId,
        activeFilter,
        debouncedCanchas,
        debouncedEntrenadores,
        debouncedSubs,
        debouncedTipos,
        terminoEfectivo,
        currentPage,
        itemsPerPage
    ]);

    const {
        data: alumnosData,
        isLoading: loading,
        isFetching,
        error: alumnosError
    } = useQuery({
        queryKey: alumnosQueryKey,
        queryFn: ({ signal }) => listarAlumnosAsisport({
            page: currentPage,
            limit: itemsPerPage,
            activeFilter,
            searchTerm: terminoEfectivo,
            canchaIds: debouncedCanchas,
            entrenadorIds: debouncedEntrenadores,
            subAnios: debouncedSubs,
            tipos: debouncedTipos,
            sucursalId: userProfile?.sucursal_id
        }, { signal }),
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
        enabled: Boolean(user?.id) && searchTerm.trim().length !== 1
    });

    useEffect(() => {
        if (alumnosError) {
            addToast(alumnosError.message || 'Error al cargar alumnos', 'error');
        }
    }, [alumnosError, addToast]);

    const alumnos = useMemo(() => alumnosData?.items || [], [alumnosData?.items]);
    const totalCount = alumnosData?.total_resultados || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    // Cargar historial de asistencia semanal para los alumnos de la página actual
    useEffect(() => {
        if (alumnos.length > 0) {
            const alumnoIds = alumnos.map(a => a.id);
            getAsistenciasEstaSemana(alumnoIds)
                .then(history => setAsistenciaHistory(prev => ({ ...prev, ...history })))
                .catch(err => console.error('Error al cargar historial de asistencias:', err));
        }
    }, [alumnos]);

    // Opciones maestras construidas desde los catálogos y facetas del servidor
    const dynamicOptions = useMemo(() => {
        const canchasOpts = (catalogosData?.canchas || []).map(c => ({
            value: c.id,
            label: c.label || `${c.nombre} (${c.total_alumnos ?? 0})`,
            nombre: c.nombre,
            total_alumnos: c.total_alumnos ?? 0,
            entrenador_ids: c.entrenador_ids || []
        }));
        const entrenadoresOpts = (catalogosData?.entrenadores || []).map(e => ({
            value: e.id,
            label: `${e.nombres} ${e.apellidos}`,
            grupo_ids: e.grupo_ids || []
        }));
        const subsOpts = (alumnosData?.facetas?.subs || []).map(sub => ({ value: sub, label: `Sub ${sub}` }));
        const tiposOpts = (alumnosData?.facetas?.tipos || []).map(t => ({ value: t, label: t }));

        return {
            canchas: canchasOpts,
            entrenadores: entrenadoresOpts,
            subs: subsOpts,
            tipos: tiposOpts
        };
    }, [catalogosData, alumnosData?.facetas]);

    // Opciones dinámicas para desplegables con filtrado inteligente bidireccional
    const canchasDisponibles = useMemo(() => {
        return filtrarGruposPorEntrenadores(dynamicOptions.canchas, selectedEntrenadores);
    }, [dynamicOptions.canchas, selectedEntrenadores]);

    const entrenadoresDisponibles = useMemo(() => {
        return filtrarEntrenadoresPorGrupos(dynamicOptions.entrenadores, selectedCanchas);
    }, [dynamicOptions.entrenadores, selectedCanchas]);

    // Manejadores con saneamiento automático de selecciones incompatibles
    const handleEntrenadoresChange = useCallback((nuevosEntrenadores) => {
        setSelectedEntrenadores(nuevosEntrenadores);
        setCurrentPage(1);

        if (nuevosEntrenadores && nuevosEntrenadores.length > 0) {
            const gruposPermitidos = filtrarGruposPorEntrenadores(dynamicOptions.canchas, nuevosEntrenadores);
            setSelectedCanchas(prevCanchas => sanearSeleccionIncompatible(prevCanchas, gruposPermitidos));
        }
    }, [dynamicOptions.canchas]);

    const handleCanchasChange = useCallback((nuevasCanchas) => {
        setSelectedCanchas(nuevasCanchas);
        setCurrentPage(1);

        if (nuevasCanchas && nuevasCanchas.length > 0) {
            const entrenadoresPermitidos = filtrarEntrenadoresPorGrupos(dynamicOptions.entrenadores, nuevasCanchas);
            setSelectedEntrenadores(prevEntrenadores => sanearSeleccionIncompatible(prevEntrenadores, entrenadoresPermitidos));
        }
    }, [dynamicOptions.entrenadores]);

    // Saneamiento de selecciones incompatibles provenientes de sessionStorage o cambios de catálogo
    useEffect(() => {
        if (!catalogosData) return;

        if (selectedEntrenadores.length > 0) {
            const gruposPermitidos = filtrarGruposPorEntrenadores(dynamicOptions.canchas, selectedEntrenadores);
            setSelectedCanchas(prev => {
                const saneados = sanearSeleccionIncompatible(prev, gruposPermitidos);
                return saneados.length === prev.length ? prev : saneados;
            });
        }

        if (selectedCanchas.length > 0) {
            const entrenadoresPermitidos = filtrarEntrenadoresPorGrupos(dynamicOptions.entrenadores, selectedCanchas);
            setSelectedEntrenadores(prev => {
                const saneados = sanearSeleccionIncompatible(prev, entrenadoresPermitidos);
                return saneados.length === prev.length ? prev : saneados;
            });
        }
    }, [catalogosData, dynamicOptions.canchas, dynamicOptions.entrenadores, selectedEntrenadores, selectedCanchas]);

    // Lista simplificada para el modal de combinar
    const allAlumnos = useMemo(() => {
        return alumnos.map(a => ({ id: a.id, nombres: a.nombres, apellidos: a.apellidos }));
    }, [alumnos]);

    const getAsistenciaResumen = useCallback((alumnoId) => {
        const history = asistenciaHistory[alumnoId] || {};
        return Object.values(history).filter(estado => estado === 'Presente' || estado === 'Licencia').length;
    }, [asistenciaHistory]);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Al limpiar únicamente el texto, mantener intactos los demás filtros
    const handleClearSearchOnly = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setActiveFilter('todos');
        setSelectedCanchas([]);
        setSelectedEntrenadores([]);
        setSelectedSubs([]);
        setSelectedTipos([]);
        setSearchTerm('');
        setCurrentPage(1);
        setSelectedAlumnos([]);
        try { sessionStorage.removeItem(FILTROS_SESSION_KEY); } catch {}
    };

    const toggleAlumnoSelection = (id) => {
        const history = asistenciaHistory[id] || {};
        const asistencias = Object.values(history).filter(estado => estado === 'Presente' || estado === 'Licencia').length;

        setSelectedAlumnos(prev => {
            const isSelected = prev.includes(id);
            if (!isSelected && asistencias < 2) {
                addToast('El alumno debe tener al menos 2 asistencias para ser convocado.', 'warning');
                return prev;
            }
            return isSelected ? prev.filter(item => item !== id) : [...prev, id];
        });
    };

    const handleSelectAll = (currentPageAlumnos) => {
        const pageIds = currentPageAlumnos.filter(a => {
            const history = asistenciaHistory[a.id] || {};
            const asistencias = Object.values(history).filter(estado => estado === 'Presente' || estado === 'Licencia').length;
            return asistencias >= 2;
        }).map(a => a.id);

        const allSelected = pageIds.length > 0 && pageIds.every(id => selectedAlumnos.includes(id));
        if (allSelected) {
            setSelectedAlumnos(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedAlumnos(prev => [...new Set([...prev, ...pageIds])]);
        }
    };

    const sendBulkWhatsApp = () => {
        if (selectedAlumnos.length === 0) return;

        const mapaAlumnos = new Map();
        alumnos.forEach(a => {
            if (a.id) mapaAlumnos.set(a.id, a);
        });

        const selectedData = selectedAlumnos
            .map(id => mapaAlumnos.get(id))
            .filter(Boolean);

        const namesList = selectedData.map((a, index) => `${index + 1}. ${a.nombres} ${a.apellidos}`).join('\n');
        const message = encodeURIComponent(`${introMessage}\n\n${namesList}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const handleArchivarAlumno = async (alumnoId) => {
        try {
            await archivarAlumno(alumnoId);
            addToast('Alumno archivado correctamente', 'success');
            queryClient.invalidateQueries({ queryKey: queryKeys.alumnosFamilia });
            return true;
        } catch (error) {
            addToast(error.message || 'Error al archivar alumno', 'error');
            return false;
        }
    };

    const handleCombinarAlumnos = async (destinoId, origenId) => {
        try {
            await combinarAlumnos(destinoId, origenId);
            addToast('Alumnos combinados correctamente', 'success');
            queryClient.invalidateQueries({ queryKey: queryKeys.alumnosFamilia });
            return true;
        } catch (error) {
            addToast(error.message || 'Error al combinar alumnos', 'error');
            throw error;
        }
    };

    const hayFiltrosActivos = activeFilter !== 'todos' || selectedCanchas.length > 0 || selectedEntrenadores.length > 0 || selectedSubs.length > 0 || selectedTipos.length > 0 || searchTerm;

    return {
        loading,
        isFetching,
        alumnos,
        todosLosAlumnosFiltrados: alumnos,
        allAlumnos,
        totalAlumnos: totalCount,
        totalPages,
        currentPage,
        asistenciaHistory,
        esEntrenador,
        viewMode,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        hayFiltrosActivos,
        filtrosMaestros: {
            ...dynamicOptions,
            canchasDisponibles,
            entrenadoresDisponibles,
            selectedCanchas,
            selectedEntrenadores,
            selectedSubs,
            selectedTipos,
        },
        setViewMode,
        setCurrentPage,
        setSelectedCanchas: handleCanchasChange,
        setSelectedEntrenadores: handleEntrenadoresChange,
        setSelectedSubs: (val) => { setSelectedSubs(val); setCurrentPage(1); },
        setSelectedTipos: (val) => { setSelectedTipos(val); setCurrentPage(1); },
        getAsistenciaResumen,
        handleFilterChange,
        handleSearchChange,
        handleClearSearchOnly,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        sendBulkWhatsApp,
        handleArchivarAlumno,
        handleCombinarAlumnos,
        introMessage,
        setIntroMessage
    };
};
