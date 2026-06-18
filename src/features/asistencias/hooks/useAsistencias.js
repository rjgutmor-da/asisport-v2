import { useState, useEffect, useCallback, useMemo } from 'react';
import { logActivity } from '../../../lib/auditLogger';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { useAsistenciasQuery } from '../../../hooks/useAsistenciasQuery';
import {
    getAlumnosParaAsistencia,
    registrarAsistenciasPorLote,
    verificarEstadoEnvio
} from '../../../services/asistencias';
import { getAlumnosFacets } from '../../../services/alumnos';
import { subirFotoAsistenciaGrupal } from '../../../services/fotoAsistenciaGrupal';

export const useAsistencias = () => {
    const { addToast } = useToast();
    const { isAdmin, userProfile, escuelaId } = useAuth();

    // Fecha selecionada (por defecto HOY)
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Estados de carga y envío
    const [submitting, setSubmitting] = useState(false);

    // Filtros
    const [selectedCancha, setSelectedCancha] = useState('');
    const [selectedHorario, setSelectedHorario] = useState('');
    const [selectedEntrenador, setSelectedEntrenador] = useState('');

    // Estado local de cambios pendientes (Map: alumnoId -> estado)
    const [localChanges, setLocalChanges] = useState(new Map());

    // Estado para foto grupal de asistencia (capturada pero aún no subida)
    const [fotoGrupal, setFotoGrupalState] = useState(null);
    const [fotoGrupalPreview, setFotoGrupalPreview] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // --- DATOS MAESTROS (Caché centralizada) ---
    const { 
        canchas: rawCanchas, 
        horarios: rawHorarios, 
        entrenadores: rawEntrenadores,
        isLoading: loadingMaestros 
    } = useMasterData();

    // Estado para facetas (alumnos simplificados) para filtrado inteligente
    const [facetsData, setFacetsData] = useState([]);

    // Cargar facetas (alumnos) para filtrado inteligente de canchas y horarios
    useEffect(() => {
        const fetchFacets = async () => {
            if (!userProfile) return;
            
            // Si es admin y no seleccionó entrenador, traemos todo (userId = null)
            // Si es admin y seleccionó entrenador, traemos de ese entrenador
            // Si no es admin, traemos del usuario actual
            const targetUserId = isAdmin ? (selectedEntrenador || null) : userProfile.id;
            const roleForFacets = isAdmin && !selectedEntrenador ? 'Administrador' : 'Entrenador';
            
            try {
                const data = await getAlumnosFacets({ userId: targetUserId, userRole: roleForFacets });
                setFacetsData(data);
            } catch (err) {
                console.error("Error fetching facets", err);
            }
        };
        fetchFacets();
    }, [userProfile, isAdmin, selectedEntrenador]);

    const canchas = useMemo(() => {
        if (isAdmin && !selectedEntrenador) {
            return rawCanchas.map(c => ({ value: c.id, label: c.nombre }));
        }

        const canchasMap = new Map();
        facetsData.forEach(a => {
            if (a.cancha_id) {
                const cInfo = rawCanchas.find(rc => rc.id === a.cancha_id);
                if (cInfo) canchasMap.set(cInfo.id, { value: cInfo.id, label: cInfo.nombre });
            }
        });
        
        return Array.from(canchasMap.values()).sort((a,b) => a.label.localeCompare(b.label));
    }, [facetsData, rawCanchas, isAdmin, selectedEntrenador]);

    const horarios = useMemo(() => {
        // Si no hay cancha seleccionada y es admin viendo todos, mostrar todos los horarios
        if (isAdmin && !selectedEntrenador && !selectedCancha) {
            return rawHorarios.map(h => ({ value: h.id, label: h.hora }));
        }

        const horariosMap = new Map();
        facetsData.forEach(a => {
            // Filtrar por cancha si hay una seleccionada
            if (selectedCancha && a.cancha_id !== selectedCancha) return;
            
            if (a.horario_id) {
                const hInfo = rawHorarios.find(rh => rh.id === a.horario_id);
                if (hInfo) horariosMap.set(hInfo.id, { value: hInfo.id, label: hInfo.hora });
            }
        });

        return Array.from(horariosMap.values()).sort((a,b) => a.label.localeCompare(b.label));
    }, [facetsData, rawHorarios, selectedCancha, isAdmin, selectedEntrenador]);

    const entrenadores = useMemo(() => rawEntrenadores.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })), [rawEntrenadores]);

    // Limpiar horario si el nuevo grupo seleccionado no contiene el horario actual
    useEffect(() => {
        if (selectedHorario && horarios.length > 0) {
            const horarioValido = horarios.find(h => h.value === selectedHorario);
            if (!horarioValido) {
                setSelectedHorario('');
            }
        }
    }, [horarios, selectedHorario, selectedCancha]);

    // --- DATOS DE ASISTENCIA (TanStack Query) ---
    const { 
        data: alumnos = [], 
        isLoading: loadingAsistencias,
        refetch: refresh 
    } = useAsistenciasQuery(
        selectedDate, 
        selectedCancha || null, 
        selectedHorario || null, 
        selectedEntrenador || null
    );

    // Estado para verificar si ya se envió (Esto podría ser otra query, pero lo mantenemos simple por ahora)
    const [enviosRealizados, setEnviosRealizados] = useState(0);

    // Efecto para verificar estado de envío cuando cambian filtros
    useEffect(() => {
        const checkEnvio = async () => {
            if (!isAdmin && (!selectedCancha || !selectedHorario)) return;
            try {
                const estadoEnvio = await verificarEstadoEnvio(selectedDate, selectedCancha || null, selectedHorario || null);
                const reenvioKey = `asistencia_reenvio_${selectedDate}_${selectedCancha || 'all'}_${selectedHorario || 'all'}`;
                const reenviadoLocal = localStorage.getItem(reenvioKey) === 'true';

                if (estadoEnvio.existe) {
                    setEnviosRealizados(reenviadoLocal ? 2 : 1);
                } else {
                    setEnviosRealizados(0);
                }
            } catch (error) {
                console.error("Error verificando envío:", error);
            }
        };
        checkEnvio();
    }, [selectedDate, selectedCancha, selectedHorario, isAdmin]);

    const loading = loadingMaestros || loadingAsistencias;

    // Manejo de fecha
    const handleDateChange = (newDate) => {
        if (!newDate) return;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const selected = new Date(newDate + 'T23:59:59');

        if (selected > today) {
            addToast('No se pueden registrar asistencias para fechas futuras.', 'error');
            return;
        }
        setSelectedDate(newDate);
    };

    // Toggle asistencia (clic en activo desmarca)
    const handleAsistenciaNormal = (alumnoId, estado) => {
        // Bloquear si ya se reenvió (envio 2)
        if (enviosRealizados >= 2) return;

        setLocalChanges(prev => {
            const newMap = new Map(prev);
            const currentState = getEstadoEfectivo(alumnoId);

            if (currentState === estado) {
                // Si es el mismo estado, desmarcar (volver a null/Ausente implícito)
                // Pero necesitamos saber si el estado original en DB era diferente.
                // Si en DB era 'Presente' y ahora desmarco, debo enviar null? 
                // No, el backend espera 'Presente', 'Licencia', 'Ausente'.
                // 'Ausente' es el default?
                // El servicio delete borra el registro.
                // Aquí vamos a manejar 'Ausente' explícitamente si se desmarca?
                // Mejor: Si desmarco, y no estaba en DB, borro del mapa.
                // Si estaba en DB, pongo 'Ausente' en el mapa (o null si el servicio lo soporta).
                // Simplificación: Toggle desmarca visualmente. Al enviar, si no está en el mapa, no se envía.
                // Pero si quiero borrar un 'Presente' de la DB, tengo que enviar algo.
                // El usuario pidió: "un alumno sin el boton asignado es un alumno ausente".
                // Entonces si desmarco, debo enviar 'Ausente' si antes tenía algo.

                // Si estado actual es 'Presente' y hago click en 'Presente' -> Pasa a 'Ausente' (o null)
                newMap.set(alumnoId, 'Ausente');
            } else {
                newMap.set(alumnoId, estado);
            }
            return newMap;
        });
    };

    // Helper para eliminar asistencia (usado por el componente listItem)
    const handleEliminarAsistenciaNormal = (alumnoId) => {
        if (enviosRealizados >= 2) return;
        setLocalChanges(prev => {
            const newMap = new Map(prev);
            newMap.set(alumnoId, 'Ausente'); // Marcar como Ausente explícitamente para sobreescribir DB
            return newMap;
        });
    };

    // --- Funciones para foto grupal ---
    const setFotoGrupal = (file) => {
        setFotoGrupalState(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setFotoGrupalPreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFotoGrupalPreview(null);
        }
    };

    const clearFotoGrupal = () => {
        setFotoGrupalState(null);
        setFotoGrupalPreview(null);
    };

    const handleSubmit = async () => {
        if (enviosRealizados >= 2) {
            addToast('Ya has realizado el límite de envíos para hoy.', 'error');
            return null;
        }

        setSubmitting(true);
        try {
            // Preparar payload
            // Incluir todos los cambios locales.
            // Si algo se marcó como 'Ausente', el servicio lo actualizará a Ausente (o borrará si implementamos delete).
            // La regla de negocio dice "un alumno sin boton es ausente".
            // En base de datos, 'Ausente' es un estado válido.

            const asistencias = Array.from(localChanges.entries())
                .filter(([_, estado]) => estado !== null) // Filtrar nulos si los hubiera
                .map(([alumnoId, estado]) => ({
                    alumnoId,
                    estado
                }));

            if (asistencias.length === 0) {
                // Si no hay cambios explícitos pero es el primer envío, 
                // tal vez quiera enviar "todos ausentes"? 
                // Mejor no hacer nada si no marcó a nadie.
                // O si es reenvío y borró todo...
            }

            const resultados = await registrarAsistenciasPorLote(asistencias, selectedDate, selectedEntrenador);

            // Subir foto grupal si existe (después de registrar asistencias exitosamente)
            if (fotoGrupal && resultados.exitosos > 0) {
                try {
                    setSubiendoFoto(true);
                    await subirFotoAsistenciaGrupal(fotoGrupal, {
                        fecha: selectedDate,
                        canchaId: selectedCancha || null,
                        horarioId: selectedHorario || null,
                    });
                    console.log('📸 Foto grupal subida exitosamente');
                    clearFotoGrupal();
                } catch (fotoError) {
                    console.error('[Error] Fallo al subir foto grupal:', fotoError);
                    addToast('Las asistencias se guardaron, pero hubo un error al subir la foto grupal.', 'warning');
                } finally {
                    setSubiendoFoto(false);
                }
            }

            if (resultados.fallidos > 0) {
                const errorStr = resultados.errores.length > 0 ? JSON.stringify(resultados.errores[0]) : '';
                addToast(`Hubo errores: ${resultados.fallidos} fallidos. Detalle: ${errorStr}`, 'warning');
            } else {
                // Éxito
                if (enviosRealizados === 1) {
                    // Marcar en localStorage que ya se hizo el reenvío (por cancha/horario)
                    const reenvioKey = `asistencia_reenvio_${selectedDate}_${selectedCancha || 'all'}_${selectedHorario || 'all'}`;
                    localStorage.setItem(reenvioKey, 'true');
                    setEnviosRealizados(2);
                } else {
                    setEnviosRealizados(1);
                }

                // LOG DE ACTIVIDAD
                logActivity({
                    escuela_id: escuelaId,
                    usuario_id: userProfile?.id,
                    usuario_nombre: `${userProfile?.nombres || ''} ${userProfile?.apellidos || ''}`.trim() || userProfile?.email,
                    accion: enviosRealizados === 1 ? 'Reenvío de Asistencias' : 'Envío de Asistencias',
                    modulo: 'Asistencias',
                    detalle: {
                        fecha: selectedDate,
                        presentes: resumen.presentes,
                        licencias: resumen.licencias,
                        ausentes: resumen.ausentes,
                        descripcion: `Se envió la lista de asistencia del ${selectedDate}. Resumen: ${resumen.presentes} Presentes, ${resumen.licencias} Licencias, ${resumen.ausentes} Ausentes.`
                    }
                });
            }

            // Recargar
            await refresh();

            return resultados; // Para mostrar resumen en UI
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al enviar', 'error');
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const getEstadoEfectivo = (alumnoId) => {
        if (localChanges.has(alumnoId)) {
            const local = localChanges.get(alumnoId);
            return local === 'Ausente' ? null : local; // Visualmente 'Ausente' es null (ningún botón activo)
        }
        const alumno = alumnos.find(a => a.id === alumnoId);
        // Si en DB es 'Ausente', visualmente es null
        return alumno?.asistenciaNormal?.estado === 'Ausente' ? null : alumno?.asistenciaNormal?.estado;
    };

    const resumen = useMemo(() => {
        const result = {
            total: alumnos.length,
            presentes: 0,
            licencias: 0,
            ausentes: 0,
            cambiosPendientes: localChanges.size
        };

        alumnos.forEach(a => {
            const estado = getEstadoEfectivo(a.id);
            if (estado === 'Presente') result.presentes++;
            else if (estado === 'Licencia') result.licencias++;
            else result.ausentes++;
        });

        return result;
    }, [alumnos, localChanges]); // getEstadoEfectivo es estable o depende de localChanges

    return {
        loading,
        submitting,
        subiendoFoto,
        alumnos,
        selectedDate,
        resumen,
        enviosRealizados,
        canchas,
        horarios,
        selectedCancha,
        selectedHorario,
        setSelectedCancha,
        setSelectedHorario,
        handleDateChange,
        handleAsistenciaNormal,
        handleEliminarAsistenciaNormal,
        getEstadoEfectivo,
        handleSubmit,
        refresh,
        isAdmin,
        entrenadores,
        selectedEntrenador,
        setSelectedEntrenador,
        // Foto grupal
        fotoGrupal,
        fotoGrupalPreview,
        setFotoGrupal,
        clearFotoGrupal
    };
};
