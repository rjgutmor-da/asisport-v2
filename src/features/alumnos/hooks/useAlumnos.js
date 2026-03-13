import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { getAlumnos, archivarAlumno } from '../../../services/alumnos';
import { combinarAlumnos } from '../../../services/combinarAlumnos';
import { getCanchasParaEntrenador, getHorariosParaEntrenador, getEntrenadores } from '../../../services/maestros';
import { getAsistenciasUltimos7Dias } from '../../../services/asistencias';

/**
 * Hook para manejar la lógica de la lista de alumnos.
 * Incluye:
 *  - Carga, filtrado, búsqueda y paginación de alumnos
 *  - Selección múltiple y envío de WhatsApp
 *  - Archivar alumno individual con confirmación
 *  - Combinar alumnos duplicados
 *  - Aprobar alumnos pendientes
 *  - Filtros multi-selección: canchas, horarios, sub (inteligentes para entrenadores)
 */
export const useAlumnos = () => {
    const { addToast } = useToast();
    const { user, role, isAdmin } = useAuth();

    const [alumnos, setAlumnos] = useState([]);
    const [allAlumnos, setAllAlumnos] = useState([]); // Lista completa sin filtrar (para el modal de combinar)
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('todos');
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    // Filtros dinámicos (listas de opciones disponibles)
    const [canchas, setCanchas] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [subs, setSubs] = useState([]); // Opciones de Sub derivadas de los alumnos cargados

    // Filtros seleccionados (arrays para multi-selección)
    const [selectedCanchas, setSelectedCanchas] = useState([]);   // array de IDs
    const [selectedHorarios, setSelectedHorarios] = useState([]); // array de IDs
    const [selectedEntrenador, setSelectedEntrenador] = useState(''); // string única (solo para admins)
    const [selectedSubs, setSelectedSubs] = useState([]);          // array de números (año de sub, ej. 14, 15...)

    // Modo de vista y selección
    const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);

    // Búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Mensaje de Convocatoria
    const [introMessage, setIntroMessage] = useState('¡Hola! Compartimos la lista de convocados para el partido del fin de semana:');

    // Saber si es entrenador (no admin)
    const esEntrenador = role === 'Entrenador' || role === 'Entrenarqueros';

    // Generar las fechas de los últimos 7 días
    const last7Days = useMemo(() => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }, []);

    // Cargar alumnos y opciones de filtros al montar o cambiar filtros de cancha/horario
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Pasar filtros como arrays al servicio
            const filtrosServidor = {
                userId: user?.id,
                userRole: role,
                canchaIds: selectedCanchas,
                horarioIds: selectedHorarios,
                subAnios: selectedSubs,
            };

            // Cargar alumnos y listas de filtros inteligentes (según rol)
            const [alumnsData, canchasData, horariosData, entrenadoresData] = await Promise.all([
                getAlumnos(filtrosServidor),
                getCanchasParaEntrenador(user?.id, role),
                getHorariosParaEntrenador(user?.id, role),
                isAdmin ? getEntrenadores() : Promise.resolve([])
            ]);

            setAlumnos(alumnsData);
            setAllAlumnos(alumnsData); // Guardar copia completa para el modal de combinar
            setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
            setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
            setEntrenadores(entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })));

            // Calcular Subs únicas a partir de los alumnos cargados (inteligente por entrenador)
            const anoActual = 2026;
            const subsUnicas = [...new Set(
                alumnsData.map(a => anoActual - new Date(a.fecha_nacimiento).getUTCFullYear())
            )].sort((a, b) => a - b);
            setSubs(subsUnicas.map(sub => ({ value: sub, label: `Sub ${sub}` })));

            // Cargar historial de asistencia solo para los alumnos retornados
            if (alumnsData.length > 0) {
                const history = await getAsistenciasUltimos7Dias(alumnsData.map(a => a.id));
                setAsistenciaHistory(history);
            } else {
                setAsistenciaHistory({});
            }

        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, user, role, isAdmin, selectedCanchas, selectedHorarios, selectedSubs]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [loadData, user]);

    // Filtrado, búsqueda, ordenamiento y paginación con useMemo
    const { filteredAndSortedAlumnos, paginatedAlumnos, totalPages } = useMemo(() => {
        // Nota: El filtrado por rol, cancha, horario y sub ya se hizo en el servidor.
        // Aquí solo quedan: filtros de estado, búsqueda por nombre, y filtro por entrenador (solo admin).
        let filtered = alumnos;

        // Filtro por estado/tipo
        switch (activeFilter) {
            case 'pendientes':
                filtered = filtered.filter(a => a.estado === 'Pendiente');
                break;
            case 'arqueros':
                filtered = filtered.filter(a => a.es_arquero === true);
                break;
            default:
                // 'todos' - sin filtro adicional
                break;
        }

        // Filtro por entrenador (solo para admins, selección única)
        if (selectedEntrenador) {
            filtered = filtered.filter(a =>
                a.profesor_asignado_id === selectedEntrenador
            );
        }

        // Búsqueda por nombre
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(a =>
                `${a.nombres} ${a.apellidos}`.toLowerCase().includes(search)
            );
        }

        // Ordenamiento interno fijo
        const sorted = [...filtered].sort((a, b) => {
            if (a.estado === 'Aprobado' && b.estado === 'Pendiente') return -1;
            if (a.estado === 'Pendiente' && b.estado === 'Aprobado') return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        // Paginación
        const total = Math.ceil(sorted.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

        return {
            filteredAndSortedAlumnos: sorted,
            paginatedAlumnos: paginated,
            totalPages: total
        };
    }, [alumnos, activeFilter, selectedEntrenador, searchTerm, currentPage, itemsPerPage]);

    // =========================================================================
    // Cálculo de asistencia últimos 7 días para un alumno
    // =========================================================================
    const getAsistenciaResumen = (alumnoId) => {
        const history = asistenciaHistory[alumnoId] || {};
        return Object.values(history).filter(estado =>
            estado === 'Presente' || estado === 'Licencia'
        ).length;
    };

    // =========================================================================
    // Handlers
    // =========================================================================

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setActiveFilter('todos');
        setSelectedCanchas([]);
        setSelectedHorarios([]);
        setSelectedEntrenador('');
        setSelectedSubs([]);
        setSearchTerm('');
        setCurrentPage(1);
        setSelectedAlumnos([]);
    };

    const toggleAlumnoSelection = (id) => {
        const alumno = alumnos.find(a => a.id === id);
        if (!alumno) return;

        const history = asistenciaHistory[id] || {};
        const asistencias = Object.values(history).filter(estado =>
            estado === 'Presente' || estado === 'Licencia'
        ).length;

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
            const asistencias = Object.values(history).filter(estado =>
                estado === 'Presente' || estado === 'Licencia'
            ).length;
            return asistencias >= 2;
        }).map(a => a.id);

        const allSelected = pageIds.length > 0 && pageIds.every(id => selectedAlumnos.includes(id));

        if (allSelected) {
            setSelectedAlumnos(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedAlumnos(prev => [...new Set([...prev, ...pageIds])]);
            if (pageIds.length < currentPageAlumnos.length) {
                addToast('Solo se seleccionaron los alumnos con 2 o más asistencias.', 'info');
            }
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
        const pendientes = alumnos.filter(a => a.estado === 'Pendiente');
        if (pendientes.length === 0) return;

        try {
            const { supabase } = await import('../../../lib/supabaseClient');
            const { error } = await supabase
                .from('alumnos')
                .update({ estado: 'Aprobado' })
                .in('id', pendientes.map(a => a.id));

            if (error) throw error;

            addToast(`${pendientes.length} alumnos aprobados correctamente`, 'success');
            loadData(); // Recargar lista
            return true;
        } catch (error) {
            console.error(error);
            addToast('Error al aprobar alumnos', 'error');
            return false;
        }
    };

    // =========================================================================
    // Archivar un alumno individual desde la lista
    // =========================================================================
    const handleArchivarAlumno = async (alumnoId) => {
        try {
            await archivarAlumno(alumnoId);
            addToast('Alumno archivado correctamente', 'success');
            await loadData(); // Recargar la lista para reflejar el cambio
            return true;
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al archivar alumno', 'error');
            return false;
        }
    };

    // =========================================================================
    // Combinar alumnos duplicados
    // =========================================================================
    const handleCombinarAlumnos = async (destinoId, origenId) => {
        try {
            await combinarAlumnos(destinoId, origenId);
            addToast('Alumnos combinados correctamente', 'success');
            await loadData(); // Recargar la lista completa
            return true;
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al combinar alumnos', 'error');
            throw error; // Re-lanzar para que el modal maneje el error
        }
    };

    // =========================================================================
    // Verificar si hay filtros activos (para mostrar botón limpiar)
    // =========================================================================
    const hayFiltrosActivos = activeFilter !== 'todos'
        || selectedCanchas.length > 0
        || selectedHorarios.length > 0
        || selectedEntrenador
        || selectedSubs.length > 0
        || searchTerm;

    return {
        // Estado
        loading,
        alumnos: paginatedAlumnos,
        todosLosAlumnosFiltrados: filteredAndSortedAlumnos,
        allAlumnos, // Lista completa sin filtrar (para el modal de combinar)
        totalAlumnos: filteredAndSortedAlumnos.length,
        totalPages,
        currentPage,
        asistenciaHistory,
        last7Days,
        esEntrenador,

        // Estado de Filtros
        viewMode,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        hayFiltrosActivos,
        filtrosMaestros: {
            canchas,
            horarios,
            entrenadores,
            subs,              // Opciones dinámicas de Sub
            selectedCanchas,
            selectedHorarios,
            selectedEntrenador,
            selectedSubs,
        },

        // Setters (para binding directo)
        setViewMode,
        setCurrentPage,
        setSelectedCanchas: (val) => { setSelectedCanchas(val); setCurrentPage(1); },
        setSelectedHorarios: (val) => { setSelectedHorarios(val); setCurrentPage(1); },
        setSelectedEntrenador: (val) => { setSelectedEntrenador(val); setCurrentPage(1); },
        setSelectedSubs: (val) => { setSelectedSubs(val); setCurrentPage(1); },
        getAsistenciaResumen,

        // Handlers
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
