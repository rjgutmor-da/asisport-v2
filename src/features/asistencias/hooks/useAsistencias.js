import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { useAsistenciasQuery } from '../../../hooks/useAsistenciasQuery';
import {
    getAlumnosParaAsistencia,
    registrarAsistenciasPorLote,
    verificarEstadoEnvio
} from '../../../services/asistencias';

export const useAsistencias = () => {
    const { addToast } = useToast();
    const { isAdmin, user } = useAuth();

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

    // --- DATOS MAESTROS (Caché centralizada) ---
    const { 
        canchas: rawCanchas, 
        horarios: rawHorarios, 
        entrenadores: rawEntrenadores,
        isLoading: loadingMaestros 
    } = useMasterData();

    const canchas = useMemo(() => rawCanchas.map(c => ({ value: c.id, label: c.nombre })), [rawCanchas]);
    const horarios = useMemo(() => rawHorarios.map(h => ({ value: h.id, label: h.hora })), [rawHorarios]);
    const entrenadores = useMemo(() => rawEntrenadores.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })), [rawEntrenadores]);

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
            }

            // Recargar
            await loadAlumnos();

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
        refresh: loadAlumnos,
        isAdmin,
        entrenadores,
        selectedEntrenador,
        setSelectedEntrenador
    };
};
