import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, RotateCcw, Users } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getAlumnosArchivados, restaurarAlumno } from '../../services/alumnos';

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

                        {/* Vista Tabla */}
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-surface border-b border-border">
                                        <th className="text-left text-text-secondary font-semibold px-4 py-3">Nombre</th>
                                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden sm:table-cell">Cancha</th>
                                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden md:table-cell">Horario</th>
                                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden md:table-cell">Asistencias</th>
                                        <th className="text-center text-text-secondary font-semibold px-4 py-3">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumnos.map((alumno) => (
                                        <tr
                                            key={alumno.id}
                                            className="border-b border-border/50 hover:bg-surface/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Foto o iniciales (miniatura) */}
                                                    {alumno.foto_url ? (
                                                        <img
                                                            src={alumno.foto_url}
                                                            alt={`${alumno.nombres} ${alumno.apellidos}`}
                                                            className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-bold text-primary">
                                                                {(alumno.nombres?.[0] || '')}{(alumno.apellidos?.[0] || '')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium truncate">
                                                            {alumno.apellidos}, {alumno.nombres}
                                                        </p>
                                                        {/* Info adicional visible solo en móvil */}
                                                        <p className="text-text-secondary text-xs sm:hidden">
                                                            {alumno.cancha?.nombre || 'Sin cancha'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                                                {alumno.cancha?.nombre || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                                                {alumno.horario?.hora || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                                                {alumno.asistencias_count || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRestaurar(alumno.id, `${alumno.nombres} ${alumno.apellidos}`);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 bg-success text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors"
                                                >
                                                    <RotateCcw size={14} />
                                                    Restaurar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AlumnosArchivados;
