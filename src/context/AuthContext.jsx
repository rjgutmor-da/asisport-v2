
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
    const [profileError, setProfileError] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const currentUserIdRef = useRef(null);
    const isFetchingRef = useRef(null); // Para evitar peticiones duplicadas en curso

    const prefetchMasterData = async (profile) => {
        try {
            const escuelaId = profile?.escuela_id;
            if (!escuelaId) return;

            console.log('📦 Iniciando prefetch de datos maestros para escuela:', escuelaId);
            
            await Promise.all([
                queryClient.prefetchQuery({ 
                    queryKey: queryKeys.sucursales, 
                    queryFn: () => getSucursales(escuelaId) 
                }),
                queryClient.prefetchQuery({ 
                    queryKey: queryKeys.entrenadores, 
                    queryFn: () => getEntrenadores(escuelaId) 
                }),
                queryClient.prefetchQuery({ 
                    queryKey: queryKeys.horarios, 
                    queryFn: () => getHorarios(escuelaId) 
                }),
                queryClient.prefetchQuery({ 
                    queryKey: queryKeys.canchas, 
                    queryFn: () => getCanchas(escuelaId) 
                }),
            ]);
            console.log('✅ Prefetch completado');
        } catch (error) {
            console.error('❌ Error en prefetchMasterData:', error);
        }
    };

    // Obtener perfil de usuario
    const fetchUserProfile = async (userId) => {
        if (!userId) return null;
        setFetchingProfile(true);
        console.log('📡 [Auth] Iniciando carga de perfil para:', userId);
        
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ [Auth] Error Supabase:', error.message);
                setProfileError(`Error DB: ${error.message}`);
                setUserProfile(null);
                setRole(null);
                return null;
            }

            if (data) {
                console.log('✅ [Auth] Perfil cargado:', data.nombres);
                setProfileError(null);
                setUserProfile(data);
                setRole(data.rol);
                return data;
            }
            
            setProfileError('No se encontró el registro del usuario en la tabla "usuarios".');
            return null;
        } catch (err) {
            console.error('💥 [Auth] Error crítico:', err);
            setProfileError(`Error Crítico: ${err.message}`);
            return null;
        } finally {
            setFetchingProfile(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const handleAuthAction = async (session, event = 'INITIAL') => {
            console.log(`📡 [Auth] Procesando evento: ${event}`);
            if (!session?.user) {
                if (isMounted) {
                    setUser(null);
                    setUserProfile(null);
                    setRole(null);
                    setLoading(false);
                }
                return;
            }
            const userId = session.user.id;
            if (isMounted) {
                setUser(session.user);
                currentUserIdRef.current = userId;
            }
            const profile = await fetchUserProfile(userId);
            if (isMounted) {
                if (profile) await prefetchMasterData(profile);
                setLoading(false);
                console.log(`✅ [Auth] Sistema listo para: ${session.user.email}`);
            }
        };

        // 1. Carga inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthAction(session, 'GET_SESSION');
        });

        // 2. Suscripción a cambios futuros
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return;
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                handleAuthAction(session, event);
            } else if (event === 'SIGNED_OUT') {
                if (isMounted) {
                    setUser(null);
                    setUserProfile(null);
                    setRole(null);
                    setLoading(false);
                    currentUserIdRef.current = null;
                    cacheService.clear();
                    queryClient.clear();
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        userProfile,
        profileError,
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

