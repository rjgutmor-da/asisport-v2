import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { getAlumnos } from '../../../services/alumnos';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';
import { getAsistenciasUltimos7Dias } from '../../../services/asistencias';

/**
 * Hook para manejar la lógica de la lista de alumnos
 */
export const useAlumnos = () => {
    const { addToast } = useToast();
    const { user, role } = useAuth();

    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('todos');
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    // Filtros dinámicos
    const [canchas, setCanchas] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);

    const [selectedCancha, setSelectedCancha] = useState('');
    const [selectedHorario, setSelectedHorario] = useState('');
    const [selectedEntrenador, setSelectedEntrenador] = useState('');

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

    // Cargar alumnos y opciones de filtros al montar variable
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [alumnsData, canchasData, horariosData, entrenadorsData] = await Promise.all([
                getAlumnos(),
                getCanchas(),
                getHorarios(),
                getEntrenadores()
            ]);

            setAlumnos(alumnsData);
            setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
            setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
            setEntrenadores(entrenadorsData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })));

            // Cargar historial de asistencia para los alumnos cargados
            if (alumnsData.length > 0) {
                const history = await getAsistenciasUltimos7Dias(alumnsData.map(a => a.id));
                setAsistenciaHistory(history);
            }

        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtrado, búsqueda, ordenamiento y paginación con useMemo
    const { filteredAndSortedAlumnos, paginatedAlumnos, totalPages } = useMemo(() => {
        // 1. Aplicar filtro por estado/tipo y ROL
        let filtered = alumnos;

        // Filtros Automáticos por Rol
        if (role === 'Entrenador' && user?.id) {
            // Entrenador solo ve sus alumnos asignados
            filtered = filtered.filter(a => a.profesor_asignado_id === user.id);
        } else if (role === 'Entrenarqueros') {
            // Entrenador de Arqueros solo ve arqueros
            filtered = filtered.filter(a => a.es_arquero === true);
        }

        switch (activeFilter) {
            case 'pendientes':
                filtered = filtered.filter(a => a.estado === 'Pendiente');
                break;
            case 'arqueros':
                filtered = filtered.filter(a => a.es_arquero === true);
                break;
            default:
                // 'todos' - no extra filter needed
                break;
        }

        // 2. Aplicar filtros dinámicos
        if (selectedEntrenador) {
            filtered = filtered.filter(a =>
                // Si el filtro es por entrenador asignado (nuevo campo) o entrenadores secundarios (si existieran)
                // Por ahora usamos el nuevo campo
                a.profesor_asignado_id === selectedEntrenador
                // O fall back a la lógica antigua si existiera tabla intermedia, pero por ahora profesor_asignado_id es la fuente de verdad
            );
        }

        if (selectedCancha) {
            filtered = filtered.filter(a => a.cancha_id === selectedCancha);
        }

        if (selectedHorario) {
            filtered = filtered.filter(a => a.horario_id === selectedHorario);
        }

        // 3. Aplicar búsqueda por nombre
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(a =>
                `${a.nombres} ${a.apellidos}`.toLowerCase().includes(search)
            );
        }

        // 3. Aplicar ordenamiento interno fijo:
        // Primero Activos (Aprobados) -> Pendientes
        // Luego por fecha de creación (Más antiguo -> Más nuevo)
        const sorted = [...filtered].sort((a, b) => {
            // Prioridad de estado: Aprobado < Pendiente
            if (a.estado === 'Aprobado' && b.estado === 'Pendiente') return -1;
            if (a.estado === 'Pendiente' && b.estado === 'Aprobado') return 1;

            // Si tienen el mismo estado, ordenar por fecha de creación (Oldest first)
            return new Date(a.created_at) - new Date(b.created_at);
        });

        // 4. Calcular paginación
        const total = Math.ceil(sorted.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

        return {
            filteredAndSortedAlumnos: sorted,
            paginatedAlumnos: paginated,
            totalPages: total
        };
    }, [alumnos, activeFilter, selectedCancha, selectedHorario, selectedEntrenador, searchTerm, currentPage, itemsPerPage, role, user]);

    // Handlers
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
        setSelectedCancha('');
        setSelectedHorario('');
        setSelectedEntrenador('');
        setSearchTerm('');
        setCurrentPage(1);
        setSelectedAlumnos([]);
    };

    const toggleAlumnoSelection = (id) => {
        // Encontrar el alumno y verificar su asistencia
        const alumno = alumnos.find(a => a.id === id);
        if (!alumno) return;

        // Calcular asistencia (Presente + Licencia)
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

        // Obtener datos de los alumnos seleccionados en el orden que aparecen en la lista actual
        const selectedData = alumnos.filter(a => selectedAlumnos.includes(a.id));
        const namesList = selectedData.map((a, index) => `${index + 1}. ${a.nombres}`).join('\n');

        const message = encodeURIComponent(`${introMessage}\n\n${namesList}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return {
        // Estado
        loading,
        alumnos: paginatedAlumnos,
        totalAlumnos: filteredAndSortedAlumnos.length,
        totalPages,
        currentPage,
        asistenciaHistory,
        last7Days,

        // Estado de Filtros
        viewMode,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        filtrosMaestros: {
            canchas,
            horarios,
            entrenadores,
            selectedCancha,
            selectedHorario,
            selectedEntrenador
        },

        // Setters (para binding directo)
        setViewMode,
        setCurrentPage,
        setSelectedCancha: (val) => { setSelectedCancha(val); setCurrentPage(1); },
        setSelectedHorario: (val) => { setSelectedHorario(val); setCurrentPage(1); },
        setSelectedEntrenador: (val) => { setSelectedEntrenador(val); setCurrentPage(1); },

        // Handlers
        handleFilterChange,
        handleSearchChange,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        sendBulkWhatsApp,
        introMessage,
        setIntroMessage
    };
};
