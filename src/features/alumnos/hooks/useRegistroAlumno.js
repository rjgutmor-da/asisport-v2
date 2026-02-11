import { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';
import { createAlumno } from '../../../services/alumnos';

/**
 * Hook para manejar la lógica de registro de alumnos
 */
export const useRegistroAlumno = (onSuccess) => {
    const { addToast } = useToast();
    const { user, userProfile, isCoach } = useAuth();

    // Estados de carga
    const [loadingMaestros, setLoadingMaestros] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Datos maestros
    const [canchas, setCanchas] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        carnet_identidad: '',
        nombre_padre: '',
        telefono_padre: '',
        nombre_madre: '',
        telefono_madre: '',
        telefono_deportista: '',
        colegio: '',
        direccion: '',
        cancha_id: '',
        horario_id: '',
        profesor_asignado_id: '',
        es_arquero: false
    });

    const [photoFile, setPhotoFile] = useState(null);
    const [errors, setErrors] = useState({});

    // Cargar datos maestros al iniciar
    useEffect(() => {
        const loadMaestros = async () => {
            try {
                const [canchasData, horariosData, entrenadoresData] = await Promise.all([
                    getCanchas(),
                    getHorarios(),
                    getEntrenadores()
                ]);
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
                setEntrenadores(entrenadoresData.map(e => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })));

                // Si el usuario es Entrenador, auto-asignar como profesor
                if (isCoach && userProfile?.id) {
                    setFormData(prev => ({ ...prev, profesor_asignado_id: userProfile.id }));
                }
            } catch (error) {
                console.error(error);
                addToast('Error al cargar datos maestros', 'error');
            } finally {
                setLoadingMaestros(false);
            }
        };
        loadMaestros();
    }, [addToast, isCoach, userProfile]);

    // Manejo de cambios en inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Restricción: Carnet de Identidad solo números
        if (name === 'carnet_identidad') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Limpiar error del campo modificado
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Validación del formulario
    const validateForm = () => {
        const newErrors = {};

        // Campos obligatorios simples
        if (!formData.nombres.trim()) newErrors.nombres = 'Por favor, completa el nombre del alumno';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Por favor, completa los apellidos';
        if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'Fecha de nacimiento es requerida';
        if (!formData.cancha_id) newErrors.cancha_id = 'Selecciona una cancha';
        if (!formData.horario_id) newErrors.horario_id = 'Selecciona un horario';
        if (!formData.profesor_asignado_id) newErrors.profesor_asignado_id = 'Selecciona un profesor asignado';

        // Validación Representante Legal (Regla #8)
        const padreCompleto = formData.nombre_padre && formData.telefono_padre;
        const madreCompleto = formData.nombre_madre && formData.telefono_madre;

        if (!padreCompleto && !madreCompleto) {
            newErrors.representante = 'Debe registrar al menos un representante legal completo (Padre o Madre con nombre y teléfono).';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            addToast('Por favor, corrige los errores en el formulario', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const newAlumno = await createAlumno(formData, photoFile);
            if (onSuccess) onSuccess(newAlumno);
        } catch (error) {
            console.error(error);
            addToast(error.message || 'No pudimos guardar. Intenta nuevamente.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        loadingMaestros,
        submitting,
        formData,
        errors,
        photoFile,
        maestros: { canchas, horarios, entrenadores },

        handleChange,
        setPhotoFile,
        handleSubmit
    };
};
