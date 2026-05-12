import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { getAlumnos, getAlumnosPaginados, getAlumnosFacets, archivarAlumno } from '../../../services/alumnos';
import { combinarAlumnos } from '../../../services/combinarAlumnos';
import { getCanchasParaEntrenador, getHorariosParaEntrenador, getEntrenadores } from '../../../services/maestros';
import { getAsistenciasUltimos7Dias } from '../../../services/asistencias';
import { useDebounce } from '../../../hooks/useDebounce';

/** Clave de sessionStorage donde se persiste el estado de filtros de la lista de alumnos */
const FILTROS_SESSION_KEY = 'asisport_lista_alumnos_filtros';

/**
 * Lee el estado de filtros guardado en sessionStorage.
 * Si no existe o está corrompido, devuelve los valores por defecto.
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
        // sessionStorage no disponible — ignorar silenciosamente
    }
};

/**
 * Hook para manejar la lógica de la lista de alumnos optimizada con Server-side Filtering.
 */
export const useAlumnos = () => {
    const { addToast } = useToast();
    const { user, role, isAdmin } = useAuth();

    // Restaurar filtros guardados en sessionStorage (si existen)
    const filtrosGuardados = leerFiltrosGuardados();

    const [alumnos, setAlumnos] = useState([]); // Alumnos de la página actual
    const [facetData, setFacetData] = useState([]); // Data ligera para Smart Filters
    const [allAlumnos, setAllAlumnos] = useState([]); // Lista completa (solo nombres/ids) para combinar
    // loading = skeleton completo (solo si nunca hemos mostrado datos)
    // isFetching = recarga silenciosa en segundo plano (no borra la pantalla)
    const [loading, setLoading] = useState(!filtrosGuardados); // false si ya había estado guardado
    const [isFetching, setIsFetching] = useState(false);
    const [activeFilter, setActiveFilter] = useState(filtrosGuardados?.activeFilter ?? 'todos');
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    // Opciones maestros
    const [maestros, setMaestros] = useState({ canchas: [], horarios: [], entrenadores: [], subs: [] });

    // Filtros seleccionados — restaurados desde sessionStorage si existen
    const [selectedCanchas, setSelectedCanchas] = useState(filtrosGuardados?.selectedCanchas ?? []);
    const [selectedHorarios, setSelectedHorarios] = useState(filtrosGuardados?.selectedHorarios ?? []);
    const [selectedEntrenadores, setSelectedEntrenadores] = useState(filtrosGuardados?.selectedEntrenadores ?? []);
    const [selectedSubs, setSelectedSubs] = useState(filtrosGuardados?.selectedSubs ?? []);

    // --- DEBOUNCE DE FILTROS (600ms) ---
    const debouncedCanchas = useDebounce(selectedCanchas, 600);
    const debouncedHorarios = useDebounce(selectedHorarios, 600);
    const debouncedEntrenadores = useDebounce(selectedEntrenadores, 600);
    const debouncedSubs = useDebounce(selectedSubs, 600);

    // Búsqueda con Debounce — restaurada desde sessionStorage si existe
    const [searchTerm, setSearchTerm] = useState(filtrosGuardados?.searchTerm ?? '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Paginación en servidor — restaurada desde sessionStorage si existe
    const [currentPage, setCurrentPage] = useState(filtrosGuardados?.currentPage ?? 1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 20;

    const [viewMode, setViewMode] = useState(filtrosGuardados?.viewMode ?? 'list');
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);
    const [introMessage, setIntroMessage] = useState('¡Hola! Compartimos la lista de convocados para el partido del fin de semana:');

    const esEntrenador = role === 'Entrenador' || role === 'Entrenarqueros';

    // Persistir filtros en sessionStorage cada vez que cambian
    useEffect(() => {
        guardarFiltros({
            activeFilter,
            selectedCanchas,
            selectedHorarios,
            selectedEntrenadores,
            selectedSubs,
            searchTerm,
            currentPage,
            viewMode,
        });
    }, [activeFilter, selectedCanchas, selectedHorarios, selectedEntrenadores, selectedSubs, searchTerm, currentPage, viewMode]);

    // 1. Cargar maestros y data de facets una sola vez al inicio
    const loadInitialMetadata = useCallback(async () => {
        try {
            const [canchasData, horariosData, entrenadoresData, facets] = await Promise.all([
                getCanchasParaEntrenador(user?.id, role),
                getHorariosParaEntrenador(user?.id, role),
                isAdmin ? getEntrenadores() : Promise.resolve([]),
                getAlumnosFacets({ userId: user?.id, userRole: role })
            ]);

            setFacetData(facets);

            const subsUnicas = [...new Set(facets.map(a => a.sub))].sort((a, b) => a - b);
            setMaestros({
                canchas: canchasData.map(c => ({ value: c.id, label: c.nombre })),
                horarios: horariosData.map(h => ({ value: h.id, label: h.hora })),
                entrenadores: entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })),
                subs: subsUnicas.map(sub => ({ value: sub, label: `Sub ${sub}` }))
            });

            // Opcional: Cargar lista simple para combinar
            setAllAlumnos(facets.map(f => ({ id: f.id, nombres: f.nombres, apellidos: f.apellidos })));

        } catch (error) {
            console.error('Error cargando metadatos:', error);
        }
    }, [user, role, isAdmin]);

    useEffect(() => {
        if (user) loadInitialMetadata();
    }, [user, loadInitialMetadata]);

    // Ref para saber si es la primera carga (nunca hubo datos en pantalla)
    const primeraVezRef = useRef(!filtrosGuardados);

    // 2. Cargar página de alumnos cuando cambian filtros o página
    const fetchPage = useCallback(async () => {
        // Si es la primera carga sin datos previos → skeleton completo
        // Si ya hay datos visibles → recarga silenciosa (sin borrar la pantalla)
        if (primeraVezRef.current) {
            setLoading(true);
        } else {
            setIsFetching(true);
        }
        try {
            const { alumnos: data, totalCount: count } = await getAlumnosPaginados({
                userId: user?.id,
                userRole: role,
                canchaIds: debouncedCanchas,
                horarioIds: debouncedHorarios,
                subAnios: debouncedSubs,
                entrenadorIds: debouncedEntrenadores,
                searchTerm: debouncedSearchTerm,
                activeFilter,
                page: currentPage,
                limit: itemsPerPage
            });

            setAlumnos(data);
            setTotalCount(count);
            primeraVezRef.current = false; // Ya mostramos datos al menos una vez

            // Cargar historial de asistencia para los de la página
            if (data.length > 0) {
                getAsistenciasUltimos7Dias(data.map(a => a.id))
                    .then(history => setAsistenciaHistory(prev => ({ ...prev, ...history })))
                    .catch(err => console.error('Error asistencias:', err));
            }
        } catch (error) {
            addToast('Error al cargar alumnos', 'error');
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [user, role, debouncedCanchas, debouncedHorarios, debouncedSubs, debouncedEntrenadores, debouncedSearchTerm, activeFilter, currentPage, addToast]);

    useEffect(() => {
        if (user) fetchPage();
    }, [user, fetchPage]);

    // 3. Lógica de Smart Filters bidireccionales (en memoria sobre facetData)
    // Solo muestra opciones que tienen resultados válidos dado el contexto actual.
    // Comportamiento igual a FiltrosCxc de SaaSport: oculta en lugar de tachar.
    const dynamicOptions = useMemo(() => {
        const getFilteredFacets = (excludeFilter) => {
            let temp = facetData;

            // Filtro por estado
            if (activeFilter === 'pendientes') temp = temp.filter(a => a.estado === 'Pendiente');
            else if (activeFilter === 'arqueros') temp = temp.filter(a => a.es_arquero === true);

            // Filtros cruzados — se excluye el propio filtro para calcular sus opciones disponibles
            if (excludeFilter !== 'entrenador' && debouncedEntrenadores.length > 0)
                temp = temp.filter(a => debouncedEntrenadores.includes(a.profesor_asignado_id));
            if (excludeFilter !== 'sub' && debouncedSubs.length > 0)
                temp = temp.filter(a => debouncedSubs.includes(a.sub));
            if (excludeFilter !== 'horario' && debouncedHorarios.length > 0)
                temp = temp.filter(a => debouncedHorarios.includes(a.horario_id));
            if (excludeFilter !== 'cancha' && debouncedCanchas.length > 0)
                temp = temp.filter(a => debouncedCanchas.includes(a.cancha_id));
            return temp;
        };

        const validEntrenadoresIds = new Set(getFilteredFacets('entrenador').map(a => a.profesor_asignado_id));
        const validSubsValues     = new Set(getFilteredFacets('sub').map(a => a.sub));
        const validHorariosIds    = new Set(getFilteredFacets('horario').map(a => a.horario_id));
        const validCanchasIds     = new Set(getFilteredFacets('cancha').map(a => a.cancha_id));

        // Solo retorna las opciones que tienen resultados — sin mostrar opciones tachadas
        return {
            entrenadores: maestros.entrenadores.filter(opt => validEntrenadoresIds.has(opt.value)),
            subs:         maestros.subs.filter(opt => validSubsValues.has(opt.value)),
            horarios:     maestros.horarios.filter(opt => validHorariosIds.has(opt.value)),
            canchas:      maestros.canchas.filter(opt => validCanchasIds.has(opt.value)),
        };
    }, [facetData, maestros, activeFilter, debouncedEntrenadores, debouncedSubs, debouncedHorarios, debouncedCanchas]);

    // 4. Auto-deselección: si un valor seleccionado ya no aparece en las opciones
    //    válidas (por un filtro cruzado), se limpia automáticamente.
    //    Se usa un ref de IDs anteriores para evitar bucles de actualización.
    const prevValidIdsRef = useRef({ canchas: '', horarios: '', entrenadores: '', subs: '' });

    useEffect(() => {
        const toKey = (arr) => arr.map(o => String(o.value)).sort().join(',');
        const newKeys = {
            canchas:      toKey(dynamicOptions.canchas),
            horarios:     toKey(dynamicOptions.horarios),
            entrenadores: toKey(dynamicOptions.entrenadores),
            subs:         toKey(dynamicOptions.subs),
        };
        const prev = prevValidIdsRef.current;

        if (newKeys.canchas !== prev.canchas) {
            const validSet = new Set(dynamicOptions.canchas.map(o => o.value));
            setSelectedCanchas(p => p.filter(id => validSet.has(id)));
        }
        if (newKeys.horarios !== prev.horarios) {
            const validSet = new Set(dynamicOptions.horarios.map(o => o.value));
            setSelectedHorarios(p => p.filter(id => validSet.has(id)));
        }
        if (newKeys.entrenadores !== prev.entrenadores) {
            const validSet = new Set(dynamicOptions.entrenadores.map(o => o.value));
            setSelectedEntrenadores(p => p.filter(id => validSet.has(id)));
        }
        if (newKeys.subs !== prev.subs) {
            const validSet = new Set(dynamicOptions.subs.map(o => o.value));
            setSelectedSubs(p => p.filter(v => validSet.has(v)));
        }

        prevValidIdsRef.current = newKeys;
    }, [dynamicOptions]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // =========================================================================
    // Handlers y Auxiliares
    // =========================================================================

    const getAsistenciaResumen = (alumnoId) => {
        const history = asistenciaHistory[alumnoId] || {};
        return Object.values(history).filter(estado => estado === 'Presente' || estado === 'Licencia').length;
    };

    const handleFilterChange = (filter) => { setActiveFilter(filter); setCurrentPage(1); };
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

    const handleClearFilters = () => {
        setActiveFilter('todos');
        setSelectedCanchas([]);
        setSelectedHorarios([]);
        setSelectedEntrenadores([]);
        setSelectedSubs([]);
        setSearchTerm('');
        setCurrentPage(1);
        setSelectedAlumnos([]);
        // Limpiar también los filtros guardados en sessionStorage
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
        const selectedData = alumnos.filter(a => selectedAlumnos.includes(a.id));
        const namesList = selectedData.map((a, index) => `${index + 1}. ${a.nombres}`).join('\n');
        const message = encodeURIComponent(`${introMessage}\n\n${namesList}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const aprobarTodos = async () => {
        const pendientes = facetData.filter(a => a.estado === 'Pendiente');
        if (pendientes.length === 0) return;
        try {
            const { supabase: sb } = await import('../../../lib/supabaseClient');
            const { error } = await sb.from('alumnos').update({ estado: 'Aprobado' }).in('id', pendientes.map(a => a.id));
            if (error) throw error;
            addToast(`${pendientes.length} alumnos aprobados correctamente`, 'success');
            fetchPage();
            return true;
        } catch (error) {
            addToast('Error al aprobar alumnos', 'error');
            return false;
        }
    };

    const handleArchivarAlumno = async (alumnoId) => {
        try {
            await archivarAlumno(alumnoId);
            addToast('Alumno archivado correctamente', 'success');
            fetchPage();
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
            fetchPage();
            return true;
        } catch (error) {
            addToast(error.message || 'Error al combinar alumnos', 'error');
            throw error;
        }
    };

    const hayFiltrosActivos = activeFilter !== 'todos' || selectedCanchas.length > 0 || selectedHorarios.length > 0 || selectedEntrenadores.length > 0 || selectedSubs.length > 0 || searchTerm;

    return {
        loading,
        isFetching,
        alumnos,
        todosLosAlumnosFiltrados: alumnos, // Alias para exportaciones (página actual)
        allAlumnos, // Para el modal de combinar
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
            selectedCanchas,
            selectedHorarios,
            selectedEntrenadores,
            selectedSubs,
        },
        setViewMode,
        setCurrentPage,
        setSelectedCanchas: (val) => { setSelectedCanchas(val); setCurrentPage(1); },
        setSelectedHorarios: (val) => { setSelectedHorarios(val); setCurrentPage(1); },
        setSelectedEntrenadores: (val) => { setSelectedEntrenadores(val); setCurrentPage(1); },
        setSelectedSubs: (val) => { setSelectedSubs(val); setCurrentPage(1); },
        getAsistenciaResumen,
        handleFilterChange,
        handleSearchChange,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        sendBulkWhatsApp,
        aprobarTodos,
        handleArchivarAlumno,
        handleCombinarAlumnos,
        introMessage,
        setIntroMessage
    };
};
