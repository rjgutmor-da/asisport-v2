
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { cacheService } from '../lib/cacheService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/useMasterData';
import { getAlumnos } from '../services/alumnos';
import { getCanchas, getHorarios, getEntrenadores } from '../services/maestros';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentUserIdRef = useRef(null);

    const prefetchMasterData = async () => {
        try {
            await Promise.all([
                queryClient.prefetchQuery({ queryKey: queryKeys.alumnos, queryFn: getAlumnos }),
                queryClient.prefetchQuery({ queryKey: queryKeys.entrenadores, queryFn: getEntrenadores }),
                queryClient.prefetchQuery({ queryKey: queryKeys.canchas, queryFn: getCanchas }),
                queryClient.prefetchQuery({ queryKey: queryKeys.horarios, queryFn: getHorarios }),
            ]);
        } catch (error) {
            console.error('Error en prefetchMasterData:', error);
        }
    };

    // Obtener perfil de usuario con timeout de protección
    const fetchUserProfile = async (userId) => {
        try {
            const queryPromise = supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            // Timeout de 8 segundos para evitar que la app se quede colgada
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout al cargar perfil')), 8000)
            );

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            if (error) {
                console.error('Error al cargar perfil:', error);
                setUserProfile(null);
                setRole(null);
                return;
            }

            if (data) {
                setUserProfile(data);
                setRole(data.rol);
            }
        } catch (err) {
            console.error('Error inesperado al cargar perfil:', err);
            setUserProfile(null);
            setRole(null);
        }
    };

    useEffect(() => {
        // 1. Verificar sesión activa al montar
        const checkSession = async () => {
            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session check timeout')), 5000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (session?.user) {
                    setUser(session.user);
                    currentUserIdRef.current = session.user.id;
                    await fetchUserProfile(session.user.id);
                    prefetchMasterData(); // PREFETCH en mount si hay sesión
                } else {
                    setUser(null);
                    setUserProfile(null);
                    setRole(null);
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                setUser(null);
                setUserProfile(null);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // 2. Escuchar cambios de autenticación (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Solo procesar si es un usuario DIFERENTE al actual
                if (session.user.id !== currentUserIdRef.current) {
                    currentUserIdRef.current = session.user.id;
                    setUser(session.user);
                    await fetchUserProfile(session.user.id);
                    prefetchMasterData(); // PREFETCH tras nuevo login
                }
            } else {
                // Logout — limpiar caché de datos maestros
                currentUserIdRef.current = null;
                setUser(null);
                setUserProfile(null);
                setRole(null);
                cacheService.clear();
                queryClient.clear(); // Limpiar caché de react-query en DB en logout
            }
            // Siempre asegurar que loading sea false después de procesar
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        userProfile,
        role,
        loading,
        escuelaId: userProfile?.escuela_id || null,
        sucursalId: userProfile?.sucursal_id || null, // Exportar sucursalId
        isAdmin: role === 'Administrador' || role === 'Dueño' || role === 'SuperAdministrador',
        isOwner: role === 'Dueño',
        isCoach: role === 'Entrenador',
        isGoalkeeperCoach: role === 'Entrenarqueros',
        refreshProfile: async (userId) => {
            const idToFetch = userId || currentUserIdRef.current;
            if (idToFetch) {
                // Asegurarnos de tener el usuario de auth actualizado también
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    setUser(authUser);
                    currentUserIdRef.current = authUser.id;
                }
                await fetchUserProfile(idToFetch);
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-background">
                    <div className="text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-text-secondary text-sm">Cargando...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

