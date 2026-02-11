import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Plus, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import {
    getAllCanchas,
    getAllHorarios,
    createCancha,
    createHorario,
    updateCancha,
    updateHorario,
    toggleCanchaStatus,
    toggleHorarioStatus
} from '../../services/maestros';

const Configuraciones = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState('canchas');
    const [loading, setLoading] = useState(true);

    // Estado de Canchas
    const [canchas, setCanchas] = useState([]);
    const [newCanchaName, setNewCanchaName] = useState('');
    const [editingCancha, setEditingCancha] = useState(null);
    const [editCanchaName, setEditCanchaName] = useState('');

    // Estado de Horarios
    const [horarios, setHorarios] = useState([]);
    const [newHorarioTime, setNewHorarioTime] = useState('');
    const [editingHorario, setEditingHorario] = useState(null);
    const [editHorarioTime, setEditHorarioTime] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [chs, hrs] = await Promise.all([
                getAllCanchas(),
                getAllHorarios()
            ]);
            setCanchas(chs);
            setHorarios(hrs);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // Funciones de Canchas
    // ========================================================================

    const handleCreateCancha = async (e) => {
        e.preventDefault();
        if (!newCanchaName.trim()) return;

        try {
            await createCancha(newCanchaName);
            addToast('Cancha creada correctamente', 'success');
            setNewCanchaName('');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const startEditCancha = (cancha) => {
        setEditingCancha(cancha.id);
        setEditCanchaName(cancha.nombre);
    };

    const cancelEditCancha = () => {
        setEditingCancha(null);
        setEditCanchaName('');
    };

    const handleUpdateCancha = async (id) => {
        if (!editCanchaName.trim()) return;

        try {
            await updateCancha(id, editCanchaName);
            addToast('Cancha actualizada correctamente', 'success');
            setEditingCancha(null);
            setEditCanchaName('');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleToggleCanchaStatus = async (id, currentStatus) => {
        try {
            await toggleCanchaStatus(id, currentStatus);
            addToast(`Cancha ${currentStatus ? 'desactivada' : 'activada'}`, 'success');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    // ========================================================================
    // Funciones de Horarios
    // ========================================================================

    const handleCreateHorario = async (e) => {
        e.preventDefault();
        if (!newHorarioTime.trim()) return;

        try {
            await createHorario(newHorarioTime);
            addToast('Horario creado correctamente', 'success');
            setNewHorarioTime('');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const startEditHorario = (horario) => {
        setEditingHorario(horario.id);
        setEditHorarioTime(horario.hora);
    };

    const cancelEditHorario = () => {
        setEditingHorario(null);
        setEditHorarioTime('');
    };

    const handleUpdateHorario = async (id) => {
        if (!editHorarioTime.trim()) return;

        try {
            await updateHorario(id, editHorarioTime);
            addToast('Horario actualizado correctamente', 'success');
            setEditingHorario(null);
            setEditHorarioTime('');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleToggleHorarioStatus = async (id, currentStatus) => {
        try {
            await toggleHorarioStatus(id, currentStatus);
            addToast(`Horario ${currentStatus ? 'desactivado' : 'activado'}`, 'success');
            loadData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-white">Cargando configuraciones...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings />
                    Configuraciones
                </h1>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab('canchas')}
                        className={`
                            px-6 py-3 font-medium transition-colors border-b-2
                            ${activeTab === 'canchas'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-white'
                            }
                        `}
                    >
                        Canchas
                    </button>
                    <button
                        onClick={() => setActiveTab('horarios')}
                        className={`
                            px-6 py-3 font-medium transition-colors border-b-2
                            ${activeTab === 'horarios'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-white'
                            }
                        `}
                    >
                        Horarios
                    </button>
                </div>

                {/* Contenido según tab activo */}
                {activeTab === 'canchas' ? (
                    <div className="space-y-6">
                        {/* Formulario de Creación */}
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h2 className="text-lg font-bold text-white mb-4">Agregar Nueva Cancha</h2>
                            <form onSubmit={handleCreateCancha} className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Nombre de la cancha"
                                    value={newCanchaName}
                                    onChange={(e) => setNewCanchaName(e.target.value)}
                                    className="flex-1 bg-background border border-border text-white px-3 py-2 rounded-md focus:border-primary outline-none"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Crear
                                </button>
                            </form>
                        </div>

                        {/* Tabla de Canchas */}
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background/50 border-b border-border">
                                    <tr>
                                        <th className="p-4 font-bold text-text-secondary">Nombre</th>
                                        <th className="p-4 font-bold text-text-secondary text-center">Estado</th>
                                        <th className="p-4 font-bold text-text-secondary text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {canchas.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-text-secondary">
                                                No hay canchas registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        canchas.map((cancha) => (
                                            <tr key={cancha.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    {editingCancha === cancha.id ? (
                                                        <input
                                                            type="text"
                                                            value={editCanchaName}
                                                            onChange={(e) => setEditCanchaName(e.target.value)}
                                                            className="bg-background border border-border text-white px-2 py-1 rounded text-sm focus:border-primary outline-none"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-white font-medium">{cancha.nombre}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {cancha.activo ? (
                                                        <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
                                                            <CheckCircle size={16} /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-error text-sm font-medium">
                                                            <XCircle size={16} /> Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {editingCancha === cancha.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateCancha(cancha.id)}
                                                                    className="text-xs px-3 py-1.5 rounded border border-success/30 text-success hover:bg-success/10 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Save size={14} /> Guardar
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditCancha}
                                                                    className="text-xs px-3 py-1.5 rounded border border-border text-text-secondary hover:bg-white/5 transition-colors flex items-center gap-1"
                                                                >
                                                                    <X size={14} /> Cancelar
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditCancha(cancha)}
                                                                    className="text-xs px-3 py-1.5 rounded border border-border text-text-secondary hover:text-white hover:border-primary transition-colors flex items-center gap-1"
                                                                >
                                                                    <Edit2 size={14} /> Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleCanchaStatus(cancha.id, cancha.activo)}
                                                                    className={`
                                                                        text-xs px-3 py-1.5 rounded border transition-colors
                                                                        ${cancha.activo
                                                                            ? 'border-error/30 text-error hover:bg-error/10'
                                                                            : 'border-success/30 text-success hover:bg-success/10'
                                                                        }
                                                                    `}
                                                                >
                                                                    {cancha.activo ? 'Desactivar' : 'Activar'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Formulario de Creación */}
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h2 className="text-lg font-bold text-white mb-4">Agregar Nuevo Horario</h2>
                            <form onSubmit={handleCreateHorario} className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="HH:MM (ej: 18:00)"
                                    value={newHorarioTime}
                                    onChange={(e) => setNewHorarioTime(e.target.value)}
                                    className="flex-1 bg-background border border-border text-white px-3 py-2 rounded-md focus:border-primary outline-none"
                                    pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                                    title="Formato: HH:MM (ejemplo: 18:00)"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Crear
                                </button>
                            </form>
                        </div>

                        {/* Tabla de Horarios */}
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background/50 border-b border-border">
                                    <tr>
                                        <th className="p-4 font-bold text-text-secondary">Hora</th>
                                        <th className="p-4 font-bold text-text-secondary text-center">Estado</th>
                                        <th className="p-4 font-bold text-text-secondary text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {horarios.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-text-secondary">
                                                No hay horarios registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        horarios.map((horario) => (
                                            <tr key={horario.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    {editingHorario === horario.id ? (
                                                        <input
                                                            type="text"
                                                            value={editHorarioTime}
                                                            onChange={(e) => setEditHorarioTime(e.target.value)}
                                                            className="bg-background border border-border text-white px-2 py-1 rounded text-sm focus:border-primary outline-none"
                                                            pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-white font-medium">{horario.hora}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {horario.activo ? (
                                                        <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
                                                            <CheckCircle size={16} /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-error text-sm font-medium">
                                                            <XCircle size={16} /> Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {editingHorario === horario.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateHorario(horario.id)}
                                                                    className="text-xs px-3 py-1.5 rounded border border-success/30 text-success hover:bg-success/10 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Save size={14} /> Guardar
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditHorario}
                                                                    className="text-xs px-3 py-1.5 rounded border border-border text-text-secondary hover:bg-white/5 transition-colors flex items-center gap-1"
                                                                >
                                                                    <X size={14} /> Cancelar
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditHorario(horario)}
                                                                    className="text-xs px-3 py-1.5 rounded border border-border text-text-secondary hover:text-white hover:border-primary transition-colors flex items-center gap-1"
                                                                >
                                                                    <Edit2 size={14} /> Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleHorarioStatus(horario.id, horario.activo)}
                                                                    className={`
                                                                        text-xs px-3 py-1.5 rounded border transition-colors
                                                                        ${horario.activo
                                                                            ? 'border-error/30 text-error hover:bg-error/10'
                                                                            : 'border-success/30 text-success hover:bg-success/10'
                                                                        }
                                                                    `}
                                                                >
                                                                    {horario.activo ? 'Desactivar' : 'Activar'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Configuraciones;
