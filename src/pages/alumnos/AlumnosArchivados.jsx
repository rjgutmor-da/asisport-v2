import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Users, Search, Merge } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getAlumnosArchivados, restaurarAlumno } from '../../services/alumnos';
import { combinarAlumnos } from '../../services/combinarAlumnos';
import CombinarAlumnosModal from '../../features/alumnos/components/CombinarAlumnosModal';
import TablaAlumnosArchivados from '../../features/alumnos/components/TablaAlumnosArchivados';
import DesktopNavbar from '../../components/layout/DesktopNavbar';

const AlumnosArchivados = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user, isAdmin } = useAuth();

    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCombinarModal, setShowCombinarModal] = useState(false);

    useEffect(() => {
        loadArchivados();
    }, []);

    const loadArchivados = async () => {
        try {
            const data = await getAlumnosArchivados(user.rol, user.id);
            setAlumnos(data);
        } catch (error) {
            console.error(error);
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestaurar = async (alumnoId, nombreCompleto) => {
        if (!window.confirm(`¿Estás seguro de restaurar a ${nombreCompleto}? El alumno volverá a aparecer en las listas activas.`)) {
            return;
        }

        try {
            await restaurarAlumno(alumnoId);
            addToast('Alumno restaurado correctamente', 'success');
            loadArchivados();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleCombinar = async (destinoId, origenId) => {
        try {
            await combinarAlumnos(destinoId, origenId, { soloArchivados: true });
            addToast('Alumnos archivados combinados correctamente', 'success');
            await loadArchivados();
        } catch (error) {
            addToast(error.message || 'Error al combinar alumnos archivados', 'error');
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-white">Cargando alumnos archivados...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Archive />
                        Alumnos Archivados
                    </h1>
                </div>

                {/* Menú de navegación superior para escritorio */}
                <div className="hidden md:flex items-center gap-6 flex-grow justify-start pl-8">
                    <DesktopNavbar className="text-[18px]" />
                </div>

                {isAdmin && alumnos.length > 1 && (
                    <button
                        onClick={() => setShowCombinarModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning border border-warning/30 rounded-md text-sm font-bold hover:bg-warning/20 transition-colors"
                        title="Combinar solo alumnos archivados"
                    >
                        <Merge size={16} />
                        <span className="hidden sm:inline">Combinar duplicados</span>
                    </button>
                )}
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6">
                {alumnos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <Users size={80} className="text-text-secondary mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">
                            No hay alumnos archivados
                        </h2>
                        <p className="text-text-secondary">
                            Los alumnos archivados aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="text-text-secondary text-sm">
                                {user.rol === 'Entrenador'
                                    ? `Mostrando tus alumnos archivados (${alumnos.length})`
                                    : `Mostrando todos los alumnos archivados de la escuela (${alumnos.length})`
                                }
                            </div>

                            {/* Buscador */}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o apellido..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-md pl-10 pr-4 py-2 text-white placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        {/* Vista Tabla Modular */}
                        <TablaAlumnosArchivados
                            alumnos={alumnos}
                            searchTerm={searchTerm}
                            onRestaurar={handleRestaurar}
                            onSelectAlumno={(alumnoId) => navigate(`/alumnos/${alumnoId}`)}
                        />
                    </>
                )}
            </main>

            <CombinarAlumnosModal
                isOpen={showCombinarModal}
                onClose={() => setShowCombinarModal(false)}
                alumnos={alumnos}
                soloArchivados
                onCombinar={handleCombinar}
            />
        </div>
    );
};

export default AlumnosArchivados;
