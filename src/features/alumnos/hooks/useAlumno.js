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
        const MAX_SIZE = 200 * 1024; // 200 KB
        let fileToUpload = file;

        // Re-comprimir si el archivo aún excede el límite (seguridad adicional)
        if (file.size > MAX_SIZE) {
            try {
                const options = {
                    maxSizeMB: 0.15,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };
                fileToUpload = await imageCompression(file, options);

                // Segundo intento si sigue excediendo
                if (fileToUpload.size > MAX_SIZE) {
                    fileToUpload = await imageCompression(fileToUpload, {
                        maxSizeMB: 0.10,
                        maxWidthOrHeight: 600,
                        useWebWorker: true,
                    });
                }

                if (fileToUpload.size > MAX_SIZE) {
                    throw new Error('La foto es demasiado pesada incluso después de comprimir. Intenta con otra imagen.');
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
     * Elimina los registros existentes y crea los nuevos.
     * @param {string} alumnoId - ID del alumno
     * @param {string[]} entrenadoresIds - IDs de los entrenadores a asignar
     */
    const syncEntrenadores = async (alumnoId, entrenadoresIds) => {
        // 1. Eliminar asignaciones actuales
        const { error: deleteError } = await supabase
            .from('alumnos_entrenadores')
            .delete()
            .eq('alumno_id', alumnoId);

        if (deleteError) {
            console.error('Error al eliminar entrenadores antiguos:', deleteError);
            throw new Error('Error al actualizar entrenadores');
        }

        // 2. Insertar las nuevas asignaciones
        if (entrenadoresIds.length > 0) {
            const nuevasAsignaciones = entrenadoresIds.map(entrenadorId => ({
                alumno_id: alumnoId,
                entrenador_id: entrenadorId
            }));

            const { error: insertError } = await supabase
                .from('alumnos_entrenadores')
                .insert(nuevasAsignaciones);

            if (insertError) {
                console.error('Error al asignar entrenadores:', insertError);
                throw new Error('Error al asignar entrenadores');
            }
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
            await syncEntrenadores(id, selectedEntrenadores);

            // 5. Recargar los datos del alumno para reflejar los cambios
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
                .eq('id', id)
                .single();

            if (!reloadError && alumnoActualizado) {
                const actualizado = {
                    ...alumnoActualizado,
                    asistencias_count: (alumnoActualizado.asistencias_normales?.length || 0) +
                        (alumnoActualizado.asistencias_arqueros?.length || 0)
                };
                setAlumno(actualizado);
                setFormData(actualizado);
            }

            // Limpiar archivo de foto temporal
            setPhotoFile(null);

            addToast('¡Listo! Cambios guardados correctamente ✓', 'success');
            setEditing(false);

            return true;
        } catch (error) {
            console.error(error);
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
