import React, { useState } from 'react';
import { X, Save, ArrowLeft, ArrowRight } from 'lucide-react';

const APTITUD_OPTIONS = ['Apto', 'Apto con restricciones', 'No apto'];

const CAMPO_INICIAL = {
    deporte: 'Fútbol',
    presion_arterial: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    peso_kg: '',
    talla_cm: '',
    pulsos_perifericos: 'Simétricos y presentes',
    eval_cardiovascular: {
        auscultacion_supino: 'Normal',
        auscultacion_bipedestacion: 'Normal',
        soplos: false,
        observaciones: ''
    },
    eval_respiratorio: {
        auscultacion: 'Normal',
        hallazgos: ''
    },
    eval_musculoesqueletico: {
        estabilidad_ligamentosa: 'Normal',
        test_adams: 'Normal',
        osgood_schlatter: 'Negativo',
        observaciones: ''
    },
    eval_funcional: {
        marcha: 'Normal',
        equilibrio: 'Adecuado',
        fuerza: 'Adecuada',
        dolor_movimiento: false,
        dolor_zona: ''
    },
    aptitud_deportiva: 'Apto',
    restricciones_aptitud: '',
    observaciones: '',
    proxima_revision: '',
};

/**
 * Modal estructurado en pasos (wizard) para crear/editar una evaluación médica periódica.
 */
const NuevaEvaluacionModal = ({ titulo = 'Nueva Evaluación', initialData = null, onCerrar, onGuardar, saving }) => {
    const [activeStep, setActiveStep] = useState(1);
    const [form, setForm] = useState({
        ...CAMPO_INICIAL,
        ...(initialData ? {
            deporte: initialData.deporte || 'Fútbol',
            presion_arterial: initialData.presion_arterial || '',
            frecuencia_cardiaca: initialData.frecuencia_cardiaca || '',
            frecuencia_respiratoria: initialData.frecuencia_respiratoria || '',
            saturacion_oxigeno: initialData.saturacion_oxigeno || '',
            peso_kg: initialData.peso_kg || '',
            talla_cm: initialData.talla_cm || '',
            pulsos_perifericos: initialData.pulsos_perifericos || 'Simétricos y presentes',
            eval_cardiovascular: initialData.eval_cardiovascular || {
                auscultacion_supino: 'Normal',
                auscultacion_bipedestacion: 'Normal',
                soplos: false,
                observaciones: ''
            },
            eval_respiratorio: initialData.eval_respiratorio || {
                auscultacion: 'Normal',
                hallazgos: ''
            },
            eval_musculoesqueletico: initialData.eval_musculoesqueletico || {
                estabilidad_ligamentosa: 'Normal',
                test_adams: 'Normal',
                osgood_schlatter: 'Negativo',
                observaciones: ''
            },
            eval_funcional: initialData.eval_funcional || {
                marcha: 'Normal',
                equilibrio: 'Adecuado',
                fuerza: 'Adecuada',
                dolor_movimiento: false,
                dolor_zona: ''
            },
            aptitud_deportiva: initialData.aptitud_deportiva || 'Apto',
            restricciones_aptitud: initialData.restricciones_aptitud || '',
            observaciones: initialData.observaciones || '',
            proxima_revision: initialData.proxima_revision || '',
        } : {}),
    });
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Calcular IMC en tiempo real
    const imc = form.peso_kg && form.talla_cm
        ? (parseFloat(form.peso_kg) / Math.pow(parseFloat(form.talla_cm) / 100, 2)).toFixed(1)
        : null;

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNestedChange = (section, key, val) => {
        setForm(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: val
            }
        }));
    };

    const nextStep = () => {
        setError(null);
        // Validaciones por paso
        if (activeStep === 1) {
            if (!form.deporte) {
                setError('El campo "Deporte" es obligatorio.');
                return;
            }
        }
        if (activeStep === 3) {
            if (form.eval_funcional.dolor_movimiento && !form.eval_funcional.dolor_zona?.trim()) {
                setError('Por favor especifica la zona del dolor.');
                return;
            }
        }
        setActiveStep(prev => prev + 1);
    };

    const prevStep = () => {
        setError(null);
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setError(null);
        if (form.aptitud_deportiva === 'Apto con restricciones' && !form.restricciones_aptitud?.trim()) {
            setError('Las restricciones de aptitud son obligatorias para el dictamen seleccionado.');
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
            <div className="bg-surface border border-border rounded-md w-full max-w-xl shadow-lg">
                {/* Cabecera */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-white font-semibold text-base">{titulo}</h2>
                    <button onClick={onCerrar} className="text-text-secondary hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="flex justify-between items-center px-5 py-3 bg-background border-b border-border text-xs text-text-secondary select-none">
                    {[
                        'Signos & Antro',
                        'Sistemas',
                        'Funcional',
                        'Dictamen'
                    ].map((label, idx) => {
                        const stepNum = idx + 1;
                        const active = activeStep === stepNum;
                        const completed = activeStep > stepNum;
                        return (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all ${
                                    active ? 'bg-primary text-white border-primary ring-2 ring-primary/20' :
                                    completed ? 'bg-success/20 text-success border-success/30' : 'bg-surface text-text-secondary border-border'
                                }`}>
                                    {stepNum}
                                </span>
                                <span className={`hidden sm:inline font-medium ${active ? 'text-white' : completed ? 'text-success/80' : ''}`}>{label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Formulario */}
                <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">

                    {/* Paso 1: Signos Vitales y Antropometría */}
                    {activeStep === 1 && (
                        <div className="space-y-4">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider border-b border-border/40 pb-1">1. Datos Básicos y Antropometría</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-text-secondary text-xs block mb-1">Deporte que practica *</label>
                                    <input
                                        type="text"
                                        name="deporte"
                                        value={form.deporte}
                                        onChange={handleChange}
                                        placeholder="Fútbol, Basket, etc."
                                        className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
                                    />
                                </div>
                                <Campo label="Presión arterial (mmHg)" name="presion_arterial" placeholder="120/70" value={form.presion_arterial} onChange={handleChange} />
                                <Campo label="Frec. cardíaca (lpm)" name="frecuencia_cardiaca" type="number" placeholder="72" value={form.frecuencia_cardiaca} onChange={handleChange} />
                                <Campo label="Frec. respiratoria (rpm)" name="frecuencia_respiratoria" type="number" placeholder="18" value={form.frecuencia_respiratoria} onChange={handleChange} />
                                <Campo label="Sat. oxígeno SpO₂ (%) *" name="saturacion_oxigeno" type="number" placeholder="98" step="0.1" value={form.saturacion_oxigeno} onChange={handleChange} />
                                <Campo label="Peso (kg)" name="peso_kg" type="number" placeholder="45.0" step="0.1" value={form.peso_kg} onChange={handleChange} />
                                <Campo label="Talla (cm)" name="talla_cm" type="number" placeholder="155" step="0.1" value={form.talla_cm} onChange={handleChange} />
                            </div>

                            {/* IMC */}
                            {imc && (
                                <div className="bg-info/10 border border-info/20 rounded px-3 py-2 flex items-center gap-2">
                                    <span className="text-info text-xs font-semibold">IMC calculado:</span>
                                    <span className="text-info text-sm font-bold">{imc} kg/m²</span>
                                    <span className="text-text-secondary text-xs">(cálculo automático)</span>
                                </div>
                            )}

                            {/* Pulsos periféricos */}
                            <div>
                                <label className="text-text-secondary text-xs block mb-1.5">Pulsos periféricos simétricos</label>
                                <div className="flex gap-2">
                                    {['Simétricos y presentes', 'Asimétricos o ausentes'].map(op => {
                                        const isSel = form.pulsos_perifericos === op;
                                        return (
                                            <button
                                                key={op}
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, pulsos_perifericos: op }))}
                                                className={`flex-1 py-2 rounded text-xs font-semibold border transition-all ${
                                                    isSel
                                                        ? op.includes('presentes') ? 'bg-success/20 text-success border-success/50' : 'bg-error/20 text-error border-error/50 font-bold'
                                                        : 'bg-background text-text-secondary border-border hover:border-primary/50'
                                                }`}
                                            >
                                                {op}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 2: Evaluación Física por Sistemas */}
                    {activeStep === 2 && (
                        <div className="space-y-4">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider border-b border-border/40 pb-1">2. Exploración Clínica por Sistemas</p>

                            {/* A. Sistema Cardiovascular */}
                            <div className="space-y-3 bg-background border border-border p-3.5 rounded-md">
                                <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-primary">A. Sistema Cardiovascular</p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-text-secondary text-[11px] block mb-1">Auscultación decúbito supino</label>
                                        <div className="flex gap-1">
                                            {['Normal', 'Anormal'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleNestedChange('eval_cardiovascular', 'auscultacion_supino', v)}
                                                    className={`flex-1 py-1 rounded text-xs font-medium border ${
                                                        form.eval_cardiovascular.auscultacion_supino === v
                                                            ? v === 'Normal' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                            : 'bg-surface text-text-secondary border-border'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-text-secondary text-[11px] block mb-1">Auscultación bipedestación</label>
                                        <div className="flex gap-1">
                                            {['Normal', 'Anormal'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleNestedChange('eval_cardiovascular', 'auscultacion_bipedestacion', v)}
                                                    className={`flex-1 py-1 rounded text-xs font-medium border ${
                                                        form.eval_cardiovascular.auscultacion_bipedestacion === v
                                                            ? v === 'Normal' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                            : 'bg-surface text-text-secondary border-border'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-text-secondary text-xs">Soplos cardíacos detectados</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleNestedChange('eval_cardiovascular', 'soplos', true)}
                                            className={`px-3 py-1 rounded text-xs font-semibold border ${
                                                form.eval_cardiovascular.soplos === true
                                                    ? 'bg-error/20 text-error border-error/40'
                                                    : 'bg-surface text-text-secondary border-border'
                                            }`}
                                        >
                                            Sí
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleNestedChange('eval_cardiovascular', 'soplos', false)}
                                            className={`px-3 py-1 rounded text-xs font-semibold border ${
                                                form.eval_cardiovascular.soplos === false
                                                    ? 'bg-success/20 text-success border-success/40'
                                                    : 'bg-surface text-text-secondary border-border'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Observaciones cardiovasculares..."
                                    value={form.eval_cardiovascular.observaciones}
                                    onChange={(e) => handleNestedChange('eval_cardiovascular', 'observaciones', e.target.value)}
                                    className="w-full bg-surface border border-border rounded text-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-primary placeholder-text-secondary mt-1"
                                />
                            </div>

                            {/* B. Sistema Respiratorio */}
                            <div className="space-y-3 bg-background border border-border p-3.5 rounded-md">
                                <p className="text-white text-xs font-bold uppercase tracking-wider text-primary">B. Sistema Respiratorio</p>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary text-xs">Auscultación pulmonar</span>
                                    <div className="flex gap-2">
                                        {['Normal', 'Anormal'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => handleNestedChange('eval_respiratorio', 'auscultacion', v)}
                                                className={`px-4 py-1 rounded text-xs font-semibold border ${
                                                    form.eval_respiratorio.auscultacion === v
                                                        ? v === 'Normal' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Detalle de hallazgos (ej: sibilancias, roncus)..."
                                    value={form.eval_respiratorio.hallazgos}
                                    onChange={(e) => handleNestedChange('eval_respiratorio', 'hallazgos', e.target.value)}
                                    className="w-full bg-surface border border-border rounded text-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-primary placeholder-text-secondary"
                                />
                            </div>

                            {/* C. Sistema Músculo-esquelético */}
                            <div className="space-y-3 bg-background border border-border p-3.5 rounded-md">
                                <p className="text-white text-xs font-bold uppercase tracking-wider text-primary">C. Sistema Músculo-esquelético y Articular</p>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-secondary text-xs">Estabilidad ligamentosa (rodilla/tobillo)</span>
                                        <div className="flex gap-1.5">
                                            {['Normal', 'Anormal'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleNestedChange('eval_musculoesqueletico', 'estabilidad_ligamentosa', v)}
                                                    className={`px-3 py-1 rounded text-[11px] font-semibold border ${
                                                        form.eval_musculoesqueletico.estabilidad_ligamentosa === v
                                                            ? v === 'Normal' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                            : 'bg-surface text-text-secondary border-border'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-text-secondary text-xs">Test de Adams (inspección columna)</span>
                                        <div className="flex gap-1.5">
                                            {['Normal', 'Anormal'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleNestedChange('eval_musculoesqueletico', 'test_adams', v)}
                                                    className={`px-3 py-1 rounded text-[11px] font-semibold border ${
                                                        form.eval_musculoesqueletico.test_adams === v
                                                            ? v === 'Normal' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                            : 'bg-surface text-text-secondary border-border'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-text-secondary text-xs">Tuberosidad tibial (Osgood-Schlatter)</span>
                                        <div className="flex gap-1.5">
                                            {['Negativo', 'Positivo'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleNestedChange('eval_musculoesqueletico', 'osgood_schlatter', v)}
                                                    className={`px-3 py-1 rounded text-[11px] font-semibold border ${
                                                        form.eval_musculoesqueletico.osgood_schlatter === v
                                                            ? v === 'Negativo' ? 'bg-success/20 text-success border-success/40' : 'bg-error/20 text-error border-error/40'
                                                            : 'bg-surface text-text-secondary border-border'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Observaciones músculo-esqueléticas..."
                                    value={form.eval_musculoesqueletico.observaciones}
                                    onChange={(e) => handleNestedChange('eval_musculoesqueletico', 'observaciones', e.target.value)}
                                    className="w-full bg-surface border border-border rounded text-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-primary placeholder-text-secondary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Evaluación Funcional */}
                    {activeStep === 3 && (
                        <div className="space-y-4">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider border-b border-border/40 pb-1">3. Mapeo Funcional y Biomecánica</p>
                            
                            <div className="space-y-3 bg-background border border-border p-4 rounded-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">Marcha</span>
                                    <div className="flex gap-2">
                                        {['Normal', 'Inestable'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => handleNestedChange('eval_funcional', 'marcha', v)}
                                                className={`px-4 py-1.5 rounded text-xs font-semibold border ${
                                                    form.eval_funcional.marcha === v
                                                        ? v === 'Normal' ? 'bg-success/20 text-success border-success/45' : 'bg-error/20 text-error border-error/45'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">Equilibrio</span>
                                    <div className="flex gap-2">
                                        {['Adecuado', 'Inestable'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => handleNestedChange('eval_funcional', 'equilibrio', v)}
                                                className={`px-4 py-1.5 rounded text-xs font-semibold border ${
                                                    form.eval_funcional.equilibrio === v
                                                        ? v === 'Adecuado' ? 'bg-success/20 text-success border-success/45' : 'bg-error/20 text-error border-error/45'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">Fuerza general</span>
                                    <div className="flex gap-2">
                                        {['Adecuada', 'Disminuida'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => handleNestedChange('eval_funcional', 'fuerza', v)}
                                                className={`px-4 py-1.5 rounded text-xs font-semibold border ${
                                                    form.eval_funcional.fuerza === v
                                                        ? v === 'Adecuada' ? 'bg-success/20 text-success border-success/45' : 'bg-error/20 text-error border-error/45'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-border/40 pt-3 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-secondary text-sm">¿Siente dolor al moverse?</span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleNestedChange('eval_funcional', 'dolor_movimiento', true)}
                                                className={`px-4 py-1 rounded text-xs font-semibold border ${
                                                    form.eval_funcional.dolor_movimiento === true
                                                        ? 'bg-warning/20 text-warning border-warning/40'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                Sí
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleNestedChange('eval_funcional', 'dolor_movimiento', false)}
                                                className={`px-4 py-1 rounded text-xs font-semibold border ${
                                                    form.eval_funcional.dolor_movimiento === false
                                                        ? 'bg-success/20 text-success border-success/40'
                                                        : 'bg-surface text-text-secondary border-border'
                                                }`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                    {form.eval_funcional.dolor_movimiento && (
                                        <input
                                            type="text"
                                            placeholder="Especificar zona del dolor (ej: rodilla derecha, tobillo izquierdo)..."
                                            value={form.eval_funcional.dolor_zona}
                                            onChange={(e) => handleNestedChange('eval_funcional', 'dolor_zona', e.target.value)}
                                            className="w-full bg-surface border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary animate-in slide-in-from-top-2 duration-200"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 4: Dictamen de Aptitud y Cierre */}
                    {activeStep === 4 && (
                        <div className="space-y-4">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider border-b border-border/40 pb-1">4. Dictamen de Aptitud Física y Cierre</p>

                            {/* Dictamen de Aptitud */}
                            <div className="space-y-2">
                                <label className="text-text-secondary text-xs block">Dictamen de Aptitud *</label>
                                <div className="flex flex-col gap-2">
                                    {APTITUD_OPTIONS.map(op => {
                                        const selected = form.aptitud_deportiva === op;
                                        const colorClass = op === 'Apto'
                                            ? selected ? 'border-success bg-success/15 text-success' : 'border-border text-text-secondary'
                                            : op === 'Apto con restricciones'
                                            ? selected ? 'border-warning bg-warning/15 text-warning font-bold' : 'border-border text-text-secondary'
                                            : selected ? 'border-error bg-error/15 text-error font-bold' : 'border-border text-text-secondary';
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
                            </div>

                            {/* Campo condicional para restricciones */}
                            {form.aptitud_deportiva === 'Apto con restricciones' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-warning text-xs block mb-1 font-bold">Condiciones / Restricciones obligatorias *</label>
                                    <textarea
                                        name="restricciones_aptitud"
                                        value={form.restricciones_aptitud}
                                        onChange={handleChange}
                                        rows={2.5}
                                        placeholder="Especifica las restricciones (ej: evitar ejercicios aeróbicos prolongados, usar rodillera, etc.)..."
                                        className="w-full bg-background border-2 border-warning/40 rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-warning resize-none placeholder-text-secondary"
                                    />
                                </div>
                            )}

                            {/* Observaciones y Recomendaciones */}
                            <div>
                                <label className="text-text-secondary text-xs block mb-1">Observaciones y recomendaciones adicionales</label>
                                <textarea
                                    name="observaciones"
                                    value={form.observaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Recomendaciones generales para entrenadores, preparadores físicos y padres..."
                                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                                />
                            </div>

                            {/* Próxima revisión */}
                            <Campo label="Próxima revisión recomendada" name="proxima_revision" type="date" value={form.proxima_revision} onChange={handleChange} />
                        </div>
                    )}

                    {error && (
                        <div className="bg-error/10 border border-error/30 rounded px-4 py-3 text-error text-sm animate-in fade-in duration-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Pie del modal (Acciones) */}
                <div className="flex justify-between items-center px-5 py-4 border-t border-border bg-background/50">
                    <div>
                        {activeStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-1.5 px-4 py-2 border border-border text-text-secondary rounded hover:text-white hover:border-primary transition-colors text-sm font-medium"
                            >
                                <ArrowLeft size={16} />
                                Volver
                            </button>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {activeStep < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded hover:bg-orange-600 transition-colors text-sm font-bold"
                            >
                                Siguiente
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving || saving}
                                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded hover:bg-orange-600 transition-colors text-sm font-bold disabled:opacity-50"
                            >
                                <Save size={16} />
                                {isSaving || saving ? 'Guardando...' : 'Guardar Evaluación'}
                            </button>
                        )}
                    </div>
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

export default NuevaEvaluacionModal;
