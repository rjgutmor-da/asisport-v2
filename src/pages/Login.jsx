import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshProfile } = useAuth();

    // Clean error when user types
    useEffect(() => {
        if (error) setError(null);
    }, [email, password]);

    const handleLogin = async (e) => {
        e.preventDefault();

        const emailClean = email.trim();
        const passwordClean = password.trim();

        if (!emailClean || !passwordClean) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        setLoading(true);
        setError(null);
        console.log('🔵 Iniciando login con:', emailClean);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailClean,
                password: passwordClean,
            });

            if (error) {
                console.error('🔴 Error Supabase:', error);
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Credenciales incorrectas. Verifica email y contraseña.');
                } else {
                    throw new Error(error.message || 'Error al conectar con el servidor.');
                }
            }

            if (data?.user) {
                console.log('🟢 Login exitoso, actualizando perfil y redirigiendo...', data.user.id);
                // Forzar carga inmediata del perfil
                await refreshProfile(data.user.id);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 100);
            } else {
                throw new Error('El servidor no devolvió un usuario.');
            }
        } catch (err) {
            console.error('🔴 Error Catch:', err);
            setError(err.message);
            setLoading(false); // Solo desactivar loading si hay error. Si es éxito, dejamos que navegue.
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white mb-2">AsiSport</h1>
                    <p className="text-text-secondary">
                        Ingresa a tu cuenta para gestionar tu escuela
                    </p>
                </div>

                <div className="bg-surface p-6 rounded-lg border border-border space-y-6 shadow-lg">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Correo Electrónico"
                            type="email"
                            placeholder="ej. entrenador@asisport.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            autoComplete="email"
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="current-password"
                        />

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-error rounded-md">
                                <p className="text-sm text-error font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    {error}
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            className="mt-6 font-bold text-lg h-12"
                        >
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>

                <p className="text-center text-text-secondary text-sm">
                    ¿Olvidaste tu contraseña? <a href="#" className="text-primary hover:underline">Recupérala aquí</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
