/**
 * AuthRedirect.jsx — Receptor de tokens SSO desde SaaSport.
 *
 * Cuando SaaSport navega a AsisPort con tokens en la URL:
 *   /auth-redirect?token=...&refresh=...&redirect=/dashboard
 *
 * Esta página:
 *  1. Lee los tokens de los query params
 *  2. Los establece en Supabase con setSession()
 *  3. Redirige al usuario a su destino final
 *
 * Seguridad: Los tokens JWT son efímeros (expire en ~1 hora) y la conexión
 * está protegida por HTTPS en producción.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AuthRedirect = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [estado, setEstado] = useState('Iniciando sesión...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const procesarTokens = async () => {
            const accessToken = searchParams.get('token');
            const refreshToken = searchParams.get('refresh');
            const rutaDestino = searchParams.get('redirect') || '/dashboard';

            // Si no hay tokens, redirigir al login normal
            if (!accessToken || !refreshToken) {
                setEstado('Sin tokens. Redirigiendo al inicio de sesión...');
                setTimeout(() => navigate('/login', { replace: true }), 1500);
                return;
            }

            try {
                setEstado('Estableciendo sesión...');

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    throw sessionError;
                }

                setEstado('¡Sesión establecida! Redirigiendo...');

                // Pequeña pausa para que el AuthContext procese el cambio de sesión
                setTimeout(() => {
                    navigate(rutaDestino, { replace: true });
                }, 500);

            } catch (err) {
                console.error('Error al establecer sesión SSO:', err);
                setError('No se pudo establecer la sesión. Por favor inicia sesión manualmente.');
                setTimeout(() => navigate('/login', { replace: true }), 2500);
            }
        };

        procesarTokens();
    }, []); // Solo ejecutar una vez al montar

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center space-y-6">

                {/* Logo / Marca */}
                <h1 className="text-3xl font-black text-primary">AsiSport</h1>

                {/* Estado de la operación */}
                {!error ? (
                    <div className="space-y-4">
                        {/* Spinner */}
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-text-secondary text-sm">{estado}</p>
                    </div>
                ) : (
                    <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                        <p className="text-xs text-text-secondary mt-2">Redirigiendo al inicio de sesión...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthRedirect;
