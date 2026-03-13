import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Verificar si tenemos una sesión o un hash que indique recuperación
        // Supabase maneja esto automáticamente si el enlace es correcto
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Si no hay sesión, tal vez el enlace expiró o es inválido
                // Pero a veces el evento onAuthStateChange es mejor
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Error al actualizar contraseña:', err);
            setError(err.message || 'Error al actualizar la contraseña.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center p-10 bg-surface rounded-3xl border border-border shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="mb-6 w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Todo listo!</h2>
                    <p className="text-text-secondary">
                        Tu contraseña ha sido actualizada con éxito. Ahora puedes volver a entrar a tu cuenta.
                    </p>
                    <Button 
                        variant="primary" 
                        fullWidth
                        className="mt-8 h-12 rounded-xl font-bold" 
                        onClick={() => navigate('/login')}
                    >
                        Iniciar sesión ahora
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="bg-surface p-8 rounded-3xl border border-border shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                            <RefreshCw size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-white">Nueva contraseña</h1>
                        <p className="text-text-secondary mt-2">
                            Asegúrate de que sea una contraseña que puedas recordar.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4 relative">
                        <div className="relative">
                            <Input
                                label="Nueva Contraseña"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                className="pl-10 h-12 rounded-xl"
                            />
                            <Lock className="absolute left-3 top-[42px] text-text-secondary" size={18} />
                        </div>

                        <div className="relative">
                            <Input
                                label="Confirmar Contraseña"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                required
                                className="pl-10 h-12 rounded-xl"
                            />
                            <ShieldCheck className="absolute left-3 top-[42px] text-text-secondary" size={18} />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-error/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="text-error shrink-0" size={20} />
                                <p className="text-sm text-error font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            className="h-12 text-base font-bold rounded-xl mt-4 shadow-lg shadow-primary/20"
                        >
                            Cambiar mi contraseña
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
