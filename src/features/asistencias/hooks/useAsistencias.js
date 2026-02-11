import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { getCanchas, getHorarios } from '../../../services/maestros';
import {
    getAlumnosParaAsistencia,
    registrarAsistenciasPorLote,
    verificarEstadoEnvio
} from '../../../services/asistencias';

export const useAsistencias = () => {
    const { addToast } = useToast();

    // Fecha selecionada (por defecto HOY)
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Estados de carga
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Datos
    const [alumnos, setAlumnos] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [horarios, setHorarios] = useState([]);

    // Filtros
    const [selectedCancha, setSelectedCancha] = useState('');
    const [selectedHorario, setSelectedHorario] = useState('');

    // Estado local de cambios pendientes (Map: alumnoId -> estado)
    const [localChanges, setLocalChanges] = useState(new Map());

    // Estado de envíos realizados (0=Nada, 1=Enviado, 2=Reenviado/Bloqueado)
    const [enviosRealizados, setEnviosRealizados] = useState(0);

    // Cargar maestros
    useEffect(() => {
        const loadMaestros = async () => {
            try {
                const [canchasData, horariosData] = await Promise.all([
                    getCanchas(),
                    getHorarios()
                ]);
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
            } catch (error) {
                console.error(error);
                addToast('Error al cargar canchas y horarios', 'error');
            }
        };
        loadMaestros();
    }, [addToast]);

    // Cargar alumnos y verificar estado de envío
    const loadAlumnos = useCallback(async () => {
        setLoading(true);
        try {
            const [data, estadoEnvio] = await Promise.all([
                getAlumnosParaAsistencia(selectedDate, selectedCancha || null, selectedHorario || null),
                verificarEstadoEnvio(selectedDate)
            ]);

            setAlumnos(data);

            // Lógica de estado de envío
            // Si hay registros en DB, es al menos envío 1.
            // Si localStorage dice que ya se reenvió hoy, es envío 2.
            const reenvioKey = `asistencia_reenvio_${selectedDate}`;
            const reenviadoLocal = localStorage.getItem(reenvioKey) === 'true';

            if (estadoEnvio.existe) {
                setEnviosRealizados(reenviadoLocal ? 2 : 1);
            } else {
                setEnviosRealizados(0);
            }

            // Limpiar cambios locales
            setLocalChanges(new Map());
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedCancha, selectedHorario, addToast]);

    useEffect(() => {
        loadAlumnos();
    }, [loadAlumnos]);

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

            const resultados = await registrarAsistenciasPorLote(asistencias, selectedDate);

            if (resultados.fallidos > 0) {
                addToast(`Hubo errores: ${resultados.fallidos} fallidos`, 'warning');
            } else {
                // Éxito
                if (enviosRealizados === 1) {
                    // Marcar en localStorage que ya se hizo el reenvío
                    localStorage.setItem(`asistencia_reenvio_${selectedDate}`, 'true');
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
        refresh: loadAlumnos
    };
};
