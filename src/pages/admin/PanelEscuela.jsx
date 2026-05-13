import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, School, Users, UserCheck, GraduationCap, Info, MapPin, Calendar, Activity } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getEscuelaActual, getEstadisticasEscuela } from '../../services/escuelas';
import LogoPlaneta from '../../assets/LogoPlaneta.png';
import { volverOIrAPanel, rutaConOrigin } from '../../lib/navegacion';

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
                <button onClick={() => volverOIrAPanel(navigate, '/dashboard')} className="text-white hover:text-primary transition-colors">
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
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            {/* Nombre e ID */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                                        <School size={32} className="text-primary" />
                                    </div>
                                    <h2 className="text-4xl font-extrabold text-white tracking-tight leading-none uppercase">{escuela.nombre}</h2>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-text-secondary text-[10px] uppercase font-bold tracking-widest opacity-50">ID de Escuela</p>
                                    <p className="text-white/60 font-mono text-sm">
                                        {escuela.id}
                                    </p>
                                </div>
                            </div>

                            {/* Logo y Frase - Estilo Dashboard */}
                            <div className="flex flex-col items-center gap-2">
                                {escuela.logo_url ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img 
                                            src={escuela.logo_url} 
                                            alt="Logo Escuela" 
                                            className="w-44 h-auto md:w-[280px] transition-transform hover:scale-105 duration-300 drop-shadow-2xl"
                                        />
                                        {escuela.slogan && (
                                            <p className="text-white/80 italic text-xl md:text-2xl font-light font-serif">
                                                {escuela.slogan}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <img 
                                        src={LogoPlaneta} 
                                        alt="Logo Planeta FC" 
                                        className="w-44 h-auto md:w-[340px] transition-transform hover:scale-105 duration-300"
                                    />
                                )}
                            </div>
                        </div>
                        
                        {/* Background subtle decoration */}
                        <div className="absolute -top-12 -right-12 bg-primary/5 w-64 h-64 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -left-12 bg-blue-500/5 w-48 h-48 rounded-full blur-3xl pointer-events-none"></div>
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

                {/* Acceso rápido - Grid de tarjetas estilizadas en una sola fila */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate(rutaConOrigin('/admin/sucursales'))}
                        className="bg-surface border border-border/40 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all hover:border-primary hover:-translate-y-1 group shadow-lg active:scale-[0.98]"
                    >
                        <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <MapPin size={28} className="text-primary" />
                        </div>
                        <div className="text-white">
                            <h3 className="text-lg font-bold tracking-tight">Sucursales</h3>
                            <p className="text-text-secondary text-xs mt-1">Gestionar sedes</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate(rutaConOrigin('/admin/usuarios'))}
                        className="bg-surface border border-border/40 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all hover:border-primary hover:-translate-y-1 group shadow-lg active:scale-[0.98]"
                    >
                        <div className="bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Users size={28} className="text-blue-400" />
                        </div>
                        <div className="text-white">
                            <h3 className="text-lg font-bold tracking-tight">Usuarios</h3>
                            <p className="text-text-secondary text-xs mt-1">Roles y permisos</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate(rutaConOrigin('/admin/configuraciones'))}
                        className="bg-surface border border-border/40 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all hover:border-primary hover:-translate-y-1 group shadow-lg active:scale-[0.98]"
                    >
                        <div className="bg-success/10 p-3 rounded-lg group-hover:bg-success/20 transition-colors">
                            <Calendar size={28} className="text-success" />
                        </div>
                        <div className="text-white">
                            <h3 className="text-lg font-bold tracking-tight">Canchas y Horarios</h3>
                            <p className="text-text-secondary text-xs mt-1">Configuración general</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate(rutaConOrigin('/registro-actividad'))}
                        className="bg-surface border border-border/40 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all hover:border-primary hover:-translate-y-1 group shadow-lg active:scale-[0.98]"
                    >
                        <div className="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                            <Activity size={28} className="text-purple-400" />
                        </div>
                        <div className="text-white">
                            <h3 className="text-lg font-bold tracking-tight">Actividad</h3>
                            <p className="text-text-secondary text-xs mt-1">Auditoría de acciones</p>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PanelEscuela;
