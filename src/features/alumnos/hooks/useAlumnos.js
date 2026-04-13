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

    // Opciones maestras (todas las posibles para esta escuela/rol)
    const [maestros, setMaestros] = useState({
        canchas: [],
        horarios: [],
        entrenadores: [],
        subs: []
    });

    // Filtros seleccionados (arrays para multi-selección)
    const [selectedCanchas, setSelectedCanchas] = useState([]);   // array de IDs
    const [selectedHorarios, setSelectedHorarios] = useState([]); // array de IDs
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]); // array de IDs (ahora multi-selección para ser inteligente)
    const [selectedSubs, setSelectedSubs] = useState([]);          // array de números

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

    // Cargar datos iniciales (Alumnos + Maestros)
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Cargamos todos los alumnos disponibles para este usuario/rol de una vez
            // para poder filtrar "de ida y vuelta" eficientemente en memoria.
            const [alumnsData, canchasData, horariosData, entrenadoresData] = await Promise.all([
                getAlumnos({ userId: user?.id, userRole: role }), // Traer todos los activos
                getCanchasParaEntrenador(user?.id, role),
                getHorariosParaEntrenador(user?.id, role),
                isAdmin ? getEntrenadores() : Promise.resolve([])
            ]);

            setAlumnos(alumnsData);
            setAllAlumnos(alumnsData);

            // Calcular Subs únicas a partir de los alumnos cargados
            const anoActual = 2026;
            const subsUnicas = [...new Set(
                alumnsData.map(a => anoActual - new Date(a.fecha_nacimiento).getUTCFullYear())
            )].sort((a, b) => a - b);

            setMaestros({
                canchas: canchasData.map(c => ({ value: c.id, label: c.nombre })),
                horarios: horariosData.map(h => ({ value: h.id, label: h.hora })),
                entrenadores: entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })),
                subs: subsUnicas.map(sub => ({ value: sub, label: `Sub ${sub}` }))
            });

            // Cargar historial de asistencia
            if (alumnsData.length > 0) {
                getAsistenciasUltimos7Dias(alumnsData.map(a => a.id))
                    .then(history => setAsistenciaHistory(history))
                    .catch(err => console.error('Error cargando historial de asistencias:', err));
            }

        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, user, role, isAdmin]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [loadData, user]);

    // =========================================================================
    // LÓGICA DE FILTRADO INTELIGENTE (CROSS-FILTERING)
    // =========================================================================
    
    // 1. Filtrar alumnos según todas las selecciones
    const filteredAndSortedAlumnos = useMemo(() => {
        let filtered = alumnos;

        // Búsqueda inteligente por nombre o teléfono
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            const searchDigits = search.replace(/\D/g, ''); // Solo números para búsqueda tel

            filtered = filtered.filter(a => {
                const nombres = a.nombres || '';
                const apellidos = a.apellidos || '';
                const matchNombre = `${nombres} ${apellidos}`.toLowerCase().includes(search);
                
                // Si la búsqueda tiene números, intentamos match por teléfono de forma limpia
                let matchTel = false;
                if (searchDigits.length >= 3) {
                    const telPadreClean = a.telefono_padre ? String(a.telefono_padre).replace(/\D/g, '') : '';
                    const telMadreClean = a.telefono_madre ? String(a.telefono_madre).replace(/\D/g, '') : '';
                    const telDeportistaClean = a.telefono_deportista ? String(a.telefono_deportista).replace(/\D/g, '') : '';
                    matchTel = telPadreClean.includes(searchDigits) || 
                               telMadreClean.includes(searchDigits) || 
                               telDeportistaClean.includes(searchDigits);
                }

                return matchNombre || matchTel;
            });
        }

        // Filtro por estado/tipo
        if (activeFilter === 'pendientes') {
            filtered = filtered.filter(a => a.estado === 'Pendiente');
        } else if (activeFilter === 'arqueros') {
            filtered = filtered.filter(a => a.es_arquero === true);
        }

        // Filtros Maestros
        if (selectedEntrenadores.length > 0) {
            filtered = filtered.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
        }
        if (selectedSubs.length > 0) {
            const anoActual = 2026;
            filtered = filtered.filter(a => {
                const sub = anoActual - new Date(a.fecha_nacimiento).getUTCFullYear();
                return selectedSubs.includes(sub);
            });
        }
        if (selectedHorarios.length > 0) {
            filtered = filtered.filter(a => selectedHorarios.includes(a.horario_id));
        }
        if (selectedCanchas.length > 0) {
            filtered = filtered.filter(a => selectedCanchas.includes(a.cancha_id));
        }

        // Ordenamiento
        return [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [alumnos, searchTerm, activeFilter, selectedEntrenadores, selectedSubs, selectedHorarios, selectedCanchas]);

    // 2. Calcular opciones DISPONIBLES para cada filtro (la magia del "ida y vuelta")
    const dynamicOptions = useMemo(() => {
        const anoActual = 2026;

        // Función para filtrar alumnos excluyendo UN filtro específico
        const getAlumnosFilteredByOthers = (excludeFilter) => {
            let temp = alumnos;
            
            // Siempre aplicar búsqueda y estado
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase();
                const searchDigits = search.replace(/\D/g, '');

                temp = temp.filter(a => {
                    const nombres = a.nombres || '';
                    const apellidos = a.apellidos || '';
                    const matchNombre = `${nombres} ${apellidos}`.toLowerCase().includes(search);
                    
                    let matchTel = false;
                    if (searchDigits.length >= 3) {
                        const telPadreClean = a.telefono_padre ? String(a.telefono_padre).replace(/\D/g, '') : '';
                        const telMadreClean = a.telefono_madre ? String(a.telefono_madre).replace(/\D/g, '') : '';
                        const telDeportistaClean = a.telefono_deportista ? String(a.telefono_deportista).replace(/\D/g, '') : '';
                        matchTel = telPadreClean.includes(searchDigits) || 
                                   telMadreClean.includes(searchDigits) || 
                                   telDeportistaClean.includes(searchDigits);
                    }

                    return matchNombre || matchTel;
                });
            }
            if (activeFilter === 'pendientes') temp = temp.filter(a => a.estado === 'Pendiente');
            if (activeFilter === 'arqueros') temp = temp.filter(a => a.es_arquero === true);

            // Filtros cruzados
            if (excludeFilter !== 'entrenador' && selectedEntrenadores.length > 0) {
                temp = temp.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
            }
            if (excludeFilter !== 'sub' && selectedSubs.length > 0) {
                temp = temp.filter(a => {
                    const sub = anoActual - new Date(a.fecha_nacimiento).getUTCFullYear();
                    return selectedSubs.includes(sub);
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
        const filteredForSub = getAlumnosFilteredByOthers('sub');
        const filteredForHorario = getAlumnosFilteredByOthers('horario');
        const filteredForCancha = getAlumnosFilteredByOthers('cancha');

        // Extraer valores únicos presentes en esos conjuntos
        const validEntrenadoresIds = new Set(filteredForEntrenador.map(a => a.profesor_asignado_id));
        const validSubsValues = new Set(filteredForSub.map(a => anoActual - new Date(a.fecha_nacimiento).getUTCFullYear()));
        const validHorariosIds = new Set(filteredForHorario.map(a => a.horario_id));
        const validCanchasIds = new Set(filteredForCancha.map(a => a.cancha_id));

        return {
            entrenadores: maestros.entrenadores.map(opt => ({ ...opt, disabled: !validEntrenadoresIds.has(opt.value) })),
            subs: maestros.subs.map(opt => ({ ...opt, disabled: !validSubsValues.has(opt.value) })),
            horarios: maestros.horarios.map(opt => ({ ...opt, disabled: !validHorariosIds.has(opt.value) })),
            canchas: maestros.canchas.map(opt => ({ ...opt, disabled: !validCanchasIds.has(opt.value) }))
        };
    }, [alumnos, maestros, searchTerm, activeFilter, selectedEntrenadores, selectedSubs, selectedHorarios, selectedCanchas]);

    // 3. Paginación sobre el resultado final
    const { paginatedAlumnos, totalPages } = useMemo(() => {
        const total = Math.ceil(filteredAndSortedAlumnos.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        return {
            paginatedAlumnos: filteredAndSortedAlumnos.slice(startIndex, startIndex + itemsPerPage),
            totalPages: total
        };
    }, [filteredAndSortedAlumnos, currentPage, itemsPerPage]);

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
        const pendientes = alumnos.filter(a => a.estado === 'Pendiente');
        if (pendientes.length === 0) return;
        try {
            const { supabase } = await import('../../../lib/supabaseClient');
            const { error } = await supabase.from('alumnos').update({ estado: 'Aprobado' }).in('id', pendientes.map(a => a.id));
            if (error) throw error;
            addToast(`${pendientes.length} alumnos aprobados correctamente`, 'success');
            loadData();
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
            await loadData();
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
            await loadData();
            return true;
        } catch (error) {
            addToast(error.message || 'Error al combinar alumnos', 'error');
            throw error;
        }
    };

    const hayFiltrosActivos = activeFilter !== 'todos' || selectedCanchas.length > 0 || selectedHorarios.length > 0 || selectedEntrenadores.length > 0 || selectedSubs.length > 0 || searchTerm;

    return {
        loading,
        alumnos: paginatedAlumnos,
        todosLosAlumnosFiltrados: filteredAndSortedAlumnos,
        allAlumnos,
        totalAlumnos: filteredAndSortedAlumnos.length,
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
