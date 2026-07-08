import React, { useState } from 'react';
import { ShieldAlert, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

/**
 * Tarjeta de Antecedentes Médicos (datos estáticos del alumno).
 * El Médico puede editar; otros roles ven en modo lectura.
 */
const AntecedentesCard = ({ ficha, canManage, onSave, saving }) => {
    const { addToast } = useToast();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        antecedentes_personales: ficha?.antecedentes_personales || '',
        alergias: ficha?.alergias || '',
        cirugias_previas: ficha?.cirugias_previas || '',
        club_anterior: ficha?.club_anterior || '',
    });

    // Sincronizar si cambia la ficha desde afuera
    React.useEffect(() => {
        if (!editing) {
            setForm({
                antecedentes_personales: ficha?.antecedentes_personales || '',
                alergias: ficha?.alergias || '',
                cirugias_previas: ficha?.cirugias_previas || '',
                club_anterior: ficha?.club_anterior || '',
            });
        }
    }, [ficha, editing]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        });
        setEditing(false);
    };

    const sinDatos = !ficha?.antecedentes_personales && !ficha?.alergias && !ficha?.cirugias_previas && !ficha?.club_anterior;

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
                        onClick={() => setEditing(true)}
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
                        <CampoAntecedente
                            label="Antecedentes personales"
                            name="antecedentes_personales"
                            value={form.antecedentes_personales}
                            editing={editing}
                            onChange={handleChange}
                            multiline
                        />
                        <CampoAntecedente
                            label="Alergias"
                            name="alergias"
                            value={form.alergias}
                            editing={editing}
                            onChange={handleChange}
                        />
                        <CampoAntecedente
                            label="Cirugías previas"
                            name="cirugias_previas"
                            value={form.cirugias_previas}
                            editing={editing}
                            onChange={handleChange}
                        />
                        <CampoAntecedente
                            label="Club / equipo anterior"
                            name="club_anterior"
                            value={form.club_anterior}
                            editing={editing}
                            onChange={handleChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

/** Fila individual del formulario de antecedentes */
const CampoAntecedente = ({ label, name, value, editing, onChange, multiline = false }) => (
    <div className="px-5 py-3.5">
        <p className="text-text-secondary text-xs font-medium mb-1 uppercase tracking-wide">{label}</p>
        {editing ? (
            multiline ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    rows={3}
                    placeholder={`Ingresa ${label.toLowerCase()}...`}
                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none placeholder-text-secondary"
                />
            ) : (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={`Ingresa ${label.toLowerCase()}...`}
                    className="w-full bg-background border border-border rounded text-white text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder-text-secondary"
                />
            )
        ) : (
            <p className="text-white text-sm leading-relaxed">
                {value || <span className="text-text-secondary italic">No especificado</span>}
            </p>
        )}
    </div>
);

export default AntecedentesCard;
