import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { getCanchas, getHorarios, getEntrenadores } from '../../../services/maestros';
import { getSucursales } from '../../../services/sucursales';
import { createAlumno, obtenerAdvertenciaDuplicadoDesdeError } from '../../../services/alumnos';
import { useAlumnoDuplicado } from './useAlumnoDuplicado';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/useMasterData';
/**
 * Hook para manejar la lógica de registro de alumnos
 */
export const useRegistroAlumno = (onSuccess) => {
    const { addToast } = useToast();
    const { userProfile, role } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();

    // Estados de carga
    const [loadingMaestros, setLoadingMaestros] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Datos maestros
    const [canchas, setCanchas] = useState([]); // Todas las canchas (con sucursal_id)
    const [canchasRaw, setCanchasRaw] = useState([]); // Datos crudos para el filtro
    const [horarios, setHorarios] = useState([]);
    // El entrenador se muestra según la configuración del grupo.
    const [entrenadores, setEntrenadores] = useState([]);
    const [sucursales, setSucursales] = useState([]);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: location.state?.apellidos || '',
        fecha_nacimiento: '',
        carnet_identidad: '',
        nombre_padre: location.state?.nombre_padre || '',
        telefono_padre: location.state?.telefono_padre || '',
        nombre_madre: location.state?.nombre_madre || '',
        telefono_madre: location.state?.telefono_madre || '',
        whatsapp_preferido: location.state?.whatsapp_preferido || 'padre',
        colegio: location.state?.colegio || '',
        direccion: location.state?.direccion || '',
        cancha_id: '',
        horario_id: '',
        profesor_asignado_id: '',
        sucursal_id: '',
        es_arquero: false,
        tipo: 'Formativo',
        mensualidad: '',
        observaciones: ''
    });

    const [photoFile, setPhotoFile] = useState(null);
    const [errors, setErrors] = useState({});

    const {
        advertenciaDuplicado,
        errorVerificacionDuplicado,
        verificandoDuplicado,
        verificarAhora: verificarDuplicadoAhora,
        mostrarAdvertenciaDesdeResultado
    } = useAlumnoDuplicado({
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        carnetIdentidad: formData.carnet_identidad
    });

    // Cargar datos maestros al iniciar
    useEffect(() => {
        const loadMaestros = async () => {
            try {
                const [canchasData, horariosData, entrenadoresData, sucursalesData] = await Promise.all([
                    getCanchas({ fresh: true }),
                    getHorarios(),
                    getEntrenadores(),
                    getSucursales()
                ]);
                // Guardamos los datos crudos para poder filtrar por sucursal_id
                setCanchasRaw(canchasData);
                setCanchas(canchasData.map(c => ({
                    value: c.id,
                    label: c.nombre,
                    sucursal_id: c.sucursal_id,
                    entrenador_id: c.entrenador_id,
                    entrenador_nombre: c.entrenador_nombre,
                    horario_hora: c.horario_hora
                })));
                setHorarios(horariosData.map(h => ({ value: h.id, label: h.hora })));
                // La lista completa permite mostrar profesores de grupos de varias sucursales.
                setEntrenadores(entrenadoresData.map(e => ({
                    value: e.id,
                    label: `${e.nombres} ${e.apellidos}`,
                    sucursal_id: e.sucursal_id
                })));
                setSucursales(sucursalesData.map(s => ({ value: s.id, label: s.nombre })));

                // La sucursal inicial proviene del perfil; el profesor proviene del grupo.
                const isAnyCoach = role === 'Entrenador' || role === 'Entrenarqueros';
                if (isAnyCoach && userProfile) {
                    setFormData(prev => ({
                        ...prev,
                        sucursal_id: userProfile.sucursal_id || ''
                    }));
                }
            } catch (error) {
                console.error(error);
                addToast('Error al cargar datos maestros', 'error');
            } finally {
                setLoadingMaestros(false);
            }
        };
        loadMaestros();
    }, [addToast, role, userProfile]);

    /**
     * Horario del grupo seleccionado, mostrado solo como referencia.
     */
    const horariosFiltrados = useMemo(() => {
        if (!formData.cancha_id) return [];
        const canchaSeleccionada = canchasRaw.find(c => String(c.id) === String(formData.cancha_id));
        if (!canchaSeleccionada || !canchaSeleccionada.horario_ids || canchaSeleccionada.horario_ids.length === 0) {
            return [];
        }
        return horarios.filter(h => canchaSeleccionada.horario_ids.includes(h.value));
    }, [formData.cancha_id, canchasRaw, horarios]);

    // Manejo de cambios en inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'horario_id' || name === 'profesor_asignado_id') return;

        // Restricción: Carnet de Identidad solo números
        if (name === 'carnet_identidad') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else if (name === 'cancha_id') {
            const canchaSeleccionada = canchasRaw.find(c => String(c.id) === String(value));
            setFormData(prev => ({
                ...prev,
                cancha_id: value,
                horario_id: canchaSeleccionada?.horario_ids?.[0] || '',
                profesor_asignado_id: canchaSeleccionada?.entrenador_id || ''
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
        if (!formData.sucursal_id) newErrors.sucursal_id = 'Selecciona una sucursal';

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
            const nombresNormalizados = formData.nombres.trim().replace(/\s+/g, ' ');
            const apellidosNormalizados = formData.apellidos.trim().replace(/\s+/g, ' ');

            const resultadoDuplicado = await verificarDuplicadoAhora();
            if (resultadoDuplicado.duplicado) {
                addToast(
                    resultadoDuplicado.archivado
                        ? 'Este alumno tiene un registro archivado.'
                        : 'Este alumno ya está registrado.',
                    'error'
                );
                return;
            }

            const cleanFormData = {
                ...formData,
                nombres: nombresNormalizados,
                apellidos: apellidosNormalizados,
                mensualidad: formData.mensualidad === '' ? null : Number(formData.mensualidad),
                observaciones: formData.observaciones?.trim() || null
            };

            const newAlumno = await createAlumno(cleanFormData, photoFile);
            queryClient.invalidateQueries({ queryKey: queryKeys.alumnos });
            if (onSuccess) onSuccess(newAlumno);
        } catch (error) {
            console.error(error);
            const advertencia = obtenerAdvertenciaDuplicadoDesdeError(error);
            if (advertencia) {
                mostrarAdvertenciaDesdeResultado(advertencia);
            }
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
        advertenciaDuplicado,
        errorVerificacionDuplicado,
        verificandoDuplicado,
        maestros: { canchas, horarios: horariosFiltrados, entrenadores, sucursales },

        handleChange,
        setPhotoFile,
        handleSubmit
    };
};
