import React, { useState } from 'react';
import { Loader2, Lock, ChevronRight, ClipboardList } from 'lucide-react';
import { useFichaMedica } from '../hooks/useFichaMedica';
import BadgeAptitud from './BadgeAptitud';

/**
 * Componente que muestra la vista simplificada de la ficha médica para los entrenadores.
 * Solo muestra si el alumno es Apto, No apto o Apto con restricciones, junto con las recomendaciones del doctor.
 */
const FichaMedicaEntrenador = ({ alumnoId }) => {
    const {
        evaluaciones,
        moduloHabilitado,
        loading,
        error
    } = useFichaMedica(alumnoId);

    // Estado para controlar si la sección está expandida o contraída
    const [expandido, setExpandido] = useState(() => {
        try {
            const guardado = localStorage.getItem('asisport_ficha_medica_entrenador_expandido');
            return guardado !== null ? JSON.parse(guardado) : true;
        } catch (e) {
            return true;
        }
    });

    const toggleExpandido = () => {
        setExpandido(prev => {
            const nuevoEstado = !prev;
            try {
                localStorage.setItem('asisport_ficha_medica_entrenador_expandido', JSON.stringify(nuevoEstado));
            } catch (e) {
                // Silencioso en caso de error
            }
            return nuevoEstado;
        });
    };

    if (loading) {
        return (
            <div className="bg-surface border border-border rounded-md p-8 flex items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-text-secondary text-sm">Cargando información médica...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface border border-error/30 rounded-md p-5">
                <p className="text-error text-sm">⚠ Error al cargar la información médica: {error}</p>
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
                        Este módulo no está habilitado para tu escuela.
                    </p>
                </div>
            </div>
        );
    }

    const ultimaEval = evaluaciones && evaluaciones.length > 0 ? evaluaciones[0] : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
                <button
                    onClick={toggleExpandido}
                    className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80 transition-colors text-left focus:outline-none select-none"
                    aria-expanded={expandido}
                >
                    <ChevronRight
                        size={20}
                        className={`text-primary transition-transform duration-200 ${
                            expandido ? 'rotate-90' : 'rotate-0'
                        }`}
                    />
                    <span>Ficha Médica</span>
                </button>
            </div>

            {expandido && (
                <div className="bg-surface border border-border rounded-md p-5 space-y-4">
                    {!ultimaEval ? (
                        <div className="flex flex-col items-center py-6 gap-2">
                            <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center">
                                <ClipboardList size={20} className="text-text-secondary" />
                            </div>
                            <p className="text-text-secondary text-sm text-center">
                                No hay evaluaciones médicas registradas para este alumno.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Estado de Aptitud */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                                <div>
                                    <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
                                        Estado de Aptitud Deportiva
                                    </p>
                                    <BadgeAptitud aptitud={ultimaEval.aptitud_deportiva} />
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-text-secondary text-xs">Última revisión</p>
                                    <p className="text-white text-xs font-semibold">
                                        {new Date(ultimaEval.fecha_evaluacion + 'T12:00:00').toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Recomendaciones y Restricciones */}
                            <div className="space-y-3">
                                {ultimaEval.aptitud_deportiva === 'Apto con restricciones' && ultimaEval.restricciones_aptitud && (
                                    <div className="bg-warning/10 border border-warning/20 rounded p-3 text-xs">
                                        <p className="text-warning font-bold uppercase tracking-wider">
                                            Restricciones y Condiciones Médicas:
                                        </p>
                                        <p className="text-white mt-1 leading-relaxed">
                                            {ultimaEval.restricciones_aptitud}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1 text-primary">
                                        Observaciones y Recomendaciones del Médico
                                    </p>
                                    {ultimaEval.observaciones ? (
                                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                            {ultimaEval.observaciones}
                                        </p>
                                    ) : (
                                        <p className="text-text-secondary text-sm italic">
                                            Sin observaciones o recomendaciones registradas.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FichaMedicaEntrenador;
