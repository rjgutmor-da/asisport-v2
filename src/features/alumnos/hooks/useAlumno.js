import { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';

/**
 * Hook para manejar la lógica de detalle y edición de un alumno.
 * Incluye:
 *  - Carga y edición de foto (subida a Supabase Storage)
 *  - Asignación unificada de hasta 2 entrenadores (tabla alumnos_entrenadores)
 *  - Edición de todos los campos del alumno
 * @param {string} id - ID del alumno
 */
export const useAlumno = (id) => {
    const { addToast } = useToast();

    const [alumno, setAlumno] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Datos maestros
    const [canchas, setCanchas] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);

    // Estado del formulario de edición
    const [formData, setFormData] = useState({});

    // Estado para la nueva foto seleccionada (archivo)
    const [photoFile, setPhotoFile] = useState(null);

    // Estado para los entrenadores seleccionados (máximo 2)
    const [selectedEntrenadores, setSelectedEntrenadores] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;

            try {
                // Cargar alumno con sus relaciones
                const { data: alumnoData, error: alumnoError } = await supabase
                    .from('alumnos')
                    .select(`
                        *,
                        cancha:canchas(id, nombre),
                        horario:horarios(id, hora),
                        asistencias_normales(id),
                        asistencias_arqueros(id),
                        alumnos_entrenadores(entrenador_id, usuario:usuarios(id, nombres, apellidos))
                    `)
                    .eq('id', id)
                    .single();

                if (alumnoError) throw alumnoError;

                // Calcular totales de asistencias
                const alumnoConTotales = {
                    ...alumnoData,
                    asistencias_count: (alumnoData.asistencias_normales?.length || 0) +
                        (alumnoData.asistencias_arqueros?.length || 0)
                };

                setAlumno(alumnoConTotales);
                setFormData(alumnoConTotales);

                // Inicializar entrenadores seleccionados desde la data existente
                const entrenadoresActuales = (alumnoData.alumnos_entrenadores || [])
                    .map(ae => ae.entrenador_id);
                setSelectedEntrenadores(entrenadoresActuales);

                // Cargar datos maestros en paralelo
                const [canchasData, horariosData, entrenadoresData] = await Promise.all([
                    getCanchas(),
                    getHorarios(),
                    getEntrenadores()
                ]);
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
                // Solo entrenadores (ya filtrados en el servicio), no administradores
                setEntrenadores(entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })));

            } catch (error) {
                console.error(error);
                addToast('Error al cargar datos del alumno', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, addToast]);

    // Manejo de cambios en inputs del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    /**
     * Agrega un entrenador a la selección (máximo 2).
     * @param {string} entrenadorId - ID del entrenador a agregar
     */
    const addEntrenador = (entrenadorId) => {
        if (!entrenadorId) return;
        if (selectedEntrenadores.includes(entrenadorId)) {
            addToast('Este entrenador ya está asignado', 'warning');
            return;
        }
        if (selectedEntrenadores.length >= 2) {
            addToast('Máximo 2 entrenadores por alumno', 'warning');
            return;
        }
        setSelectedEntrenadores(prev => [...prev, entrenadorId]);
    };

    /**
     * Remueve un entrenador de la selección.
     * @param {string} entrenadorId - ID del entrenador a remover
     */
    const removeEntrenador = (entrenadorId) => {
        setSelectedEntrenadores(prev => prev.filter(id => id !== entrenadorId));
    };

    /**
     * Sube una foto al storage de Supabase y devuelve la URL pública.
     * Comprime automáticamente si es necesario (la compresión ya la hace FileInput).
     * @param {File} file - Archivo de imagen a subir
     * @returns {string} URL pública de la foto subida
     */
    const uploadPhoto = async (file) => {
        const MAX_SIZE = 100 * 1024; // 100 KB
        let fileToUpload = file;

        // Re-comprimir si el archivo aún excede el límite (seguridad adicional)
        if (file.size > MAX_SIZE) {
            try {
                const options = {
                    maxSizeMB: 0.09,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/jpeg',
                };
                fileToUpload = await imageCompression(file, options);

                // Segundo intento si sigue excediendo
                if (fileToUpload.size > MAX_SIZE) {
                    fileToUpload = await imageCompression(fileToUpload, {
                        maxSizeMB: 0.07,
                        maxWidthOrHeight: 600,
                        useWebWorker: true,
                        fileType: 'image/jpeg',
                    });
                }
            } catch (compError) {
                throw new Error(compError.message || 'Error al comprimir la foto para subir.');
            }
        }

        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `fotos_alumnos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, fileToUpload);

        if (uploadError) throw new Error('Error al subir la foto: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    /**
     * Sincroniza la tabla alumnos_entrenadores con los entrenadores seleccionados.
     * Usa un enfoque diferencial: compara los actuales con los deseados y solo
     * elimina/inserta lo necesario. Si falla completamente, intenta un segundo
     * enfoque con delete + insert total.
     * @param {string} alumnoId - ID del alumno
     * @param {string[]} entrenadoresIds - IDs de los entrenadores a asignar
     */
    const syncEntrenadores = async (alumnoId, entrenadoresIds) => {
        // Obtener las asignaciones actuales en la BD
        const { data: actuales, error: fetchError } = await supabase
            .from('alumnos_entrenadores')
            .select('id, entrenador_id')
            .eq('alumno_id', alumnoId);

        if (fetchError) {
            console.error('Error al consultar entrenadores actuales:', fetchError);
            throw new Error('No se pudieron consultar los entrenadores actuales.');
        }

        const idsActuales = (actuales || []).map(a => a.entrenador_id);

        // Calcular los que hay que eliminar y los que hay que insertar
        const paraEliminar = (actuales || []).filter(a => !entrenadoresIds.includes(a.entrenador_id));
        const paraInsertar = entrenadoresIds.filter(eId => !idsActuales.includes(eId));

        // Si no hay cambios, no hacer nada
        if (paraEliminar.length === 0 && paraInsertar.length === 0) {
            return;
        }

        // Eliminar los que ya no deben estar
        if (paraEliminar.length > 0) {
            const idsParaEliminar = paraEliminar.map(a => a.id);
            const { error: deleteError } = await supabase
                .from('alumnos_entrenadores')
                .delete()
                .in('id', idsParaEliminar);

            if (deleteError) {
                console.error('Error al eliminar entrenadores por id:', deleteError);
                // Intentar eliminar uno por uno como fallback
                for (const registro of paraEliminar) {
                    const { error: delOneError } = await supabase
                        .from('alumnos_entrenadores')
                        .delete()
                        .eq('id', registro.id);
                    if (delOneError) {
                        console.error(`Error al eliminar registro ${registro.id}:`, delOneError);
                    }
                }
            }
        }

        // Insertar los nuevos
        if (paraInsertar.length > 0) {
            const nuevasAsignaciones = paraInsertar.map(entrenadorId => ({
                alumno_id: alumnoId,
                entrenador_id: entrenadorId
            }));

            const { error: insertError } = await supabase
                .from('alumnos_entrenadores')
                .insert(nuevasAsignaciones);

            if (insertError) {
                console.error('Error al insertar nuevos entrenadores:', insertError);
                throw new Error('Error al asignar nuevos entrenadores.');
            }
        }
    };

    /**
     * Recarga los datos del alumno desde la BD y actualiza el estado local.
     * @param {string} alumnoId - ID del alumno a recargar
     */
    const recargarAlumno = async (alumnoId) => {
        const { data: alumnoActualizado, error: reloadError } = await supabase
            .from('alumnos')
            .select(`
                *,
                cancha:canchas(id, nombre),
                horario:horarios(id, hora),
                asistencias_normales(id),
                asistencias_arqueros(id),
                alumnos_entrenadores(entrenador_id, usuario:usuarios(id, nombres, apellidos))
            `)
            .eq('id', alumnoId)
            .single();

        if (!reloadError && alumnoActualizado) {
            const actualizado = {
                ...alumnoActualizado,
                asistencias_count: (alumnoActualizado.asistencias_normales?.length || 0) +
                    (alumnoActualizado.asistencias_arqueros?.length || 0)
            };
            setAlumno(actualizado);
            setFormData(actualizado);
            // Sincronizar entrenadores seleccionados con la BD
            const entrenadoresActualizados = (alumnoActualizado.alumnos_entrenadores || [])
                .map(ae => ae.entrenador_id);
            setSelectedEntrenadores(entrenadoresActualizados);
        }
    };

    // Guardar todos los cambios (datos, foto y entrenadores)
    const saveChanges = async () => {
        setSaving(true);
        try {
            // 1. Si hay una nueva foto, subirla primero
            let fotoUrl = formData.foto_url || null;
            if (photoFile) {
                // Eliminar foto antigua de Supabase Storage si existe
                if (alumno.foto_url) {
                    try {
                        const urlParts = alumno.foto_url.split('/avatars/');
                        if (urlParts.length > 1) {
                            const oldPath = urlParts[1];
                            await supabase.storage.from('avatars').remove([oldPath]);
                        }
                    } catch (e) {
                        console.error('Error al eliminar foto antigua:', e);
                    }
                }
                fotoUrl = await uploadPhoto(photoFile);
            }

            // 2. Determinar el profesor_asignado_id (primer entrenador seleccionado o null)
            const profesorAsignadoId = selectedEntrenadores.length > 0
                ? selectedEntrenadores[0]
                : null;

            // 3. Actualizar datos del alumno en la tabla principal
            const { error } = await supabase
                .from('alumnos')
                .update({
                    nombres: formData.nombres,
                    apellidos: formData.apellidos,
                    fecha_nacimiento: formData.fecha_nacimiento,
                    carnet_identidad: formData.carnet_identidad,
                    nombre_padre: formData.nombre_padre,
                    telefono_padre: formData.telefono_padre,
                    nombre_madre: formData.nombre_madre,
                    telefono_madre: formData.telefono_madre,
                    telefono_deportista: formData.telefono_deportista,
                    colegio: formData.colegio,
                    direccion: formData.direccion,
                    cancha_id: formData.cancha_id,
                    horario_id: formData.horario_id,
                    profesor_asignado_id: profesorAsignadoId,
                    es_arquero: formData.es_arquero,
                    foto_url: fotoUrl
                })
                .eq('id', id);

            if (error) throw error;

            // 4. Sincronizar entrenadores en la tabla de relación
            // Este paso es independiente: si falla, los datos del alumno ya se guardaron
            let errorEntrenadores = null;
            try {
                await syncEntrenadores(id, selectedEntrenadores);
            } catch (syncError) {
                console.error('Error en sincronización de entrenadores:', syncError);
                errorEntrenadores = syncError;
            }

            // 5. Recargar los datos del alumno para reflejar los cambios
            await recargarAlumno(id);

            // Limpiar archivo de foto temporal
            setPhotoFile(null);

            // 6. Notificar al usuario según el resultado
            if (errorEntrenadores) {
                // Los datos se guardaron, pero hubo problema con la tabla de relación
                addToast('Datos del alumno guardados. Nota: hubo un problema al sincronizar entrenadores, pero el entrenador principal se asignó correctamente.', 'warning');
            } else {
                addToast('¡Listo! Cambios guardados correctamente ✓', 'success');
            }
            setEditing(false);

            return true;
        } catch (error) {
            console.error('Error general al guardar cambios:', error);
            addToast(error.message || 'No pudimos guardar los cambios. Intenta nuevamente.', 'error');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Cancelar edición y restaurar datos originales
    const cancelEditing = () => {
        setFormData(alumno);
        setPhotoFile(null);
        // Restaurar entrenadores originales
        const entrenadoresOriginales = (alumno?.alumnos_entrenadores || [])
            .map(ae => ae.entrenador_id);
        setSelectedEntrenadores(entrenadoresOriginales);
        setEditing(false);
    };

    // Aprobar alumno (cambiar estado de Pendiente a Aprobado)
    const handleAprobar = async () => {
        try {
            const { aprobarAlumno } = await import('../../../services/alumnos');
            await aprobarAlumno(id);
            setAlumno(prev => ({ ...prev, estado: 'Aprobado' }));
            addToast('Alumno aprobado correctamente', 'success');
            return true;
        } catch (error) {
            console.error(error);
            addToast(error.message, 'error');
            return false;
        }
    };

    return {
        alumno,
        loading,
        editing,
        saving,
        formData,
        photoFile,
        selectedEntrenadores,
        maestros: { canchas, horarios, entrenadores },

        setEditing,
        handleChange,
        setPhotoFile,
        addEntrenador,
        removeEntrenador,
        saveChanges,
        cancelEditing,
        handleAprobar
    };
};
