import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';
import { getSucursales } from '../../../services/sucursales';
import { createAlumno, checkPosiblesDuplicados } from '../../../services/alumnos';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/useMasterData';
/**
 * Hook para manejar la lógica de registro de alumnos
 */
export const useRegistroAlumno = (onSuccess) => {
    const { addToast } = useToast();
    const { user, userProfile, isCoach } = useAuth();
    const queryClient = useQueryClient();

    // Estados de carga
    const [loadingMaestros, setLoadingMaestros] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Datos maestros
    const [canchas, setCanchas] = useState([]); // Todas las canchas (con sucursal_id)
    const [canchasRaw, setCanchasRaw] = useState([]); // Datos crudos para el filtro
    const [horarios, setHorarios] = useState([]);
    // entrenadores: lista completa con sucursal_id incluido para poder filtrar
    const [entrenadores, setEntrenadores] = useState([]);
    const [sucursales, setSucursales] = useState([]);

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
        whatsapp_preferido: 'padre',
        colegio: '',
        direccion: '',
        cancha_id: '',
        horario_id: '',
        profesor_asignado_id: '',
        sucursal_id: '',
        es_arquero: false
    });

    const [photoFile, setPhotoFile] = useState(null);
    const [errors, setErrors] = useState({});

    // Cargar datos maestros al iniciar
    useEffect(() => {
        const loadMaestros = async () => {
            try {
                const [canchasData, horariosData, entrenadoresData, sucursalesData] = await Promise.all([
                    getCanchas(),
                    getHorarios(),
                    getEntrenadores(),
                    getSucursales()
                ]);
                // Guardamos los datos crudos para poder filtrar por sucursal_id
                setCanchasRaw(canchasData);
                setCanchas(canchasData.map(c => ({ value: c.id, label: c.nombre, sucursal_id: c.sucursal_id })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
                // Se conserva sucursal_id en cada entrenador para utilizarlo en el filtro por sucursal
                setEntrenadores(entrenadoresData.map(e => ({
                    value: e.id,
                    label: `${e.nombres} ${e.apellidos}`,
                    sucursal_id: e.sucursal_id
                })));
                setSucursales(sucursalesData.map(s => ({ value: s.id, label: s.nombre })));

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

    /**
     * Canchas filtradas según sucursal seleccionada.
     * Si no hay sucursal seleccionada, se muestran todas.
     */
    const canchasFiltradas = useMemo(() => {
        if (!formData.sucursal_id) return canchas;
        return canchas.filter(c => c.sucursal_id === formData.sucursal_id);
    }, [formData.sucursal_id, canchas]);

    /**
     * Entrenadores filtrados según la sucursal seleccionada.
     * Un entrenador sin sucursal asignada (sucursal_id === null) se muestra siempre,
     * ya que se considera disponible para todas las sucursales.
     * Si no hay sucursal seleccionada en el formulario, se muestran todos.
     */
    const entrenadorFiltrados = useMemo(() => {
        if (!formData.sucursal_id) return entrenadores;
        return entrenadores.filter(
            e => !e.sucursal_id || e.sucursal_id === formData.sucursal_id
        );
    }, [formData.sucursal_id, entrenadores]);

    // Manejo de cambios en inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Restricción: Carnet de Identidad solo números
        if (name === 'carnet_identidad') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else if (name === 'sucursal_id') {
            // Al cambiar la sucursal, limpiar cancha y profesor para que el usuario reelija
            setFormData(prev => ({
                ...prev,
                sucursal_id: value,
                cancha_id: '',
                // Solo limpiar el profesor si el usuario actual no es Coach (en ese caso ya está auto-asignado)
                ...(!isCoach && { profesor_asignado_id: '' })
            }));
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

        // Validación Representante Legal: solo el nombre es obligatorio, el teléfono es opcional
        const tieneNombrePadre = formData.nombre_padre && formData.nombre_padre.trim();
        const tieneNombreMadre = formData.nombre_madre && formData.nombre_madre.trim();

        if (!tieneNombrePadre && !tieneNombreMadre) {
            newErrors.representante = 'Debe registrar al menos un representante legal (Padre o Madre con su nombre).';
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
            // Validación de posibles duplicados
            const duplicados = await checkPosiblesDuplicados(
                formData.nombres,
                formData.apellidos,
                formData.fecha_nacimiento
            );

            if (duplicados.length > 0) {
                const nombresDuplicados = duplicados.map(d => `${d.nombres} ${d.apellidos}`).join(', ');
                const confirmar = window.confirm(
                    `⚠️ Posible alumno duplicado detectado.\n\nYa existe(n) un alumno(s) en la escuela con nombre o apellido similar y la misma fecha de nacimiento:\n- ${nombresDuplicados}\n\n¿Estás seguro de que deseas registrar este alumno?`
                );

                if (!confirmar) {
                    setSubmitting(false);
                    return; // El usuario canceló el registro
                }
            }

            const newAlumno = await createAlumno(formData, photoFile);
            queryClient.invalidateQueries({ queryKey: queryKeys.alumnos });
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
        maestros: { canchas: canchasFiltradas, horarios, entrenadores: entrenadorFiltrados, sucursales },

        handleChange,
        setPhotoFile,
        handleSubmit
    };
};
