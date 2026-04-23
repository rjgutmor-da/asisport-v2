
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
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const currentUserIdRef = useRef(null);
    const isFetchingRef = useRef(null); // Para evitar peticiones duplicadas en curso

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
        if (isFetchingRef.current === userId) return;
        isFetchingRef.current = userId;
        setFetchingProfile(true);
        
        try {
            console.log('🔍 Buscando perfil para:', userId);
            console.time(`Perfil-${userId}`);
            
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            console.timeEnd(`Perfil-${userId}`);
            console.log('✅ Resultado perfil:', { data, error });

            if (error) {
                console.error('Error al cargar perfil:', error);
                setUserProfile(null);
                setRole(null);
                return;
            }

            if (data) {
                setUserProfile(data);
                setRole(data.rol);
                return data;
            }
            return null;
        } catch (err) {
            console.error('Error inesperado al cargar perfil:', err);
            return null;
        } finally {
            console.timeEnd(`Perfil-${userId}`);
            setFetchingProfile(false);
            isFetchingRef.current = null;
        }
    };

    useEffect(() => {
        // 1. Verificar sesión activa al montar
        const checkSession = async () => {
            try {
                console.log('🔄 Verificando sesión inicial...');
                console.time('SessionCheck');
                
                const { data: { session }, error } = await supabase.auth.getSession();
                
                console.timeEnd('SessionCheck');
                console.log('ℹ️ Sesión inicial:', session ? 'Encontrada' : 'No existe', error || '');

                if (session?.user) {
                    setUser(session.user);
                    currentUserIdRef.current = session.user.id;
                    // Aseguramos que el perfil se cargue ANTES de quitar el loading
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile?.escuela_id) {
                        prefetchMasterData();
                    }
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
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile?.escuela_id) {
                        prefetchMasterData();
                    }
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

