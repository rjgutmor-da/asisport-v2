import { useState, useEffect, useCallback } from 'react';
import {
    getFichaMedica,
    upsertFichaMedica,
    getEvaluaciones,
    createEvaluacion,
    updateEvaluacion,
    isFichaMedicaHabilitada,
} from '../services/fichas_medicas';

/**
 * Hook que gestiona el estado y las operaciones de la Ficha Médica de un alumno.
 * @param {string} alumnoId - ID del alumno
 */
export const useFichaMedica = (alumnoId) => {
    const [ficha, setFicha] = useState(null);
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [moduloHabilitado, setModuloHabilitado] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fecha de hoy en formato ISO (YYYY-MM-DD) para comparar con evaluaciones
    const hoy = new Date().toISOString().split('T')[0];

    // Determina si una evaluación puede editarse (solo si es de hoy)
    const puedeEditar = useCallback((evaluacion) => {
        return evaluacion?.fecha_evaluacion === hoy;
    }, [hoy]);

    const cargarDatos = useCallback(async () => {
        if (!alumnoId) return;
        setLoading(true);
        setError(null);
        try {
            const [habilitado, fichaData, evaluacionesData] = await Promise.all([
                isFichaMedicaHabilitada(),
                getFichaMedica(alumnoId),
                getEvaluaciones(alumnoId),
            ]);
            setModuloHabilitado(habilitado);
            setFicha(fichaData);
            setEvaluaciones(evaluacionesData);
        } catch (err) {
            setError(err.message || 'Error al cargar la ficha médica.');
        } finally {
            setLoading(false);
        }
    }, [alumnoId]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    /**
     * Guarda (crea o actualiza) los antecedentes médicos.
     */
    const guardarFicha = useCallback(async (fichaData) => {
        setSaving(true);
        try {
            const saved = await upsertFichaMedica({ ...fichaData, alumno_id: alumnoId });
            setFicha(saved);
            return saved;
        } finally {
            setSaving(false);
        }
    }, [alumnoId]);

    /**
     * Crea una nueva evaluación periódica.
     */
    const agregarEvaluacion = useCallback(async (evalData) => {
        setSaving(true);
        try {
            const nueva = await createEvaluacion({ ...evalData, alumno_id: alumnoId });
            await cargarDatos(); // Recargar para obtener datos del médico en el join
            return nueva;
        } finally {
            setSaving(false);
        }
    }, [alumnoId, cargarDatos]);

    /**
     * Actualiza una evaluación existente (solo si es del día de hoy).
     */
    const editarEvaluacion = useCallback(async (evaluacionId, evalData) => {
        setSaving(true);
        try {
            await updateEvaluacion(evaluacionId, evalData);
            await cargarDatos();
        } finally {
            setSaving(false);
        }
    }, [cargarDatos]);

    return {
        ficha,
        evaluaciones,
        moduloHabilitado,
        loading,
        saving,
        error,
        hoy,
        puedeEditar,
        guardarFicha,
        agregarEvaluacion,
        editarEvaluacion,
        recargar: cargarDatos,
    };
};
