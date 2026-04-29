import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(0);
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
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ email: emailClean, password: passwordClean })
            });

            const resData = await response.json();
            
            if (!response.ok) {
                if (response.status === 429 && resData.secondsLeft) {
                    setCountdown(resData.secondsLeft);
                    const interval = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(interval);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    setLoading(false);
                } else {
                    throw new Error(resData.error || 'Error al iniciar sesión');
                }
                return;
            }

            if (resData.session) {
                // Establecer la sesión manualmente en el cliente de Supabase
                await supabase.auth.setSession(resData.session);
            }

            const data = { user: resData.session?.user };
            const authError = null; // Evita entrar en el bloque de manejo de errores original


            if (authError) {
                console.error('🔴 Error Supabase Auth:', authError);
                // Manejar errores específicos de Supabase
                const message = authError.message;
                
                if (message.includes('Invalid login credentials') || authError.status === 400) {
                    throw new Error('Credenciales incorrectas. Verifica email y contraseña.');
                } else if (message.includes('Email not confirmed')) {
                    throw new Error('Tu correo no ha sido verificado. Revisa tu bandeja de entrada.');
                } else if (message.includes('rate limit') || authError.status === 429) {
                    throw new Error('Demasiados intentos. Por favor, espera un minuto antes de intentar de nuevo.');
                } else {
                    throw new Error(message || 'Error al conectar con el servidor.');
                }
            }

            if (data?.user) {
                console.log('🟢 Login exitoso para:', data.user.id);
                
                // No llamamos a refreshProfile aquí para evitar doble petición paralela
                // ya que AuthContext.onAuthStateChange ya lo hace.
                // Simplemente esperamos un poco y redirigimos.
                
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            } else {
                throw new Error('No se pudo establecer la sesión correctamente.');
            }
        } catch (err) {
            console.error('🔴 Error Catch en Login:', err);
            
            let userMessage = err.message;
            if (userMessage.toLowerCase().includes('aborted')) {
                userMessage = 'La conexión fue interrumpida por el navegador. Por favor, intenta de nuevo en unos segundos.';
            } else if (userMessage.toLowerCase().includes('fetch')) {
                userMessage = 'Error de red. Verifica tu conexión a internet.';
            }
            
            setError(userMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white mb-2">AsiSport</h1>
                    <p className="text-text-secondary">
                        Toma asistencia en 60 segundos y vuelve a entrenar
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
                            disabled={countdown > 0}
                            className="mt-6 font-bold text-lg h-12"
                        >
                            {countdown > 0 ? `Espera ${countdown}s` : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-text-secondary text-sm">
                    ¿Olvidaste tu contraseña? <Link to="/recuperar-contrasena" className="text-primary hover:underline">Recupérala aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
