import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, RefreshCw, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import Select from '../components/ui/Select';
import AsistenciaListItem from '../features/asistencias/components/AsistenciaListItem';

import { useAsistencias } from '../features/asistencias/hooks/useAsistencias';
import TabBar from '../components/dashboard/TabBar';

/**
 * Página principal de Asistencias con flujo refinado
 */
const Asistencia = () => {
    const navigate = useNavigate();

    const {
        loading,
        submitting,
        alumnos,
        selectedDate,
        resumen, // { total, presentes, licencias, ausentes, cambiosPendientes }
        enviosRealizados, // 0, 1, 2
        canchas,
        horarios,
        selectedCancha,
        selectedHorario,
        setSelectedCancha,
        setSelectedHorario,
        handleDateChange,
        handleAsistenciaNormal,
        handleEliminarAsistenciaNormal,
        getEstadoEfectivo,
        handleSubmit,
        refresh
    } = useAsistencias();

    // Estados para modales
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [lastSubmissionResult, setLastSubmissionResult] = useState(null);

    // Formatear fecha
    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00');
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    };

    const getMaxDate = () => new Date().toISOString().split('T')[0];

    // Manejar clic en "Enviar" / "Reenviar"
    const onSendClick = () => {
        if (enviosRealizados >= 2) return;
        setShowConfirmModal(true);
    };

    const onConfirmSend = async () => {
        setShowConfirmModal(false);
        const result = await handleSubmit();
        if (result && result.exitosos > 0) {
            setLastSubmissionResult(resumen); // Guardar resumen actual para mostrar
            setShowSummaryModal(true);
        }
    };

    // Texto del botón dinámico
    const getButtonText = () => {
        if (submitting) return "Enviando...";
        if (enviosRealizados === 0) return "Enviar";
        if (enviosRealizados === 1) return "Reenviar";
        return "Enviado (Bloqueado)";
    };

    const isButtonDisabled = loading || submitting || enviosRealizados >= 2;

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-10 relative">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-white hover:text-primary transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-white">Asistencia</h1>
                    </div>

                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="p-2 text-text-secondary hover:text-primary transition-colors"
                        title="Refrescar"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-surface border border-border rounded-md p-3">
                    <Calendar size={20} className="text-primary flex-shrink-0" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={getMaxDate()}
                        className="flex-grow bg-transparent text-white border-none outline-none text-lg font-medium cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                    <span className="text-text-secondary text-sm hidden md:block">
                        {formatDateDisplay(selectedDate)}
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        placeholder="Todas las Canchas"
                        options={canchas}
                        value={selectedCancha}
                        onChange={(e) => setSelectedCancha(e.target.value)}
                    />
                    <Select
                        placeholder="Todos los Horarios"
                        options={horarios}
                        value={selectedHorario}
                        onChange={(e) => setSelectedHorario(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary w-8 h-8" />
                    </div>
                ) : alumnos.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">
                            No hay alumnos asignados a ti que coincidan con los filtros.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alumnos.map((alumno) => (
                            <AsistenciaListItem
                                key={alumno.id}
                                alumno={alumno}
                                localEstado={getEstadoEfectivo(alumno.id)}
                                onAsistenciaNormal={handleAsistenciaNormal}
                                onEliminarNormal={handleEliminarAsistenciaNormal}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* MODAL DE CONFIRMACIÓN */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className={`p-3 rounded-full ${enviosRealizados === 1 ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}`}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {enviosRealizados === 1 ? '¿Estás seguro?' : 'Confirmar Envío'}
                            </h3>
                            <p className="text-text-secondary">
                                {enviosRealizados === 0
                                    ? 'Una vez enviado no podrá modificarse (tienes 1 oportunidad de corrección).'
                                    : 'ADVERTENCIA: Esta es tu ÚLTIMA oportunidad de corregir. Después de esto no podrás hacer más cambios.'
                                }
                            </p>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-2 px-4 rounded-md border border-border text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onConfirmSend}
                                    className={`flex-1 py-2 px-4 rounded-md text-white font-bold transition-colors ${enviosRealizados === 1 ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'}`}
                                >
                                    {enviosRealizados === 1 ? 'Reenviar Definitivo' : 'Enviar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE RESUMEN POST-ENVÍO */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 rounded-full bg-success/20 text-success">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">¡Enviado Exitosamente!</h3>
                            <div className="w-full bg-background/50 rounded-md p-4 space-y-2">
                                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                    <span className="text-success font-medium">Asistencias</span>
                                    <span className="text-white font-bold text-lg">{lastSubmissionResult?.presentes || 0}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                    <span className="text-warning font-medium">Licencias</span>
                                    <span className="text-white font-bold text-lg">{lastSubmissionResult?.licencias || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-error font-medium">Ausencias</span>
                                    <span className="text-white font-bold text-lg">{lastSubmissionResult?.ausentes || 0}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="w-full py-3 px-4 rounded-md bg-primary text-white font-bold hover:bg-primary/90 transition-colors mt-2"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón flotante siempre visible (sticky) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden z-20">
                <button
                    onClick={onSendClick}
                    disabled={isButtonDisabled}
                    className={`
                        w-full font-bold py-4 px-6 rounded-lg
                        flex items-center justify-center gap-3
                        transition-all shadow-lg
                        ${isButtonDisabled
                            ? 'bg-surface border border-border text-text-secondary cursor-not-allowed'
                            : enviosRealizados === 1
                                ? 'bg-warning text-white hover:bg-warning/90 shadow-warning/30'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/30'
                        }
                    `}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            {getButtonText()}
                        </>
                    )}
                </button>
            </div>

            {/* Versión Desktop */}
            <div className="hidden md:block fixed bottom-8 right-8 z-20">
                <button
                    onClick={onSendClick}
                    disabled={isButtonDisabled}
                    className={`
                         font-bold py-3 px-6 rounded-lg
                        flex items-center gap-3
                        transition-all shadow-lg
                        ${isButtonDisabled
                            ? 'bg-surface border border-border text-text-secondary cursor-not-allowed'
                            : enviosRealizados === 1
                                ? 'bg-warning text-white hover:bg-warning/90 shadow-warning/30'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/30'
                        }
                    `}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            {getButtonText()}
                        </>
                    )}
                </button>
            </div>

            {/* Tab Bar (Solo Mobile) */}
            <TabBar />
        </div>
    );
};

export default Asistencia;
