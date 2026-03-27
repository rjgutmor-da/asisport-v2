import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RecuperarContrasena = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                if (error.message.includes('rate limit') || error.message.includes('Too many')) {
                    throw new Error('Demasiados intentos. Por favor espera unos minutos antes de volver a intentarlo.');
                }
                throw error;
            }
            
            // Por seguridad, siempre mostramos el mismo mensaje independientemente
            // de si el correo existe o no en el sistema
            setMessage('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.');
        } catch (err) {
            console.error('Error al solicitar recuperación:', err);
            setError(err.message || 'Error al conectar con el servidor. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio de sesión
                </Link>

                <div className="bg-surface p-8 rounded-2xl border border-border shadow-2xl space-y-6 relative overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                            <KeyRound size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-white">¿Olvidaste tu contraseña?</h1>
                        <p className="text-text-secondary mt-2">
                            No te preocupes, suele pasar. Ingresa tu correo y te ayudaremos a recuperarla.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4 relative">
                        <div className="relative">
                            <Input
                                label="Correo Electrónico"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                                className="pl-10"
                            />
                            <Mail className="absolute left-3 top-[38px] text-text-secondary" size={18} />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-error/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="text-error shrink-0" size={20} />
                                <p className="text-sm text-error font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {message && (
                            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                                <p className="text-sm text-green-400 font-medium">
                                    {message}
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            className="h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
                        >
                            Enviar instrucciones
                        </Button>
                    </form>
                </div>
                
                <p className="text-center text-text-secondary text-sm mt-8">
                    ¿Problemas? <a href="mailto:soporte@asisport.com" className="text-primary hover:underline font-medium">Contacta a soporte</a>
                </p>
            </div>
        </div>
    );
};

export default RecuperarContrasena;
