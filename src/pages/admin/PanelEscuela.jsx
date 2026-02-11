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

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Información de la Escuela */}
                {escuela && (
                    <div className="bg-surface border border-border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <School size={28} className="text-primary" />
                            <h2 className="text-2xl font-bold text-white">{escuela.nombre}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-text-secondary mb-1">ID de Escuela</p>
                                <p className="text-white font-mono bg-background px-2 py-1 rounded border border-border inline-block">
                                    {escuela.id}
                                </p>
                            </div>
                            {escuela.direccion && (
                                <div>
                                    <p className="text-text-secondary mb-1">Dirección</p>
                                    <p className="text-white">{escuela.direccion}</p>
                                </div>
                            )}
                            {escuela.telefono && (
                                <div>
                                    <p className="text-text-secondary mb-1">Teléfono</p>
                                    <p className="text-white">{escuela.telefono}</p>
                                </div>
                            )}
                            {escuela.email && (
                                <div>
                                    <p className="text-text-secondary mb-1">Email</p>
                                    <p className="text-white">{escuela.email}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface border border-border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-primary/20 p-3 rounded-lg">
                                <GraduationCap size={24} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm">Alumnos Activos</p>
                                <p className="text-white text-3xl font-bold">{stats.alumnosActivos}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-success/20 p-3 rounded-lg">
                                <UserCheck size={24} className="text-success" />
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm">Entrenadores</p>
                                <p className="text-white text-3xl font-bold">{stats.entrenadoresActivos}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-500/20 p-3 rounded-lg">
                                <Users size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm">Usuarios Totales</p>
                                <p className="text-white text-3xl font-bold">{stats.usuariosActivos}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información sobre Gestión de Usuarios */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <div className="flex gap-3">
                        <Info size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Gestión de Usuarios</h3>
                            <p className="text-text-secondary text-sm mb-3">
                                Para agregar nuevos usuarios a la escuela, sigue estos pasos:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-text-secondary text-sm">
                                <li>Ve al <b className="text-white">Dashboard de Supabase</b></li>
                                <li>Navega a <b className="text-white">Authentication → Users</b></li>
                                <li>Haz clic en <b className="text-white">"Invite User"</b></li>
                                <li>Ingresa el <b className="text-white">email del usuario</b></li>
                                <li>El usuario recibirá un email de invitación</li>
                                <li>Después asigna el rol en <b className="text-white">Admin → Usuarios</b></li>
                            </ol>
                            <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded">
                                <p className="text-warning text-xs">
                                    <b>Nota:</b> La funcionalidad de invitación directa desde esta interfaz requiere configuración adicional
                                    con Edge Functions de Supabase. Por ahora, usa el método manual descrito arriba.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acceso rápido */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Accesos Rápidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/admin/usuarios')}
                            className="px-4 py-3 bg-background border border-border text-white rounded-md hover:border-primary transition-colors text-left"
                        >
                            <p className="font-semibold">Administrar Usuarios</p>
                            <p className="text-text-secondary text-sm">Gestionar roles y permisos</p>
                        </button>
                        <button
                            onClick={() => navigate('/admin/configuraciones')}
                            className="px-4 py-3 bg-background border border-border text-white rounded-md hover:border-primary transition-colors text-left"
                        >
                            <p className="font-semibold">Configuraciones</p>
                            <p className="text-text-secondary text-sm">Canchas y horarios</p>
                        </button>
                        <button
                            onClick={() => navigate('/alumnos')}
                            className="px-4 py-3 bg-background border border-border text-white rounded-md hover:border-primary transition-colors text-left"
                        >
                            <p className="font-semibold">Lista de Alumnos</p>
                            <p className="text-text-secondary text-sm">Ver todos los alumnos activos</p>
                        </button>
                        <button
                            onClick={() => navigate('/estadisticas')}
                            className="px-4 py-3 bg-background border border-border text-white rounded-md hover:border-primary transition-colors text-left"
                        >
                            <p className="font-semibold">Estadísticas</p>
                            <p className="text-text-secondary text-sm">Métricas y reportes</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PanelEscuela;
