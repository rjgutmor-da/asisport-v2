import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, UserPlus, Users, Cake, ClipboardCheck, BarChart3, Archive, School } from 'lucide-react';
import HeroCard from '../components/dashboard/HeroCard';
import ModuleCard from '../components/dashboard/ModuleCard';
import TabBar from '../components/dashboard/TabBar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { isOwner, role } = useAuth();

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Header */}
            <header className="flex items-center justify-between pt-4 px-4 pb-4 md:px-8 md:py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-8">
                    <h1 className="text-3xl font-black text-white">
                        AsiSport
                    </h1>
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/dashboard')} className="text-primary font-bold text-sm">Inicio</button>
                        <button onClick={() => navigate('/asistencia')} className="text-text-secondary hover:text-white font-medium text-sm transition-colors">Asistencia</button>
                        <button onClick={() => navigate('/alumnos')} className="text-text-secondary hover:text-white font-medium text-sm transition-colors">Alumnos</button>
                        <button onClick={() => navigate('/alumnos/cumpleanos')} className="text-text-secondary hover:text-white font-medium text-sm transition-colors">Cumpleaños</button>
                    </nav>
                </div>
                {(role === 'SuperAdministrador' || role === 'Administrador' || role === 'Dueño') && (
                    <button
                        className="p-2 hover:bg-surface rounded-md transition-fast"
                        onClick={() => {
                            if (role === 'Dueño') {
                                navigate('/admin/usuarios');
                            } else {
                                navigate('/admin/configuraciones');
                            }
                        }}
                    >
                        <Settings size={32} className="text-white" />
                    </button>
                )}
            </header>

            {/* Contenedor principal Responsive */}
            <div className="px-4 space-y-4 md:px-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 max-w-7xl mx-auto">

                {/* Columna Izquierda (Desktop) / Top (Mobile) - Hero Action */}
                <div className="md:flex md:flex-col md:justify-center">
                    <HeroCard
                        icon={<ClipboardCheck size={80} className="md:w-28 md:h-28" />}
                        label="Asistencia"
                        onClick={() => navigate('/asistencia')}
                        className="min-h-[200px] md:min-h-[400px]"
                    />
                </div>

                {/* Columna Derecha (Desktop) / Bottom (Mobile) - Grid de Módulos */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-2 md:content-center">
                    <ModuleCard
                        icon={<UserPlus size={60} />}
                        label="Registro Alumnos"
                        onClick={() => navigate('/alumnos/registro')}
                        size="compact"
                    />

                    <ModuleCard
                        icon={<Users size={60} />}
                        label="Lista de Alumnos"
                        onClick={() => navigate('/alumnos')}
                        size="compact"
                    />

                    <ModuleCard
                        icon={<Cake size={60} />}
                        label="Cumpleaños"
                        onClick={() => navigate('/alumnos/cumpleanos')}
                        size="compact"
                    />



                    {/* Nuevo Módulo de Estadísticas */}
                    <ModuleCard
                        icon={<BarChart3 size={60} />}
                        label="Estadísticas"
                        onClick={() => navigate('/estadisticas')}
                        size="compact"
                    />

                    {/* Módulo de Admin Usuarios (Solo Dueño) */}
                    {isOwner && (
                        <ModuleCard
                            icon={<Settings size={60} />}
                            label="Admin Usuarios"
                            onClick={() => navigate('/admin/usuarios')}
                            size="compact"
                        />
                    )}

                    {/* Módulo de Configuraciones (Admin/SuperAdmin) */}
                    {(role === 'SuperAdministrador' || role === 'Administrador') && (
                        <ModuleCard
                            icon={<Settings size={60} className="text-primary" />}
                            label="Configuraciones"
                            onClick={() => navigate('/admin/configuraciones')}
                            size="compact"
                        />
                    )}

                    {/* Módulo de Alumnos Archivados */}
                    <ModuleCard
                        icon={<Archive size={60} />}
                        label="Alumnos Archivados"
                        onClick={() => navigate('/alumnos/archivados')}
                        size="compact"
                    />

                    {/* Módulo de Panel Escuela (Solo SuperAdmin) */}
                    {role === 'SuperAdministrador' && (
                        <ModuleCard
                            icon={<School size={60} />}
                            label="Panel de Escuela"
                            onClick={() => navigate('/admin/escuela')}
                            size="compact"
                        />
                    )}
                </div>
            </div>


            {/* Tab Bar (Solo Mobile) */}
            <TabBar />

            {/* Indicador de Sesión Sutil */}
            <div className="hidden md:block fixed bottom-4 right-4 text-[10px] text-text-secondary/30 font-mono pointer-events-none">
                {role} • {useAuth()?.user?.email}
            </div>
        </div>
    );
};

export default Dashboard;
