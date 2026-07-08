import React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useFichaMedica } from '../hooks/useFichaMedica';
import AntecedentesCard from './AntecedentesCard';
import EvaluacionesTimeline from './EvaluacionesTimeline';
import ExportarFichaMedica from './ExportarFichaMedica';

/**
 * Contenedor principal del módulo Ficha Médica.
 * Se renderiza dentro del DetalleAlumno.
 *
 * @param {string} alumnoId - ID del alumno
 * @param {object} alumno   - Datos del alumno (para exportación y contexto)
 * @param {boolean} canManage - Si el usuario tiene permiso medica.manage (solo Médico)
 * @param {boolean} canView   - Si el usuario tiene permiso medica.view
 */
const FichaMedica = ({ alumnoId, alumno, canManage, canView }) => {
    const {
        ficha,
        evaluaciones,
        moduloHabilitado,
        loading,
        saving,
        error,
        puedeEditar,
        guardarFicha,
        agregarEvaluacion,
        editarEvaluacion,
    } = useFichaMedica(alumnoId);

    if (!canView) return null;

    if (loading) {
        return (
            <div className="bg-surface border border-border rounded-md p-8 flex items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-text-secondary text-sm">Cargando ficha médica...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface border border-error/30 rounded-md p-5">
                <p className="text-error text-sm">⚠ Error al cargar la ficha médica: {error}</p>
            </div>
        );
    }

    if (!moduloHabilitado) {
        return (
            <div className="bg-surface border border-border rounded-md p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center flex-shrink-0">
                    <Lock size={18} className="text-text-secondary" />
                </div>
                <div>
                    <p className="text-white font-semibold text-sm">Módulo Ficha Médica no disponible</p>
                    <p className="text-text-secondary text-xs mt-0.5">
                        Este módulo no está habilitado para tu escuela. Contacta al administrador del sistema para activarlo.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Encabezado de sección */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-2 flex-grow">
                    Ficha Médica
                </h3>
                {evaluaciones.length > 0 && (
                    <ExportarFichaMedica
                        alumno={alumno}
                        ficha={ficha}
                        evaluaciones={evaluaciones}
                        canManage={canManage}
                    />
                )}
            </div>

            {/* Antecedentes estáticos */}
            <AntecedentesCard
                ficha={ficha}
                canManage={canManage}
                onSave={guardarFicha}
                saving={saving}
            />

            {/* Historial de evaluaciones */}
            <EvaluacionesTimeline
                evaluaciones={evaluaciones}
                canManage={canManage}
                puedeEditar={puedeEditar}
                onAgregar={agregarEvaluacion}
                onEditar={editarEvaluacion}
                saving={saving}
            />
        </div>
    );
};

export default FichaMedica;
