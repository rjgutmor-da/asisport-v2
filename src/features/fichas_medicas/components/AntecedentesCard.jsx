import React, { useState, useEffect } from 'react';
import { ShieldAlert, Edit2, Save, X, Heart, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { getEscuelaActual } from '../../../services/escuelas';

/**
 * Tarjeta de Antecedentes Médicos (datos estáticos del alumno).
 * El Médico puede editar; otros roles ven en modo lectura.
 */
const AntecedentesCard = ({ ficha, canManage, onSave, saving }) => {
    const { addToast } = useToast();
    const [editing, setEditing] = useState(false);
    const [escuelaNombre, setEscuelaNombre] = useState('');
    const [form, setForm] = useState({
        antecedentes_personales: ficha?.antecedentes_personales || '',
        alergias: ficha?.alergias || '',
        cirugias_previas: ficha?.cirugias_previas || '',
        club_anterior: ficha?.club_anterior || '',
        antecedentes_familiares: ficha?.antecedentes_familiares || { tiene: false, detalle: '' },
        sintomas_esfuerzo: ficha?.sintomas_esfuerzo || { palpitaciones: false, dolor_pecho: false, sincope: false, disnea: false, detalle: '' },
        trauma_craneal: ficha?.trauma_craneal || { tiene: false, detalle: '' },
    });

    // Cargar el nombre de la escuela actual al montar el componente
    useEffect(() => {
        getEscuelaActual()
            .then(esc => {
                if (esc) setEscuelaNombre(esc.nombre);
            })
            .catch(console.error);
    }, []);

    // Sincronizar si cambia la ficha desde afuera
    useEffect(() => {
        if (!editing) {
            setForm({
                antecedentes_personales: ficha?.antecedentes_personales || '',
                alergias: ficha?.alergias || '',
                cirugias_previas: ficha?.cirugias_previas || '',
                club_anterior: ficha?.club_anterior || '',
                antecedentes_familiares: ficha?.antecedentes_familiares || { tiene: false, detalle: '' },
                sintomas_esfuerzo: ficha?.sintomas_esfuerzo || { palpitaciones: false, dolor_pecho: false, sincope: false, disnea: false, detalle: '' },
                trauma_craneal: ficha?.trauma_craneal || { tiene: false, detalle: '' },
            });
        }
    }, [ficha, editing]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleFamiliares = (tiene) => {
        setForm(prev => ({
            ...prev,
            antecedentes_familiares: { ...prev.antecedentes_familiares, tiene, detalle: tiene ? prev.antecedentes_familiares.detalle : '' }
        }));
    };

    const handleFamiliaresDetalle = (detalle) => {
        setForm(prev => ({
            ...prev,
            antecedentes_familiares: { ...prev.antecedentes_familiares, detalle }
        }));
    };

    const handleToggleTrauma = (tiene) => {
        setForm(prev => ({
            ...prev,
            trauma_craneal: { ...prev.trauma_craneal, tiene, detalle: tiene ? prev.trauma_craneal.detalle : '' }
        }));
    };

    const handleTraumaDetalle = (detalle) => {
        setForm(prev => ({
            ...prev,
            trauma_craneal: { ...prev.trauma_craneal, detalle }
        }));
    };

    const handleSintomaChange = (key, val) => {
        setForm(prev => ({
            ...prev,
            sintomas_esfuerzo: { ...prev.sintomas_esfuerzo, [key]: val }
        }));
    };

    const handleSintomasDetalle = (detalle) => {
        setForm(prev => ({
            ...prev,
            sintomas_esfuerzo: { ...prev.sintomas_esfuerzo, detalle }
        }));
    };

    const handleEdit = () => {
        setForm(prev => ({
            ...prev,
            club_anterior: prev.club_anterior || escuelaNombre || ''
        }));
        setEditing(true);
    };

    const handleSave = async () => {
        try {
            await onSave(form);
            addToast('Antecedentes guardados correctamente', 'success');
            setEditing(false);
        } catch (err) {
            addToast(err.message || 'Error al guardar antecedentes', 'error');
        }
    };

    const handleCancel = () => {
        setForm({
            antecedentes_personales: ficha?.antecedentes_personales || '',
            alergias: ficha?.alergias || '',
            cirugias_previas: ficha?.cirugias_previas || '',
            club_anterior: ficha?.club_anterior || '',
            antecedentes_familiares: ficha?.antecedentes_familiares || { tiene: false, detalle: '' },
            sintomas_esfuerzo: ficha?.sintomas_esfuerzo || { palpitaciones: false, dolor_pecho: false, sincope: false, disnea: false, detalle: '' },
            trauma_craneal: ficha?.trauma_craneal || { tiene: false, detalle: '' },
        });
        setEditing(false);
    };

    const sinDatos = !ficha?.antecedentes_personales &&
                     !ficha?.alergias &&
                     !ficha?.cirugias_previas &&
                     !ficha?.club_anterior &&
                     !ficha?.antecedentes_familiares?.tiene &&
                     !ficha?.sintomas_esfuerzo?.palpitaciones &&
                     !ficha?.sintomas_esfuerzo?.dolor_pecho &&
                     !ficha?.sintomas_esfuerzo?.sincope &&
                     !ficha?.sintomas_esfuerzo?.disnea &&
                     !ficha?.sintomas_esfuerzo?.detalle &&
                     !ficha?.trauma_craneal?.tiene;

    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            {/* Encabezado */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
                        <ShieldAlert size={18} className="text-primary" />
                    </div>
                    <h3 className="text-white font-semibold text-base">Antecedentes Médicos</h3>
                </div>

                {canManage && !editing && (
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-orange-400 transition-colors font-medium"
                    >
                        <Edit2 size={15} />
                        Editar
                    </button>
                )}

                {editing && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors px-3 py-1.5 border border-border rounded"
                        >
                            <X size={14} />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            <Save size={14} />
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="divide-y divide-border">
                {sinDatos && !editing ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-text-secondary text-sm">
                            {canManage
                                ? 'No hay antecedentes registrados. Haz clic en "Editar" para ingresar la información.'
                                : 'No hay antecedentes médicos registrados para este alumno.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Club / equipo anterior */}
                        <div className="px-5 py-3.5">
                            <p className="text-text-secondary text-xs font-medium mb-1 uppercase tracking-wide">Club / equipo anterior</p>
                            {editing ? (
                                <input
                                    type="text"
                                    name="club_anterior"
                                    value={form.club_anterior}
                                    onChange={handleChange}
                                    placeholder="Ingresa club anterior..."
                                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
                                />
                            ) : (
                                <p className="text-white text-sm leading-relaxed">
                                    {form.club_anterior || <span className="text-text-secondary italic">No especificado</span>}
                                </p>
                            )}
                        </div>

                        {/* Antecedentes personales */}
                        <div className="px-5 py-3.5">
                            <p className="text-text-secondary text-xs font-medium mb-1 uppercase tracking-wide">Antecedentes personales</p>
                            {editing ? (
                                <textarea
                                    name="antecedentes_personales"
                                    value={form.antecedentes_personales}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Patologías crónicas de base (Asma, diabetes, epilepsia, etc.)..."
                                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                                />
                            ) : (
                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                    {form.antecedentes_personales || <span className="text-text-secondary italic">No refiere patologías crónicas de base</span>}
                                </p>
                            )}
                        </div>

                        {/* Alergias */}
                        <div className="px-5 py-3.5">
                            <p className="text-text-secondary text-xs font-medium mb-1 uppercase tracking-wide">Alergias</p>
                            {editing ? (
                                <input
                                    type="text"
                                    name="alergias"
                                    value={form.alergias}
                                    onChange={handleChange}
                                    placeholder="Alergias farmacológicas o ambientales..."
                                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
                                />
                            ) : (
                                <p className="text-white text-sm leading-relaxed">
                                    {form.alergias || <span className="text-text-secondary italic">No refiere alergias</span>}
                                </p>
                            )}
                        </div>

                        {/* Cirugías previas */}
                        <div className="px-5 py-3.5">
                            <p className="text-text-secondary text-xs font-medium mb-1 uppercase tracking-wide">Cirugías previas</p>
                            {editing ? (
                                <input
                                    type="text"
                                    name="cirugias_previas"
                                    value={form.cirugias_previas}
                                    onChange={handleChange}
                                    placeholder="Cirugías e intervenciones previas..."
                                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
                                />
                            ) : (
                                <p className="text-white text-sm leading-relaxed">
                                    {form.cirugias_previas || <span className="text-text-secondary italic">No refiere cirugías previas</span>}
                                </p>
                            )}
                        </div>

                        {/* Antecedentes Familiares Críticos */}
                        <div className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">Antecedentes familiares críticos</p>
                                <span className="text-[10px] bg-error/15 text-error border border-error/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Cribado Muerte Súbita</span>
                            </div>
                            {editing ? (
                                <div className="space-y-3 mt-1.5">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleFamiliares(true)}
                                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                                                form.antecedentes_familiares.tiene
                                                    ? 'bg-error/20 text-error border-error/40'
                                                    : 'bg-background text-text-secondary border-border'
                                            }`}
                                        >
                                            Sí (Refiere casos directos)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleFamiliares(false)}
                                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                                                !form.antecedentes_familiares.tiene
                                                    ? 'bg-success/20 text-success border-success/40'
                                                    : 'bg-background text-text-secondary border-border'
                                            }`}
                                        >
                                            No (No refiere antecedentes)
                                        </button>
                                    </div>
                                    {form.antecedentes_familiares.tiene && (
                                        <textarea
                                            value={form.antecedentes_familiares.detalle}
                                            onChange={(e) => handleFamiliaresDetalle(e.target.value)}
                                            rows={2}
                                            placeholder="Detalle casos de muerte súbita < 50 años, cardiopatías congénitas, arritmias, marcapasos..."
                                            className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm">
                                    {form.antecedentes_familiares.tiene ? (
                                        <div className="flex items-start gap-2 text-error bg-error/5 border border-error/20 p-2.5 rounded mt-1">
                                            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-xs uppercase tracking-wider">Antecedentes detectados:</p>
                                                <p className="mt-0.5 leading-relaxed text-white">{form.antecedentes_familiares.detalle}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white text-sm leading-relaxed">
                                            No refiere antecedentes familiares críticos de muerte súbita o cardiopatías.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Síntomas de Esfuerzo */}
                        <div className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">Síntomas de esfuerzo</p>
                                <span className="text-[10px] bg-warning/15 text-warning border border-warning/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Riesgo Cardiovascular</span>
                            </div>
                            {editing ? (
                                <div className="space-y-3 mt-2">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {[
                                            { key: 'palpitaciones', label: 'Palpitaciones anómalas' },
                                            { key: 'dolor_pecho', label: 'Dolor/presión en pecho' },
                                            { key: 'sincope', label: 'Síncope (desmayos)' },
                                            { key: 'disnea', label: 'Disnea desproporcionada' },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-2 bg-background border border-border p-2 rounded cursor-pointer hover:border-primary/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={form.sintomas_esfuerzo[item.key]}
                                                    onChange={(e) => handleSintomaChange(item.key, e.target.checked)}
                                                    className="w-4 h-4 accent-primary rounded border-border"
                                                />
                                                <span className="text-xs text-white font-medium select-none">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <textarea
                                        value={form.sintomas_esfuerzo.detalle}
                                        onChange={(e) => handleSintomasDetalle(e.target.value)}
                                        rows={2}
                                        placeholder="Otros síntomas observados o detalles adicionales..."
                                        className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                                    />
                                </div>
                            ) : (
                                <div className="text-sm">
                                    {Object.entries(form.sintomas_esfuerzo).some(([k, v]) => k !== 'detalle' && v) || form.sintomas_esfuerzo.detalle ? (
                                        <div className="flex items-start gap-2 text-warning bg-warning/5 border border-warning/20 p-2.5 rounded mt-1">
                                            <Heart size={15} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-xs uppercase tracking-wider">Síntomas detectados:</p>
                                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-white">
                                                    {form.sintomas_esfuerzo.palpitaciones && <li>Palpitaciones anómalas</li>}
                                                    {form.sintomas_esfuerzo.dolor_pecho && <li>Dolor/presión en el pecho</li>}
                                                    {form.sintomas_esfuerzo.sincope && <li>Síncope (desmayos)</li>}
                                                    {form.sintomas_esfuerzo.disnea && <li>Disnea desproporcionada</li>}
                                                </ul>
                                                {form.sintomas_esfuerzo.detalle && (
                                                    <p className="mt-2 text-xs text-text-secondary leading-relaxed border-t border-border/40 pt-1.5">
                                                        Detalles: <span className="text-white">{form.sintomas_esfuerzo.detalle}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white text-sm leading-relaxed">
                                            No refiere síntomas anómalos o sospechosos durante el ejercicio.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Historial de Trauma Craneal */}
                        <div className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">Historial de trauma craneal</p>
                                <span className="text-[10px] bg-info/15 text-info border border-info/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Gestión Conmociones</span>
                            </div>
                            {editing ? (
                                <div className="space-y-3 mt-1.5">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTrauma(true)}
                                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                                                form.trauma_craneal.tiene
                                                    ? 'bg-info/20 text-info border-info/40'
                                                    : 'bg-background text-text-secondary border-border'
                                            }`}
                                        >
                                            Sí (Refiere traumas previos)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTrauma(false)}
                                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                                                !form.trauma_craneal.tiene
                                                    ? 'bg-success/20 text-success border-success/40'
                                                    : 'bg-background text-text-secondary border-border'
                                            }`}
                                        >
                                            No (No refiere traumas)
                                        </button>
                                    </div>
                                    {form.trauma_craneal.tiene && (
                                        <textarea
                                            value={form.trauma_craneal.detalle}
                                            onChange={(e) => handleTraumaDetalle(e.target.value)}
                                            rows={2}
                                            placeholder="Detalle pérdidas de conocimiento, mareos o desorientación causados por golpes..."
                                            className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm">
                                    {form.trauma_craneal.tiene ? (
                                        <div className="flex items-start gap-2 text-info bg-info/5 border border-info/20 p-2.5 rounded mt-1">
                                            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-xs uppercase tracking-wider">Historial de conmociones:</p>
                                                <p className="mt-0.5 leading-relaxed text-white">{form.trauma_craneal.detalle}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white text-sm leading-relaxed">
                                            No refiere antecedentes de conmociones, mareos o pérdidas de conocimiento por traumatismos craneales.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AntecedentesCard;
