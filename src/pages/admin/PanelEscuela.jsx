import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, School, Users, UserCheck, GraduationCap, Info } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getEscuelaActual, getEstadisticasEscuela } from '../../services/escuelas';

const PanelEscuela = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [escuela, setEscuela] = useState(null);
    const [stats, setStats] = useState({
        alumnosActivos: 0,
        usuariosActivos: 0,
        entrenadoresActivos: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [escuelaData, statsData] = await Promise.all([
                getEscuelaActual(),
                getEstadisticasEscuela()
            ]);
            setEscuela(escuelaData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-white">Cargando información de la escuela...</div>
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
                    <School />
                    Panel de Escuela
                </h1>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
                {/* Información de la Escuela - Premium Hero Card */}
                {escuela && (
                    <div className="bg-surface border border-border/40 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                                    <School size={40} className="text-primary" />
                                </div>
                                <h2 className="text-4xl font-extrabold text-white tracking-tight leading-none uppercase">{escuela.nombre}</h2>
                            </div>

                            <div className="space-y-2">
                                <p className="text-text-secondary text-sm font-medium tracking-wide">ID de Escuela</p>
                                <p className="text-white/80 font-mono text-sm inline-block py-1 pr-1">
                                    {escuela.id}
                                </p>
                            </div>
                        </div>
                        {/* Background subtle decoration */}
                        <div className="absolute -top-12 -right-12 bg-primary/5 w-64 h-64 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                )}

                {/* Estadísticas - Grid de 3 Columnas Estilizadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface border border-border/40 rounded-xl p-8 transition-all hover:border-primary/30 group shadow-lg">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-500/10 p-4 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                                    <GraduationCap size={32} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-sm font-medium">Alumnos Activos</p>
                                    <p className="text-white text-4xl font-black">{stats.alumnosActivos}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border/40 rounded-xl p-8 transition-all hover:border-success/30 group shadow-lg">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-success/10 p-4 rounded-xl group-hover:bg-success/20 transition-colors">
                                    <UserCheck size={32} className="text-success" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-sm font-medium">Entrenadores</p>
                                    <p className="text-white text-4xl font-black">{stats.entrenadoresActivos}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border/40 rounded-xl p-8 transition-all hover:border-blue-500/30 group shadow-lg">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/10 p-4 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                    <Users size={32} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-sm font-medium">Usuarios Totales</p>
                                    <p className="text-white text-4xl font-black">{stats.usuariosActivos}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acceso rápido - Grid de tarjetas grandes tipo Dashborad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => navigate('/admin/sucursales')}
                        className="bg-surface border border-border/40 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center gap-4 transition-all hover:border-primary hover:-translate-y-2 group shadow-xl active:scale-[0.98]"
                    >
                        <div className="text-white flex flex-col items-center gap-6">
                            <h3 className="text-2xl font-bold tracking-tight">Sucursales</h3>
                            <p className="text-text-secondary text-base max-w-[200px]">Gestionar sedes y ubicaciones</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/admin/usuarios')}
                        className="bg-surface border border-border/40 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center gap-4 transition-all hover:border-primary hover:-translate-y-2 group shadow-xl active:scale-[0.98]"
                    >
                        <div className="text-white flex flex-col items-center gap-6">
                            <h3 className="text-2xl font-bold tracking-tight">Usuarios</h3>
                            <p className="text-text-secondary text-base max-w-[200px]">Gestionar roles y permisos</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/admin/configuraciones')}
                        className="bg-surface border border-border/40 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center gap-4 transition-all hover:border-primary hover:-translate-y-2 group shadow-xl active:scale-[0.98]"
                    >
                        <div className="text-white flex flex-col items-center gap-6">
                            <h3 className="text-2xl font-bold tracking-tight line-clamp-2">Canchas y Horarios</h3>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PanelEscuela;
