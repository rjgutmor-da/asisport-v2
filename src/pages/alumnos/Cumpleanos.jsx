
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Calendar, Clock } from 'lucide-react';
import AlumnoCard from '../../features/alumnos/components/AlumnoCard';
import { useCumpleanos } from '../../features/alumnos/hooks/useCumpleanos';

const Cumpleanos = () => {
    const navigate = useNavigate();
    const { loading, today, yesterday, tomorrow } = useCumpleanos();

    // Mensaje personalizado para WhatsApp
    // Mensaje personalizado para WhatsApp
    const birthdayMessage = "Feliz cumpleaños #nombre, que sigas siendo un crack dentro y fuera de la cancha ⚽🎂🎉";

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-white hover:text-primary transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <Gift className="text-primary" size={24} />
                    <h1 className="text-xl font-bold text-white">Cumpleaños</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-8">

                {/* SECCIÓN HOY (Destacada) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-3 h-8 bg-primary rounded-full"></span>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                            Hoy
                        </h2>
                        <span className="text-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            {today.length}
                        </span>
                    </div>

                    {today.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {today.map(alumno => (
                                <AlumnoCard
                                    key={alumno.id}
                                    alumno={alumno}
                                    onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                    variant="highlight"
                                    customWhatsAppMessage={birthdayMessage}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface border border-border/50 rounded-lg p-8 text-center">
                            <Gift className="mx-auto text-text-secondary mb-2 opacity-50" size={40} />
                            <p className="text-text-secondary">No hay cumpleaños hoy.</p>
                        </div>
                    )}
                </section>

                {/* SECCIÓN AYER (Muted) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="text-text-secondary" size={20} />
                        <h2 className="text-lg font-bold text-text-secondary">
                            Ayer
                        </h2>
                    </div>

                    {yesterday.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {yesterday.map(alumno => (
                                <AlumnoCard
                                    key={alumno.id}
                                    alumno={alumno}
                                    onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                    variant="muted"
                                    customWhatsAppMessage={birthdayMessage}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary/50 italic">Nadie cumplió años ayer.</p>
                    )}
                </section>

                {/* SECCIÓN MAÑANA (Normal) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="text-white" size={20} />
                        <h2 className="text-lg font-bold text-white">
                            Mañana
                        </h2>
                    </div>

                    {tomorrow.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tomorrow.map(alumno => (
                                <AlumnoCard
                                    key={alumno.id}
                                    alumno={alumno}
                                    onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                    variant="default"
                                    customWhatsAppMessage={birthdayMessage}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary/50 italic">Nadie cumple años mañana.</p>
                    )}
                </section>

            </main>
        </div>
    );
};

export default Cumpleanos;
