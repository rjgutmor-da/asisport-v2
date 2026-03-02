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
                        asistencias_normales(id, fecha, estado),
                        asistencias_arqueros(id, fecha, estado),
                        alumnos_entrenadores(entrenador_id, usuario:usuarios(id, nombres, apellidos))
                    `)
                    .eq('id', id)
                    .single();

                if (alumnoError) throw alumnoError;

                // Calcular totales de asistencias del mes actual
                const hoy = new Date();
                const mesActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

                const asisN = (alumnoData.asistencias_normales || []).filter(a =>
                    a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
                ).length;
                const asisA = (alumnoData.asistencias_arqueros || []).filter(a =>
                    a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
                ).length;

                const alumnoConTotales = {
                    ...alumnoData,
                    asistencias_count: asisN + asisA
                };

                setAlumno(alumnoConTotales);
                setFormData(alumnoConTotales);

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
                asistencias_normales(id, fecha, estado),
                asistencias_arqueros(id, fecha, estado),
                alumnos_entrenadores(entrenador_id, usuario:usuarios(id, nombres, apellidos))
            `)
            .eq('id', alumnoId)
            .single();

        if (!reloadError && alumnoActualizado) {
            const hoy = new Date();
            const mesActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

            const asisN = (alumnoActualizado.asistencias_normales || []).filter(a =>
                a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
            ).length;
            const asisA = (alumnoActualizado.asistencias_arqueros || []).filter(a =>
                a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
            ).length;

            const actualizado = {
                ...alumnoActualizado,
                asistencias_count: asisN + asisA
            };
            setAlumno(actualizado);
            setFormData(actualizado);
        }
    };

    // Guardar todos los cambios (datos y foto)
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

            // 3. Actualizar datos del alumno en la tabla principal
            const { data, error } = await supabase
                .from('alumnos')
                .update({
                    nombres: formData.nombres,
                    apellidos: formData.apellidos,
                    fecha_nacimiento: formData.fecha_nacimiento === "" ? null : formData.fecha_nacimiento,
                    carnet_identidad: formData.carnet_identidad,
                    nombre_padre: formData.nombre_padre,
                    telefono_padre: formData.telefono_padre,
                    nombre_madre: formData.nombre_madre,
                    telefono_madre: formData.telefono_madre,
                    telefono_deportista: formData.telefono_deportista,
                    colegio: formData.colegio,
                    direccion: formData.direccion,
                    cancha_id: formData.cancha_id === "" ? null : formData.cancha_id,
                    horario_id: formData.horario_id === "" ? null : formData.horario_id,
                    profesor_asignado_id: formData.profesor_asignado_id === "" ? null : formData.profesor_asignado_id,
                    es_arquero: formData.es_arquero,
                    foto_url: fotoUrl
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('No se pudo actualizar el alumno. Es posible que las políticas de seguridad (RLS) impidan la modificación.');
            }

            // 4. Recargar los datos del alumno para reflejar los cambios
            await recargarAlumno(id);

            // Limpiar archivo de foto temporal
            setPhotoFile(null);

            addToast('¡Listo! Cambios guardados correctamente ✓', 'success');
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
        maestros: { canchas, horarios, entrenadores },

        setEditing,
        handleChange,
        setPhotoFile,
        saveChanges,
        cancelEditing,
        handleAprobar
    };
};
