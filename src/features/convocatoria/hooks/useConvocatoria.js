import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { listarAlumnosAsisport, obtenerOpcionesFiltrosAlumnosAsisport } from '../../../services/alumnos';
import { getAsistenciasEstaSemana } from '../../../services/asistencias';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCatalogosAsisport } from '../../../hooks/useMasterData';
import { sanearSeleccionIncompatible } from '../../alumnos/utils/filtrosCruzados';
import { generarMensajeWhatsAppConvocatoria } from '../utils/mensajeConvocatoria';

/** Clave de sessionStorage donde se persiste el estado de filtros de convocatoria */
const FILTROS_CONVOCATORIA_KEY = 'asisport_convocatoria_filtros';

/**
 * Lee el estado de filtros guardado en sessionStorage para la pantalla de Convocatoria.
 */
const leerFiltrosGuardados = () => {
    try {
        const raw = sessionStorage.getItem(FILTROS_CONVOCATORIA_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/**
 * Guarda el estado actual de filtros de Convocatoria en sessionStorage.
 */
const guardarFiltros = (estado) => {
    try {
        sessionStorage.setItem(FILTROS_CONVOCATORIA_KEY, JSON.stringify(estado));
    } catch {
        // Ignorar si sessionStorage no está disponible
    }
};

/**
 * Hook para gestionar la selección de jugadores convocados, filtros, alertas
 * de asistencia y envío de mensaje de convocatoria por WhatsApp.
 */
export const useConvocatoria = () => {
    const { addToast } = useToast();
    const { user, role, userProfile, escuelaId } = useAuth();

    const filtrosGuardados = leerFiltrosGuardados();

    const [activeFilter, setActiveFilter] = useState(filtrosGuardados?.activeFilter ?? 'todos');
    const [searchTerm, setSearchTerm] = useState(filtrosGuardados?.searchTerm ?? '');
    const [selectedCanchas, setSelectedCanchas] = useState(filtrosGuardados?.selectedCanchas ?? []);
    const [selectedEntrenadores, setSelectedEntrenadores] = useState(filtrosGuardados?.selectedEntrenadores ?? []);
    const [selectedSubs, setSelectedSubs] = useState(filtrosGuardados?.selectedSubs ?? []);
    const [selectedHorarios, setSelectedHorarios] = useState(filtrosGuardados?.selectedHorarios ?? []);
    const [currentPage, setCurrentPage] = useState(filtrosGuardados?.currentPage ?? 1);

    // IDs seleccionados y diccionario de objetos de alumnos para conservar selección entre páginas
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);
    const [alumnosSeleccionadosMap, setAlumnosSeleccionadosMap] = useState({});
    const [asistenciaHistory, setAsistenciaHistory] = useState({});

    // Datos del encuentro para el mensaje de WhatsApp
    const [datosPartido, setDatosPartido] = useState({
        torneo: '',
        fecha: '',
        hora: '',
        direccion: '',
        encabezado: 'Esta es la lista de Convocados:'
    });

    const itemsPerPage = 30;

    // Debounce de 300 ms para buscador y filtros
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const debouncedCanchas = useDebounce(selectedCanchas, 300);
    const debouncedEntrenadores = useDebounce(selectedEntrenadores, 300);
    const debouncedSubs = useDebounce(selectedSubs, 300);
    const debouncedHorarios = useDebounce(selectedHorarios, 300);

    // Validación de búsqueda con 1 carácter
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

    const terminoEfectivo = debouncedSearchTerm.trim().length >= 2 ? debouncedSearchTerm.trim() : '';

    // Catálogos autorizados
    const { data: catalogosData } = useCatalogosAsisport(userProfile?.sucursal_id, {
        userId: user?.id,
        escuelaId
    });
    const gestionActivaId = catalogosData?.gestiones?.find(gestion => gestion.es_activa)?.id || null;

    // Opciones de filtros cruzados
    const opcionesFiltrosQueryKey = useMemo(() => [
        'alumnos',
        'opciones-filtros',
        user?.id,
        escuelaId || 'sin-escuela',
        role,
        activeFilter
    ], [user?.id, escuelaId, role, activeFilter]);

    const {
        data: opcionesFiltrosData,
        error: opcionesFiltrosError
    } = useQuery({
        queryKey: opcionesFiltrosQueryKey,
        queryFn: ({ signal }) => obtenerOpcionesFiltrosAlumnosAsisport({ activeFilter }, { signal }),
        staleTime: 5 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
        enabled: Boolean(user?.id)
    });

    useEffect(() => {
        if (opcionesFiltrosError) {
            addToast(opcionesFiltrosError.message || 'Error al cargar las opciones de filtros.', 'error');
        }
    }, [opcionesFiltrosError, addToast]);

    // Persistir filtros en sessionStorage
    useEffect(() => {
        guardarFiltros({
            activeFilter,
            selectedCanchas,
            selectedEntrenadores,
            selectedSubs,
            selectedHorarios,
            searchTerm,
            currentPage,
        });
    }, [activeFilter, selectedCanchas, selectedEntrenadores, selectedSubs, selectedHorarios, searchTerm, currentPage]);

    // Consulta paginada de alumnos
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
            horarioIds: debouncedHorarios,
            entrenadorIds: debouncedEntrenadores,
            subAnios: debouncedSubs,
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
        debouncedHorarios,
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
            horarioIds: debouncedHorarios,
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

    // Sincronizar datos de alumnos visibles en el mapa de seleccionados si ya estaban marcados
    useEffect(() => {
        if (alumnos.length > 0) {
            setAlumnosSeleccionadosMap(prev => {
                let changed = false;
                const next = { ...prev };
                alumnos.forEach(a => {
                    if (selectedAlumnos.includes(a.id) && !next[a.id]) {
                        next[a.id] = a;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }
    }, [alumnos, selectedAlumnos]);

    // Cargar historial de asistencia semanal (últimos 7 días) para la página actual
    useEffect(() => {
        if (alumnos.length > 0) {
            const alumnoIds = alumnos.map(a => a.id);
            getAsistenciasEstaSemana(alumnoIds)
                .then(history => setAsistenciaHistory(prev => ({ ...prev, ...history })))
                .catch(err => console.error('Error al cargar historial de asistencias:', err));
        }
    }, [alumnos]);

    // Opciones dinámicas de filtros
    const dynamicOptions = useMemo(() => {
        const canchasOpts = (catalogosData?.canchas || []).map(cancha => ({
            value: cancha.id,
            label: cancha.label || `${cancha.nombre} (${cancha.total_alumnos ?? 0})`,
            nombre: cancha.nombre,
            total_alumnos: cancha.total_alumnos ?? 0
        }));
        const entrenadoresOpts = (catalogosData?.entrenadores || []).map(entrenador => ({
            value: entrenador.id,
            label: `${entrenador.nombres} ${entrenador.apellidos}`
        }));
        const horariosOpts = (catalogosData?.horarios || []).map(horario => ({
            value: horario.id,
            label: horario.hora || horario.label
        }));
        const subsFuente = Array.isArray(opcionesFiltrosData)
            ? [...new Set(opcionesFiltrosData
                .map(relacion => relacion.sub)
                .filter(Number.isInteger))].sort((a, b) => a - b)
            : (alumnosData?.facetas?.subs || []);
        const subsOpts = subsFuente.map(sub => ({ value: sub, label: `Sub ${sub}` }));

        return { canchas: canchasOpts, entrenadores: entrenadoresOpts, horarios: horariosOpts, subs: subsOpts };
    }, [catalogosData, opcionesFiltrosData, alumnosData?.facetas?.subs]);

    const filtrarOpcionesPorRelaciones = useCallback((opciones, campoPropio, filtros) => {
        if (!opcionesFiltrosData) return opciones;

        const coincide = (valor, seleccionados = []) => {
            if (!seleccionados.length) return true;
            return seleccionados.some(seleccionado => String(seleccionado) === String(valor));
        };
        const relaciones = Array.isArray(opcionesFiltrosData) ? opcionesFiltrosData : [];
        const permitidos = new Set(
            relaciones
                .filter(relacion => (
                    coincide(relacion.cancha_id, filtros.canchas)
                    && coincide(relacion.entrenador_id, filtros.entrenadores)
                    && coincide(relacion.horario_id, filtros.horarios)
                    && coincide(relacion.sub, filtros.subs)
                ))
                .map(relacion => relacion[campoPropio])
                .filter(valor => valor !== null && valor !== undefined)
                .map(String)
        );

        return opciones.filter(opcion => permitidos.has(String(opcion.value)));
    }, [opcionesFiltrosData]);

    const canchasDisponibles = useMemo(
        () => filtrarOpcionesPorRelaciones(dynamicOptions.canchas, 'cancha_id', {
            entrenadores: selectedEntrenadores,
            horarios: selectedHorarios,
            subs: selectedSubs
        }),
        [dynamicOptions.canchas, filtrarOpcionesPorRelaciones, selectedEntrenadores, selectedHorarios, selectedSubs]
    );
    const entrenadoresDisponibles = useMemo(
        () => filtrarOpcionesPorRelaciones(dynamicOptions.entrenadores, 'entrenador_id', {
            canchas: selectedCanchas,
            horarios: selectedHorarios,
            subs: selectedSubs
        }),
        [dynamicOptions.entrenadores, filtrarOpcionesPorRelaciones, selectedCanchas, selectedHorarios, selectedSubs]
    );
    const horariosDisponibles = useMemo(
        () => filtrarOpcionesPorRelaciones(dynamicOptions.horarios, 'horario_id', {
            canchas: selectedCanchas,
            entrenadores: selectedEntrenadores,
            subs: selectedSubs
        }),
        [dynamicOptions.horarios, filtrarOpcionesPorRelaciones, selectedCanchas, selectedEntrenadores, selectedSubs]
    );
    const subsDisponibles = useMemo(
        () => filtrarOpcionesPorRelaciones(dynamicOptions.subs, 'sub', {
            canchas: selectedCanchas,
            entrenadores: selectedEntrenadores,
            horarios: selectedHorarios
        }),
        [dynamicOptions.subs, filtrarOpcionesPorRelaciones, selectedCanchas, selectedEntrenadores, selectedHorarios]
    );

    useEffect(() => {
        if (!opcionesFiltrosData) return;
        setSelectedCanchas(prev => sanearSeleccionIncompatible(prev, canchasDisponibles));
        setSelectedEntrenadores(prev => sanearSeleccionIncompatible(prev, entrenadoresDisponibles));
        setSelectedHorarios(prev => sanearSeleccionIncompatible(prev, horariosDisponibles));
        setSelectedSubs(prev => sanearSeleccionIncompatible(prev, subsDisponibles));
    }, [opcionesFiltrosData, canchasDisponibles, entrenadoresDisponibles, horariosDisponibles, subsDisponibles]);

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

    const handleClearFilters = () => {
        setActiveFilter('todos');
        setSelectedCanchas([]);
        setSelectedEntrenadores([]);
        setSelectedSubs([]);
        setSelectedHorarios([]);
        setSearchTerm('');
        setCurrentPage(1);
        try { sessionStorage.removeItem(FILTROS_CONVOCATORIA_KEY); } catch {}
    };

    /**
     * Marca o desmarca un jugador para la convocatoria.
     * Permite seleccionar cualquier jugador; si tiene menos de 2 asistencias en la semana,
     * muestra una alerta informativa pero lo incluye igualmente.
     */
    const toggleAlumnoSelection = (alumno) => {
        if (!alumno?.id) return;
        const id = alumno.id;
        const asistencias = getAsistenciaResumen(id);
        const yaSeleccionado = selectedAlumnos.includes(id);

        if (!yaSeleccionado && asistencias < 2) {
            const nombreCompleto = `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim();
            addToast(
                `Alerta: ${nombreCompleto} tiene menos de 2 asistencias esta semana (${asistencias}).`,
                'warning'
            );
        }

        if (yaSeleccionado) {
            setSelectedAlumnos(prev => prev.filter(item => item !== id));
            setAlumnosSeleccionadosMap(prev => {
                const copia = { ...prev };
                delete copia[id];
                return copia;
            });
        } else {
            setSelectedAlumnos(prev => [...prev, id]);
            setAlumnosSeleccionadosMap(prev => ({ ...prev, [id]: alumno }));
        }
    };

    /**
     * Selecciona o deselecciona todos los jugadores de la página actual que cumplen con >= 2 asistencias.
     * Los jugadores con < 2 asistencias se seleccionan manualmente uno por uno.
     */
    const handleSelectAll = (currentPageAlumnos) => {
        const alumnosElegibles = currentPageAlumnos.filter(a => getAsistenciaResumen(a.id) >= 2);
        const pageIds = alumnosElegibles.map(a => a.id);

        if (pageIds.length === 0) {
            addToast('Ningún alumno en esta página tiene 2 o más asistencias. Puedes seleccionarlos manualmente.', 'info');
            return;
        }

        const allSelected = pageIds.every(id => selectedAlumnos.includes(id));
        if (allSelected) {
            setSelectedAlumnos(prev => prev.filter(id => !pageIds.includes(id)));
            setAlumnosSeleccionadosMap(prev => {
                const copia = { ...prev };
                pageIds.forEach(id => delete copia[id]);
                return copia;
            });
        } else {
            setSelectedAlumnos(prev => [...new Set([...prev, ...pageIds])]);
            setAlumnosSeleccionadosMap(prev => {
                const copia = { ...prev };
                alumnosElegibles.forEach(a => {
                    copia[a.id] = a;
                });
                return copia;
            });
        }
    };

    const limpiarSeleccion = () => {
        setSelectedAlumnos([]);
        setAlumnosSeleccionadosMap({});
    };

    const actualizarDatoPartido = (campo, valor) => {
        setDatosPartido(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Lista ordenada de objetos alumno correspondientes a los IDs seleccionados
    const listaAlumnosSeleccionados = useMemo(() => {
        const mapaVisible = new Map(alumnos.map(a => [a.id, a]));
        return selectedAlumnos
            .map(id => alumnosSeleccionadosMap[id] || mapaVisible.get(id))
            .filter(Boolean);
    }, [selectedAlumnos, alumnosSeleccionadosMap, alumnos]);

    const cantidadConBajaAsistencia = useMemo(() => {
        return selectedAlumnos.filter(id => getAsistenciaResumen(id) < 2).length;
    }, [selectedAlumnos, getAsistenciaResumen]);

    const sendBulkWhatsApp = () => {
        if (listaAlumnosSeleccionados.length === 0) return;

        const textoMensaje = generarMensajeWhatsAppConvocatoria(listaAlumnosSeleccionados, datosPartido);
        const message = encodeURIComponent(textoMensaje);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const hayFiltrosActivos = activeFilter !== 'todos'
        || selectedCanchas.length > 0
        || selectedEntrenadores.length > 0
        || selectedSubs.length > 0
        || selectedHorarios.length > 0
        || Boolean(searchTerm);

    return {
        loading,
        isFetching,
        alumnos,
        todosLosAlumnosFiltrados: alumnos,
        listaAlumnosSeleccionados,
        totalPages,
        currentPage,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        cantidadConBajaAsistencia,
        datosPartido,
        hayFiltrosActivos,
        filtrosMaestros: {
            ...dynamicOptions,
            canchasDisponibles,
            entrenadoresDisponibles,
            horariosDisponibles,
            subsDisponibles,
            selectedCanchas,
            selectedEntrenadores,
            selectedSubs,
            selectedHorarios,
        },
        setCurrentPage,
        setSelectedCanchas: (val) => { setSelectedCanchas(val); setCurrentPage(1); },
        setSelectedEntrenadores: (val) => { setSelectedEntrenadores(val); setCurrentPage(1); },
        setSelectedSubs: (val) => { setSelectedSubs(val); setCurrentPage(1); },
        setSelectedHorarios: (val) => { setSelectedHorarios(val); setCurrentPage(1); },
        getAsistenciaResumen,
        handleFilterChange,
        handleSearchChange,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        limpiarSeleccion,
        actualizarDatoPartido,
        sendBulkWhatsApp
    };
};
