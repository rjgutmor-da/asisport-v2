import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Wind, Droplets, Scale, Ruler, Activity, Pencil, User } from 'lucide-react';
import BadgeAptitud from './BadgeAptitud';
import NuevaEvaluacionModal from './NuevaEvaluacionModal';

/**
 * Tarjeta individual de una evaluación médica en el timeline.
 * La más reciente se muestra expandida por defecto.
 */
const EvaluacionCard = ({ evaluacion, defaultExpanded = false, canManage, puedeEditar, onEditar }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [editando, setEditando] = useState(false);

    const fecha = new Date(evaluacion.fecha_evaluacion + 'T12:00:00');
    const fechaLabel = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    const nombreMedico = evaluacion.medico
        ? `${evaluacion.medico.nombres} ${evaluacion.medico.apellidos}`
        : 'Médico';
    const matricula = evaluacion.medico?.matricula_medica;

    // Calcular IMC si hay peso y talla
    const imc = evaluacion.peso_kg && evaluacion.talla_cm
        ? (evaluacion.peso_kg / Math.pow(evaluacion.talla_cm / 100, 2)).toFixed(1)
        : null;

    const signosVitales = [
        { icon: Heart, label: 'Presión arterial', value: evaluacion.presion_arterial ? `${evaluacion.presion_arterial} mmHg` : null },
        { icon: Activity, label: 'Frec. cardíaca', value: evaluacion.frecuencia_cardiaca ? `${evaluacion.frecuencia_cardiaca} lpm` : null },
        { icon: Wind, label: 'Frec. respiratoria', value: evaluacion.frecuencia_respiratoria ? `${evaluacion.frecuencia_respiratoria} rpm` : null },
        { icon: Droplets, label: 'Sat. oxígeno', value: evaluacion.saturacion_oxigeno ? `${evaluacion.saturacion_oxigeno}%` : null },
        { icon: Scale, label: 'Peso', value: evaluacion.peso_kg ? `${evaluacion.peso_kg} kg` : null },
        { icon: Ruler, label: 'Talla', value: evaluacion.talla_cm ? `${evaluacion.talla_cm} cm` : null },
    ];

    const estadoColor = {
        'Bueno': 'text-success',
        'Regular': 'text-warning',
        'Malo': 'text-error',
    }[evaluacion.estado_general] || 'text-text-secondary';

    const handleGuardarEdicion = async (data) => {
        await onEditar(evaluacion.id, data);
        setEditando(false);
    };

    return (
        <>
            <div className="bg-surface border border-border rounded-md overflow-hidden">
                {/* Cabecera de la evaluación (siempre visible) */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                >
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-white font-semibold text-sm">{fechaLabel}</span>
                        <BadgeAptitud aptitud={evaluacion.aptitud_deportiva} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="hidden sm:flex items-center gap-1.5 text-text-secondary text-xs">
                            <User size={12} />
                            <span>
                                {nombreMedico}
                                {matricula && ` · Mat. ${matricula}`}
                            </span>
                        </div>
                        {expanded
                            ? <ChevronUp size={16} className="text-text-secondary" />
                            : <ChevronDown size={16} className="text-text-secondary" />
                        }
                    </div>
                </button>

                {/* Médico en móvil */}
                {expanded && (
                    <div className="sm:hidden px-4 pb-2 flex items-center gap-1.5 text-text-secondary text-xs">
                        <User size={12} />
                        <span>
                            {nombreMedico}
                            {matricula && ` · Mat. ${matricula}`}
                        </span>
                    </div>
                )}

                {/* Cuerpo expandido */}
                {expanded && (
                    <div className="border-t border-border px-4 py-4 space-y-4">
                        {/* Grid signos vitales */}
                        {signosVitales.some(sv => sv.value) && (
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Signos Vitales</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {signosVitales.map(({ icon: Icon, label, value }) => value && (
                                        <div key={label} className="bg-background border border-border rounded p-2.5 flex items-start gap-2">
                                            <Icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-text-secondary text-xs">{label}</p>
                                                <p className="text-white text-sm font-semibold">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {/* IMC calculado */}
                                    {imc && (
                                        <div className="bg-background border border-border rounded p-2.5 flex items-start gap-2">
                                            <Activity size={14} className="text-info mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-text-secondary text-xs">IMC</p>
                                                <p className="text-white text-sm font-semibold">{imc}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Estado general */}
                        {evaluacion.estado_general && (
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1">Estado General</p>
                                <p className={`text-sm font-semibold ${estadoColor}`}>{evaluacion.estado_general}</p>
                            </div>
                        )}

                        {/* Examen físico */}
                        {evaluacion.examen_fisico && (
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1">Examen Físico</p>
                                <p className="text-white text-sm leading-relaxed">{evaluacion.examen_fisico}</p>
                            </div>
                        )}

                        {/* Observaciones */}
                        {evaluacion.observaciones && (
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1">Observaciones y Recomendaciones</p>
                                <p className="text-white text-sm leading-relaxed">{evaluacion.observaciones}</p>
                            </div>
                        )}

                        {/* Próxima revisión */}
                        {evaluacion.proxima_revision && (
                            <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded px-3 py-2">
                                <span className="text-warning text-xs font-semibold">📅 Próxima revisión:</span>
                                <span className="text-warning text-sm font-bold">
                                    {new Date(evaluacion.proxima_revision + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}

                        {/* Botón Editar (solo médico, solo hoy) */}
                        {canManage && puedeEditar(evaluacion) && (
                            <div className="pt-2 border-t border-border">
                                <button
                                    onClick={() => setEditando(true)}
                                    className="flex items-center gap-1.5 text-sm text-primary border border-primary/40 hover:bg-primary/10 px-3 py-1.5 rounded transition-colors"
                                >
                                    <Pencil size={14} />
                                    Editar evaluación de hoy
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de edición */}
            {editando && (
                <NuevaEvaluacionModal
                    titulo="Editar Evaluación"
                    initialData={evaluacion}
                    onGuardar={handleGuardarEdicion}
                    onCerrar={() => setEditando(false)}
                />
            )}
        </>
    );
};

export default EvaluacionCard;
