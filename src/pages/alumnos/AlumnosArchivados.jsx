import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, RotateCcw, Users } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getAlumnosArchivados, restaurarAlumno } from '../../services/alumnos';
import AlumnoCard from '../../features/alumnos/components/AlumnoCard';

const AlumnosArchivados = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user } = useAuth();

    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Archive />
                    Alumnos Archivados
                </h1>
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
                        <div className="mb-4 text-text-secondary text-sm">
                            {user.rol === 'Entrenador'
                                ? `Mostrando tus alumnos archivados (${alumnos.length})`
                                : `Mostrando todos los alumnos archivados de la escuela (${alumnos.length})`
                            }
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alumnos.map((alumno) => (
                                <div key={alumno.id} className="relative">
                                    {/* Badge "Archivado" */}
                                    <div className="absolute top-2 right-2 z-10 bg-error/90 text-white text-xs font-bold px-2 py-1 rounded">
                                        ARCHIVADO
                                    </div>

                                    {/* Card del alumno (con opacidad reducida) */}
                                    <div className="opacity-75">
                                        <AlumnoCard
                                            alumno={alumno}
                                            onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                        />
                                    </div>

                                    {/* Botón de Restaurar */}
                                    <div className="mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRestaurar(alumno.id, `${alumno.nombres} ${alumno.apellidos}`);
                                            }}
                                            className="w-full bg-success text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw size={18} />
                                            Restaurar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AlumnosArchivados;
