import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { getAlumnos, getAlumnosPaginados, getAlumnosFacets, archivarAlumno } from '../../../services/alumnos';
import { combinarAlumnos } from '../../../services/combinarAlumnos';
import { getCanchasParaEntrenador, getHorariosParaEntrenador, getEntrenadores } from '../../../services/maestros';
import { getAsistenciasUltimos7Dias } from '../../../services/asistencias';
import { useDebounce } from '../../../hooks/useDebounce';

/**
 * Hook para manejar la lógica de la lista de alumnos optimizada con Server-side Filtering.
 */
export const useAlumnos = () => {
    const { addToast } = useToast();
    const { user, role, isAdmin } = useAuth();

    const [alumnos, setAlumnos] = useState([]); // Alumnos de la página actual
    const [facetData, setFacetData] = useState([]); // Data ligera para Smart Filters
    const [allAlumnos, setAllAlumnos] = useState([]); // Lista completa (solo nombres/ids) para combinar
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('todos');
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    // Opciones maestros
    const [maestros, setMaestros] = useState({ canchas: [], horarios: [], entrenadores: [], subs: [] });

    // Filtros seleccionados
    const [selectedCanchas, setSelectedCanchas] = useState([]);
    const [selectedHorarios, setSelectedHorarios] = useState([]);
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]);
    const [selectedSubs, setSelectedSubs] = useState([]);

    // Búsqueda con Debounce
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Paginación en servidor
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 20;

    const [viewMode, setViewMode] = useState('list');
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);
    const [introMessage, setIntroMessage] = useState('¡Hola! Compartimos la lista de convocados para el partido del fin de semana:');

    const esEntrenador = role === 'Entrenador' || role === 'Entrenarqueros';

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

    // 2. Cargar página de alumnos cuando cambian filtros o página
    const fetchPage = useCallback(async () => {
        setLoading(true);
        try {
            const { alumnos: data, totalCount: count } = await getAlumnosPaginados({
                userId: user?.id,
                userRole: role,
                canchaIds: selectedCanchas,
                horarioIds: selectedHorarios,
                subAnios: selectedSubs,
                entrenadorIds: selectedEntrenadores,
                searchTerm: debouncedSearchTerm,
                activeFilter,
                page: currentPage,
                limit: itemsPerPage
            });

            setAlumnos(data);
            setTotalCount(count);

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
        }
    }, [user, role, selectedCanchas, selectedHorarios, selectedSubs, selectedEntrenadores, debouncedSearchTerm, activeFilter, currentPage, addToast]);

    useEffect(() => {
        if (user) fetchPage();
    }, [user, fetchPage]);

    // 3. Lógica de Smart Filters (en memoria sobre facetData)
    const dynamicOptions = useMemo(() => {
        const getFilteredFacets = (excludeFilter) => {
            let temp = facetData;
            
            // Filtro por estado
            if (activeFilter === 'pendientes') temp = temp.filter(a => a.estado === 'Pendiente');
            else if (activeFilter === 'arqueros') temp = temp.filter(a => a.es_arquero === true);

            // Filtros cruzados
            if (excludeFilter !== 'entrenador' && selectedEntrenadores.length > 0) {
                temp = temp.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
            }
            if (excludeFilter !== 'sub' && selectedSubs.length > 0) {
                temp = temp.filter(a => selectedSubs.includes(a.sub));
            }
            if (excludeFilter !== 'horario' && selectedHorarios.length > 0) {
                temp = temp.filter(a => selectedHorarios.includes(a.horario_id));
            }
            if (excludeFilter !== 'cancha' && selectedCanchas.length > 0) {
                temp = temp.filter(a => selectedCanchas.includes(a.cancha_id));
            }
            return temp;
        };

        const validEntrenadoresIds = new Set(getFilteredFacets('entrenador').map(a => a.profesor_asignado_id));
        const validSubsValues = new Set(getFilteredFacets('sub').map(a => a.sub));
        const validHorariosIds = new Set(getFilteredFacets('horario').map(a => a.horario_id));
        const validCanchasIds = new Set(getFilteredFacets('cancha').map(a => a.cancha_id));

        return {
            entrenadores: maestros.entrenadores.map(opt => ({ ...opt, disabled: !validEntrenadoresIds.has(opt.value) })),
            subs: maestros.subs.map(opt => ({ ...opt, disabled: !validSubsValues.has(opt.value) })),
            horarios: maestros.horarios.map(opt => ({ ...opt, disabled: !validHorariosIds.has(opt.value) })),
            canchas: maestros.canchas.map(opt => ({ ...opt, disabled: !validCanchasIds.has(opt.value) }))
        };
    }, [facetData, maestros, activeFilter, selectedEntrenadores, selectedSubs, selectedHorarios, selectedCanchas]);

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
        alumnos,
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
