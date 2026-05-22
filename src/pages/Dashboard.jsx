import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, UserPlus, Users, Cake, ClipboardCheck, BarChart3, Archive, School, Activity } from 'lucide-react';
import HeroCard from '../components/dashboard/HeroCard';
import ModuleCard from '../components/dashboard/ModuleCard';
import TabBar from '../components/dashboard/TabBar';
import { useAuth } from '../context/AuthContext';
import LogoPlaneta from '../assets/LogoPlaneta.png';
import { getEscuelaActual } from '../services/escuelas';
import { useState, useEffect } from 'react';
import { getSaasportUrl } from '../lib/navegacion';

const Dashboard = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [escuela, setEscuela] = useState(null);

    useEffect(() => {
        getEscuelaActual().then(setEscuela).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Header */}
            <header className="flex items-center justify-between pt-4 px-4 pb-4 md:px-8 md:py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-8">
                    <h1 className="text-[39px] font-black text-primary">
                        AsiSport
                    </h1>
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/dashboard')} className="text-white font-bold text-[23px] hover:text-primary transition-colors">Inicio</button>
                        <button onClick={() => navigate('/asistencia')} className="text-text-secondary hover:text-primary font-medium text-[23px] transition-colors">Asistencia</button>
                        <button onClick={() => navigate('/alumnos')} className="text-text-secondary hover:text-primary font-medium text-[23px] transition-colors">Alumnos</button>
                        <button onClick={() => navigate('/alumnos/cumpleanos')} className="text-text-secondary hover:text-primary font-medium text-[23px] transition-colors">Cumpleaños</button>
                        {(role === 'SuperAdministrador' || role === 'Administrador' || role === 'Dueño') && (
                            <a 
                                href={getSaasportUrl()} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-secondary hover:text-primary font-medium text-[23px] transition-colors"
                            >
                                SaaSport
                            </a>
                        )}
                    </nav>
                </div>
            </header>

            {/* Contenedor principal Responsive - Se añade padding superior en PC para bajar las tarjetas */}
            <div className="px-4 space-y-10 md:space-y-0 md:px-8 md:grid md:grid-cols-2 md:gap-12 max-w-7xl mx-auto md:pt-16 pb-12">

                {/* Columna Izquierda (Asistencia + Brand) - Ajustada para separar logo en móvil */}
                <div className="flex flex-col items-center gap-10 md:gap-8 pt-0 w-full">
                    <HeroCard
                        icon={<ClipboardCheck size={48} className="md:size-28" />}
                        label="Asistencia"
                        onClick={() => navigate('/asistencia')}
                        className="min-h-[140px] md:min-h-[440px]"
                    />
                    
                    {/* Brand Section: Logo + Phrase (Dynamic) */}
                    <div className="flex flex-col items-center text-center">
                        {escuela?.logo_url ? (
                            <div className="flex flex-col items-center gap-4">
                                <img 
                                    src={escuela.logo_url} 
                                    alt={`Logo ${escuela.nombre}`} 
                                    className="w-32 h-auto md:w-[210px] transition-transform hover:scale-105 duration-300 drop-shadow-2xl"
                                />

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

                {/* Columna Derecha - Grid de Módulos */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-2 md:content-start pt-0">
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



                    {/* Nuevo Módulo de Estadísticas (Solo Admin/Dueño/SuperAdmin) */}
                    {(role === 'SuperAdministrador' || role === 'Administrador' || role === 'Dueño') && (
                        <>
                            <ModuleCard
                                icon={<BarChart3 size={60} />}
                                label="Estadísticas"
                                onClick={() => navigate('/estadisticas')}
                                size="compact"
                            />
                        </>
                    )}




                    {/* Módulo de Alumnos Archivados */}
                    <ModuleCard
                        icon={<Archive size={60} />}
                        label="Alumnos Archivados"
                        onClick={() => navigate('/alumnos/archivados')}
                        size="compact"
                    />

                    {/* Módulo de Actividad (Solo SuperAdmin/Dueño/Administrador) */}
                    {(role === 'SuperAdministrador' || role === 'Administrador' || role === 'Dueño') && (
                        <ModuleCard
                            icon={<Activity size={60} />}
                            label="Actividad"
                            onClick={() => navigate('/registro-actividad')}
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
