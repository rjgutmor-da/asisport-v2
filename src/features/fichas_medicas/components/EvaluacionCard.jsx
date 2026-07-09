import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Wind, Droplets, Scale, Ruler, Activity, Pencil, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import BadgeAptitud from './BadgeAptitud';
import NuevaEvaluacionModal from './NuevaEvaluacionModal';
import ExportarFichaMedica from './ExportarFichaMedica';

/**
 * Tarjeta individual de una evaluación médica en el timeline.
 * La más reciente se muestra expandida por defecto.
 */
const EvaluacionCard = ({ evaluacion, defaultExpanded = false, canManage, puedeEditar, onEditar, alumno, ficha }) => {
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
        { icon: Droplets, label: 'Sat. oxígeno (SpO₂)', value: evaluacion.saturacion_oxigeno ? `${evaluacion.saturacion_oxigeno}%` : null },
        { icon: Scale, label: 'Peso', value: evaluacion.peso_kg ? `${evaluacion.peso_kg} kg` : null },
        { icon: Ruler, label: 'Talla', value: evaluacion.talla_cm ? `${evaluacion.talla_cm} cm` : null },
    ];

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
                        <span className="text-text-secondary text-xs">Deporte: <strong className="text-white">{evaluacion.deporte || 'Fútbol'}</strong></span>
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
                    <div className="border-t border-border px-4 py-4 space-y-5">
                        
                        {/* Botón de exportación individual de PDF en el cuerpo */}
                        <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                            <span className="text-xs text-text-secondary font-medium">Revisión médica del {fechaLabel}</span>
                            <ExportarFichaMedica
                                alumno={alumno}
                                ficha={ficha}
                                evaluaciones={[evaluacion]}
                            />
                        </div>

                        {/* 1. Signos vitales */}
                        {signosVitales.some(sv => sv.value) && (
                            <div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 text-primary">1. Signos Vitales y Antropometría</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {signosVitales.map(({ icon: Icon, label, value }) => value && (
                                        <div key={label} className="bg-background border border-border rounded p-2.5 flex items-start gap-2">
                                            <Icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-text-secondary text-[10px]">{label}</p>
                                                <p className="text-white text-sm font-semibold">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {imc && (
                                        <div className="bg-background border border-border rounded p-2.5 flex items-start gap-2">
                                            <Activity size={14} className="text-info mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-text-secondary text-[10px]">IMC</p>
                                                <p className="text-white text-sm font-semibold">{imc}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {evaluacion.pulsos_perifericos && (
                                    <div className="mt-2 text-xs flex gap-1.5 items-center bg-background border border-border px-3 py-1.5 rounded w-fit">
                                        <span className="text-text-secondary font-medium">Pulsos periféricos:</span>
                                        <span className={evaluacion.pulsos_perifericos.includes('presentes') ? 'text-success font-semibold' : 'text-error font-bold'}>
                                            {evaluacion.pulsos_perifericos}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Exploración física por sistemas */}
                        <div>
                            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 text-primary">2. Exploración Física por Sistemas</p>
                            <div className="space-y-2 bg-background border border-border p-3 rounded-md text-xs">
                                {/* Cardiovascular */}
                                {evaluacion.eval_cardiovascular && (
                                    <div className="border-b border-border/30 pb-2">
                                        <p className="text-white font-bold mb-1">Cardiovascular:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-text-secondary pl-1">
                                            <li>Auscultación decúbito supino: <span className="text-white font-medium">{evaluacion.eval_cardiovascular.auscultacion_supino || 'Normal'}</span></li>
                                            <li>Auscultación bipedestación: <span className="text-white font-medium">{evaluacion.eval_cardiovascular.auscultacion_bipedestacion || 'Normal'}</span></li>
                                            <li>Soplos detectados: <span className={evaluacion.eval_cardiovascular.soplos ? 'text-error font-bold' : 'text-success font-semibold'}>{evaluacion.eval_cardiovascular.soplos ? 'Sí' : 'No'}</span></li>
                                            {evaluacion.eval_cardiovascular.observaciones && <li>Observaciones: <span className="text-white">{evaluacion.eval_cardiovascular.observaciones}</span></li>}
                                        </ul>
                                    </div>
                                )}
                                {/* Respiratorio */}
                                {evaluacion.eval_respiratorio && (
                                    <div className="border-b border-border/30 py-2">
                                        <p className="text-white font-bold mb-1">Respiratorio:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-text-secondary pl-1">
                                            <li>Auscultación pulmonar: <span className="text-white font-medium">{evaluacion.eval_respiratorio.auscultacion || 'Normal'}</span></li>
                                            {evaluacion.eval_respiratorio.hallazgos && <li>Hallazgos: <span className="text-white">{evaluacion.eval_respiratorio.hallazgos}</span></li>}
                                        </ul>
                                    </div>
                                )}
                                {/* Músculo-esquelético */}
                                {evaluacion.eval_musculoesqueletico && (
                                    <div className="pt-2">
                                        <p className="text-white font-bold mb-1">Músculo-esquelético y Articular:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-text-secondary pl-1">
                                            <li>Estabilidad ligamentosa: <span className="text-white font-medium">{evaluacion.eval_musculoesqueletico.estabilidad_ligamentosa || 'Normal'}</span></li>
                                            <li>Test de Adams: <span className="text-white font-medium">{evaluacion.eval_musculoesqueletico.test_adams || 'Normal'}</span></li>
                                            <li>Tibial anterior (Osgood-Schlatter): <span className="text-white font-medium">{evaluacion.eval_musculoesqueletico.osgood_schlatter || 'Negativo'}</span></li>
                                            {evaluacion.eval_musculoesqueletico.observaciones && <li>Observaciones: <span className="text-white">{evaluacion.eval_musculoesqueletico.observaciones}</span></li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Evaluación funcional */}
                        {evaluacion.eval_funcional && (
                            <div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 text-primary">3. Mapeo Funcional y Biomecánica</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-background border border-border p-2.5 rounded">
                                        <span className="text-text-secondary block mb-0.5">Marcha:</span>
                                        <span className={`font-semibold ${evaluacion.eval_funcional.marcha === 'Normal' ? 'text-success' : 'text-error'}`}>{evaluacion.eval_funcional.marcha}</span>
                                    </div>
                                    <div className="bg-background border border-border p-2.5 rounded">
                                        <span className="text-text-secondary block mb-0.5">Equilibrio:</span>
                                        <span className={`font-semibold ${evaluacion.eval_funcional.equilibrio === 'Adecuado' ? 'text-success' : 'text-error'}`}>{evaluacion.eval_funcional.equilibrio}</span>
                                    </div>
                                    <div className="bg-background border border-border p-2.5 rounded">
                                        <span className="text-text-secondary block mb-0.5">Fuerza general:</span>
                                        <span className={`font-semibold ${evaluacion.eval_funcional.fuerza === 'Adecuada' ? 'text-success' : 'text-error'}`}>{evaluacion.eval_funcional.fuerza}</span>
                                    </div>
                                    <div className="bg-background border border-border p-2.5 rounded">
                                        <span className="text-text-secondary block mb-0.5">Dolor al movimiento:</span>
                                        <span className={`font-semibold ${evaluacion.eval_funcional.dolor_movimiento ? 'text-warning font-bold' : 'text-success'}`}>
                                            {evaluacion.eval_funcional.dolor_movimiento ? `Sí (en ${evaluacion.eval_funcional.dolor_zona || 'zona no especificada'})` : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Restricciones si es Apto con restricciones */}
                        {evaluacion.aptitud_deportiva === 'Apto con restricciones' && evaluacion.restricciones_aptitud && (
                            <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded p-3">
                                <ShieldAlert size={16} className="text-warning mt-0.5 flex-shrink-0" />
                                <div className="text-xs">
                                    <p className="text-warning font-bold uppercase tracking-wider">Restricciones / Condiciones médicas:</p>
                                    <p className="text-white mt-1 leading-relaxed">{evaluacion.restricciones_aptitud}</p>
                                </div>
                            </div>
                        )}

                        {/* Observaciones generales */}
                        {evaluacion.observaciones && (
                            <div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1 text-primary">Observaciones y Recomendaciones</p>
                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{evaluacion.observaciones}</p>
                            </div>
                        )}

                        {/* Próxima revisión */}
                        {evaluacion.proxima_revision && (
                            <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded px-3 py-2 text-xs">
                                <span className="text-warning font-semibold">📅 Próxima revisión recomendada:</span>
                                <span className="text-warning font-bold">
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
