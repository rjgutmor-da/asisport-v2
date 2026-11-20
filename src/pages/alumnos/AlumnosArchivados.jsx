import React, { useState, useEffect, useMemo } from 'react';
import MensualidadIngresoModal from '../../features/alumnos/components/MensualidadIngresoModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Users, Search, Merge } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getAlumnosArchivados, getAsistenciasArchivados, restaurarAlumno } from '../../services/alumnos';
import { ordenarAlumnosArchivados } from '../../features/alumnos/utils/alumnosArchivadosUtils';
import { combinarAlumnos } from '../../services/combinarAlumnos';
import CombinarAlumnosModal from '../../features/alumnos/components/CombinarAlumnosModal';
import TablaAlumnosArchivados from '../../features/alumnos/components/TablaAlumnosArchivados';
import DesktopNavbar from '../../components/layout/DesktopNavbar';

const AlumnosArchivados = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user, userProfile, role, escuelaId, isAdmin } = useAuth();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [alumnoRestaurado, setAlumnoRestaurado] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCombinarModal, setShowCombinarModal] = useState(false);
    const pageSize = 30;
    const scopeKey = ['alumnos', 'archivados', escuelaId, user?.id, role, userProfile?.sucursal_id];
    const ready = Boolean(user?.id && userProfile?.id === user.id && escuelaId && role);
    const { data: alumnos = [], isPending: loading, error, refetch } = useQuery({
        queryKey: [...scopeKey, 'lista'],
        queryFn: ({ signal }) => getAlumnosArchivados(role, user.id, { perfil: userProfile, signal }),
        enabled: ready,
        staleTime: 30_000
    });
    const alumnosOrdenados = useMemo(() => ordenarAlumnosArchivados(alumnos), [alumnos]);
    const alumnosFiltrados = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return alumnosOrdenados.filter(alumno =>
            `${alumno.nombres || ''} ${alumno.apellidos || ''}`.toLowerCase().includes(term)
        );
    }, [alumnosOrdenados, searchTerm]);
    const totalPages = Math.max(1, Math.ceil(alumnosFiltrados.length / pageSize));
    const page = Math.min(currentPage, totalPages);
    const alumnosPagina = alumnosFiltrados.slice((page - 1) * pageSize, page * pageSize);
    const idsPagina = alumnosPagina.map(alumno => alumno.id);
    const { data: asistencias = {}, error: errorAsistencias, refetch: recargarAsistencias } = useQuery({
        queryKey: [...scopeKey, 'asistencias', idsPagina],
        queryFn: ({ signal }) => getAsistenciasArchivados(role, user.id, idsPagina, { perfil: userProfile, signal }),
        enabled: ready && idsPagina.length > 0,
        staleTime: 30_000
    });

    useEffect(() => {
        if (error) addToast(error.message, 'error');
    }, [error, addToast]);

    const loadArchivados = () => queryClient.invalidateQueries({ queryKey: scopeKey });

    const quitarAlumnoRestaurado = (alumnoId) => {
        queryClient.setQueryData([...scopeKey, 'lista'], (prev = []) => prev.filter(alumno => alumno.id !== alumnoId));
        void loadArchivados();
    };

    const handleRestaurar = async (alumnoId, nombreCompleto) => {
        if (!window.confirm(`¿Estás seguro de restaurar a ${nombreCompleto}? El alumno volverá a aparecer en las listas activas.`)) {
            return;
        }

        try {
            const alumno = await restaurarAlumno(alumnoId);
            setAlumnoRestaurado(alumno);
            addToast('Alumno restaurado correctamente', 'success');
            quitarAlumnoRestaurado(alumnoId);
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
            {alumnoRestaurado && <MensualidadIngresoModal alumno={alumnoRestaurado}
                editable={role === 'Administrador' || role === 'SuperAdministrador'}
                onCerrar={() => setAlumnoRestaurado(null)} />}
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
                {error && alumnos.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary" role="alert">
                        <p>{error.message}</p>
                        <button onClick={() => refetch()} className="mt-4 text-primary">Reintentar</button>
                    </div>
                ) : alumnos.length === 0 ? (
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
                                {role === 'Entrenador'
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
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-surface border border-border rounded-md pl-10 pr-4 py-2 text-white placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        {/* Vista Tabla Modular */}
                        <TablaAlumnosArchivados
                            alumnos={alumnosPagina.map(alumno => ({ ...alumno, asistencias_count: asistencias[alumno.id] }))}
                            onRestaurar={handleRestaurar}
                            onSelectAlumno={(alumnoId) => navigate(`/alumnos/${alumnoId}`)}
                        />
                        {errorAsistencias && (
                            <p className="mt-3 text-sm text-text-secondary" role="alert">
                                {errorAsistencias.message}{' '}
                                <button onClick={() => recargarAsistencias()} className="text-primary">Reintentar</button>
                            </p>
                        )}
                        {alumnosFiltrados.length === 0 ? (
                            <p className="py-6 text-center text-text-secondary">No se encontraron alumnos.</p>
                        ) : (
                            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-secondary">
                                <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, alumnosFiltrados.length)} de {alumnosFiltrados.length}</span>
                                <div className="flex items-center gap-3">
                                    <button disabled={page === 1} onClick={() => setCurrentPage(page - 1)} className="text-primary disabled:opacity-40">Anterior</button>
                                    <span>{page} / {totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setCurrentPage(page + 1)} className="text-primary disabled:opacity-40">Siguiente</button>
                                </div>
                            </div>
                        )}
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
