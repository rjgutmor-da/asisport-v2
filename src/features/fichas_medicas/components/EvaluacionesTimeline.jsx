import React, { useState } from 'react';
import { BarChart2, Plus, ClipboardList } from 'lucide-react';
import EvaluacionCard from './EvaluacionCard';
import NuevaEvaluacionModal from './NuevaEvaluacionModal';
import { useToast } from '../../../components/ui/Toast';

/**
 * Timeline de evaluaciones médicas periódicas.
 * Muestra todas las evaluaciones ordenadas de más reciente a más antigua.
 * La primera se muestra expandida por defecto.
 */
const EvaluacionesTimeline = ({ evaluaciones, canManage, puedeEditar, onAgregar, onEditar, saving }) => {
    const { addToast } = useToast();
    const [mostrarModal, setMostrarModal] = useState(false);

    const handleAgregar = async (data) => {
        try {
            await onAgregar(data);
            addToast('Evaluación registrada correctamente', 'success');
            setMostrarModal(false);
        } catch (err) {
            addToast(err.message || 'Error al registrar la evaluación', 'error');
            throw err; // Re-lanzar para que el modal muestre el error inline
        }
    };

    const handleEditar = async (id, data) => {
        try {
            await onEditar(id, data);
            addToast('Evaluación actualizada correctamente', 'success');
        } catch (err) {
            addToast(err.message || 'Error al actualizar la evaluación', 'error');
        }
    };

    return (
        <>
            <div className="bg-surface border border-border rounded-md overflow-hidden">
                {/* Encabezado */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
                            <BarChart2 size={18} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">Evaluaciones Periódicas</h3>
                            {evaluaciones.length > 0 && (
                                <p className="text-text-secondary text-xs">
                                    {evaluaciones.length} evaluación{evaluaciones.length !== 1 ? 'es' : ''} registrada{evaluaciones.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setMostrarModal(true)}
                            className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors font-medium"
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Nueva Evaluación</span>
                            <span className="sm:hidden">Nueva</span>
                        </button>
                    )}
                </div>

                {/* Lista de evaluaciones */}
                <div className="p-4 space-y-3">
                    {evaluaciones.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center">
                                <ClipboardList size={22} className="text-text-secondary" />
                            </div>
                            <p className="text-text-secondary text-sm text-center">
                                {canManage
                                    ? 'No hay evaluaciones registradas. Haz clic en "Nueva Evaluación" para comenzar.'
                                    : 'No hay evaluaciones médicas registradas para este alumno.'}
                            </p>
                        </div>
                    ) : (
                        evaluaciones.map((ev, idx) => (
                            <EvaluacionCard
                                key={ev.id}
                                evaluacion={ev}
                                defaultExpanded={idx === 0} // La más reciente, expandida
                                canManage={canManage}
                                puedeEditar={puedeEditar}
                                onEditar={handleEditar}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Modal nueva evaluación */}
            {mostrarModal && (
                <NuevaEvaluacionModal
                    titulo="Nueva Evaluación Médica"
                    onGuardar={handleAgregar}
                    onCerrar={() => setMostrarModal(false)}
                    saving={saving}
                />
            )}
        </>
    );
};

export default EvaluacionesTimeline;
