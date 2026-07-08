import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const APTITUD_OPTIONS = ['Apto', 'Apto con restricciones', 'No apto'];
const ESTADO_OPTIONS = ['Bueno', 'Regular', 'Malo'];

const CAMPO_INICIAL = {
    presion_arterial: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    peso_kg: '',
    talla_cm: '',
    estado_general: 'Bueno',
    examen_fisico: '',
    aptitud_deportiva: 'Apto',
    observaciones: '',
    proxima_revision: '',
};

/**
 * Modal para crear o editar una evaluación médica periódica.
 */
const NuevaEvaluacionModal = ({ titulo = 'Nueva Evaluación', initialData = null, onGuardar, onCerrar, saving }) => {
    const [form, setForm] = useState({
        ...CAMPO_INICIAL,
        ...(initialData ? {
            presion_arterial: initialData.presion_arterial || '',
            frecuencia_cardiaca: initialData.frecuencia_cardiaca || '',
            frecuencia_respiratoria: initialData.frecuencia_respiratoria || '',
            saturacion_oxigeno: initialData.saturacion_oxigeno || '',
            peso_kg: initialData.peso_kg || '',
            talla_cm: initialData.talla_cm || '',
            estado_general: initialData.estado_general || 'Bueno',
            examen_fisico: initialData.examen_fisico || '',
            aptitud_deportiva: initialData.aptitud_deportiva || 'Apto',
            observaciones: initialData.observaciones || '',
            proxima_revision: initialData.proxima_revision || '',
        } : {}),
    });
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Calcular IMC en tiempo real
    const imc = form.peso_kg && form.talla_cm
        ? (parseFloat(form.peso_kg) / Math.pow(parseFloat(form.talla_cm) / 100, 2)).toFixed(1)
        : null;

    const handleSubmit = async () => {
        setError(null);
        if (!form.aptitud_deportiva) {
            setError('El campo "Aptitud Deportiva" es obligatorio.');
            return;
        }
        setIsSaving(true);
        try {
            await onGuardar(form);
        } catch (err) {
            setError(err.message || 'Error al guardar la evaluación.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface border border-border rounded-md w-full max-w-lg shadow-lg">
                {/* Cabecera */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-white font-semibold text-base">{titulo}</h2>
                    <button onClick={onCerrar} className="text-text-secondary hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Formulario */}
                <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Signos Vitales */}
                    <section>
                        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Signos Vitales</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Campo label="Presión arterial" name="presion_arterial" placeholder="120/70" value={form.presion_arterial} onChange={handleChange} />
                            <Campo label="Frec. cardíaca (lpm)" name="frecuencia_cardiaca" type="number" placeholder="72" value={form.frecuencia_cardiaca} onChange={handleChange} />
                            <Campo label="Frec. respiratoria (rpm)" name="frecuencia_respiratoria" type="number" placeholder="18" value={form.frecuencia_respiratoria} onChange={handleChange} />
                            <Campo label="Sat. oxígeno (%)" name="saturacion_oxigeno" type="number" placeholder="98" step="0.1" value={form.saturacion_oxigeno} onChange={handleChange} />
                            <Campo label="Peso (kg)" name="peso_kg" type="number" placeholder="45.0" step="0.1" value={form.peso_kg} onChange={handleChange} />
                            <Campo label="Talla (cm)" name="talla_cm" type="number" placeholder="155" step="0.1" value={form.talla_cm} onChange={handleChange} />
                        </div>
                        {/* IMC calculado */}
                        {imc && (
                            <div className="mt-2 bg-info/10 border border-info/20 rounded px-3 py-2 flex items-center gap-2">
                                <span className="text-info text-xs font-semibold">IMC calculado:</span>
                                <span className="text-info text-sm font-bold">{imc} kg/m²</span>
                                <span className="text-text-secondary text-xs">(no se almacena)</span>
                            </div>
                        )}
                    </section>

                    {/* Evaluación Clínica */}
                    <section>
                        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Evaluación Clínica</p>

                        {/* Estado general */}
                        <div className="mb-3">
                            <label className="text-text-secondary text-sm block mb-1">Estado general</label>
                            <div className="flex gap-2">
                                {ESTADO_OPTIONS.map(op => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, estado_general: op }))}
                                        className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                                            form.estado_general === op
                                                ? op === 'Bueno' ? 'bg-success/20 text-success border-success/50'
                                                    : op === 'Regular' ? 'bg-warning/20 text-warning border-warning/50'
                                                    : 'bg-error/20 text-error border-error/50'
                                                : 'bg-background text-text-secondary border-border hover:border-primary/50'
                                        }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <CampoTexto label="Examen físico general" name="examen_fisico" placeholder="Hallazgos del examen físico..." value={form.examen_fisico} onChange={handleChange} rows={2} />
                        <CampoTexto label="Observaciones y recomendaciones" name="observaciones" placeholder="Recomendaciones para el entrenador y padres..." value={form.observaciones} onChange={handleChange} rows={3} />
                    </section>

                    {/* Aptitud Deportiva (obligatoria) */}
                    <section>
                        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Aptitud Deportiva *</p>
                        <div className="flex flex-col gap-2">
                            {APTITUD_OPTIONS.map(op => {
                                const selected = form.aptitud_deportiva === op;
                                const colorClass = op === 'Apto'
                                    ? selected ? 'border-success bg-success/15 text-success' : 'border-border text-text-secondary'
                                    : op === 'Apto con restricciones'
                                    ? selected ? 'border-warning bg-warning/15 text-warning' : 'border-border text-text-secondary'
                                    : selected ? 'border-error bg-error/15 text-error' : 'border-border text-text-secondary';
                                return (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, aptitud_deportiva: op }))}
                                        className={`flex items-center gap-3 px-4 py-3 rounded border text-sm font-medium transition-colors ${colorClass} hover:opacity-90`}
                                    >
                                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                            op === 'Apto' ? 'bg-success' : op === 'Apto con restricciones' ? 'bg-warning' : 'bg-error'
                                        } ${selected ? 'ring-2 ring-offset-1 ring-offset-surface' : 'opacity-40'}`} />
                                        {op}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Próxima revisión */}
                    <section>
                        <Campo label="Próxima revisión (sugerida)" name="proxima_revision" type="date" value={form.proxima_revision} onChange={handleChange} />
                    </section>

                    {error && (
                        <div className="bg-error/10 border border-error/30 rounded px-4 py-3 text-error text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Pie del modal */}
                <div className="flex gap-3 px-5 py-4 border-t border-border">
                    <button
                        onClick={onCerrar}
                        className="flex-1 py-2.5 border border-border text-text-secondary rounded hover:border-primary hover:text-white transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded hover:bg-orange-600 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving || saving ? 'Guardando...' : 'Guardar Evaluación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Campo = ({ label, name, type = 'text', placeholder, value, onChange, step }) => (
    <div>
        <label className="text-text-secondary text-xs block mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
        />
    </div>
);

const CampoTexto = ({ label, name, placeholder, value, onChange, rows = 3 }) => (
    <div className="mb-3">
        <label className="text-text-secondary text-sm block mb-1">{label}</label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            placeholder={placeholder}
            className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
        />
    </div>
);

export default NuevaEvaluacionModal;
