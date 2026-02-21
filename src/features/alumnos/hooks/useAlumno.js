import { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabaseClient';
import { getCanchas, getHorarios } from '../../../services/maestros';

/**
 * Hook para manejar la lógica de detalle de un alumno
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

    // Estado del formulario de edición
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;

            try {
                // Cargar alumno
                const { data: alumnoData, error: alumnoError } = await supabase
                    .from('alumnos')
                    .select(`
                        *,
                        cancha:canchas(id, nombre),
                        horario:horarios(id, hora),
                        asistencias_normales(id),
                        asistencias_arqueros(id),
                        alumnos_entrenadores(entrenador_id, usuario:usuarios(nombres, apellidos))
                    `)
                    .eq('id', id)
                    .single();

                if (alumnoError) throw alumnoError;

                // Calcular totales
                const alumnoConTotales = {
                    ...alumnoData,
                    asistencias_count: (alumnoData.asistencias_normales?.length || 0) +
                        (alumnoData.asistencias_arqueros?.length || 0)
                };

                setAlumno(alumnoConTotales);
                setFormData(alumnoConTotales);

                // Cargar datos maestros
                const [canchasData, horariosData] = await Promise.all([
                    getCanchas(),
                    getHorarios()
                ]);
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));

            } catch (error) {
                console.error(error);
                addToast('Error al cargar datos del alumno', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, addToast]);

    // Manejo de cambios en inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Guardar cambios
    const saveChanges = async () => {
        setSaving(true);
        try {
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
                    es_arquero: formData.es_arquero
                })
                .eq('id', id);

            if (error) throw error;

            addToast('¡Listo! Cambios guardados correctamente ✓', 'success');
            setEditing(false);

            // Actualizar estado local para reflejar cambios sin recargar
            setAlumno(prev => ({ ...prev, ...formData }));

            return true;
        } catch (error) {
            console.error(error);
            addToast('No pudimos guardar los cambios. Intenta nuevamente.', 'error');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        setFormData(alumno);
        setEditing(false);
    };

    // Aprobar alumno
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
        maestros: { canchas, horarios },

        setEditing,
        handleChange,
        saveChanges,
        cancelEditing,
        handleAprobar
    };
};
