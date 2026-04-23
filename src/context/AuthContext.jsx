
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

    // Obtener perfil de usuario con protección
    const fetchUserProfile = async (userId) => {
        if (isFetchingRef.current === userId) {
            console.log('⏳ Ya hay una petición de perfil en curso para:', userId);
            return null;
        }
        
        isFetchingRef.current = userId;
        setFetchingProfile(true);
        
        try {
            console.log('🔍 Buscando perfil en DB para usuario:', userId);
            
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Error de Supabase al cargar perfil:', error.message, error.details);
                setUserProfile(null);
                setRole(null);
                return null;
            }

            if (data) {
                console.log('👤 Perfil cargado correctamente:', data.nombres, `(${data.rol})`);
                setUserProfile(data);
                setRole(data.rol);
                return data;
            }
            
            console.warn('⚠️ No se encontró registro en la tabla "usuarios" para el ID de Auth');
            return null;
        } catch (err) {
            console.error('💥 Error crítico al cargar perfil:', err);
            return null;
        } finally {
            setFetchingProfile(false);
            isFetchingRef.current = null;
        }
    };

    useEffect(() => {
        // TIMEOUT DE SEGURIDAD
        const failsafeTimeout = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ Timeout de seguridad alcanzado. Forzando desactivación de loading.');
                setLoading(false);
            }
        }, 8000);

        // Función unificada para inicializar la sesión y el perfil
        const initializeAuth = async () => {
            try {
                console.group('🔐 Inicialización de Auth');
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;

                if (session?.user) {
                    console.log('✅ Sesión encontrada para:', session.user.email);
                    setUser(session.user);
                    currentUserIdRef.current = session.user.id;
                    
                    // IMPORTANTE: Esperamos a que el perfil se cargue antes de quitar el loading
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        await prefetchMasterData(profile);
                    }
                } else {
                    console.log('ℹ️ No hay sesión activa.');
                    setUser(null);
                    setUserProfile(null);
                    setRole(null);
                }
            } catch (error) {
                console.error('❌ Error inicializando auth:', error);
            } finally {
                setLoading(false);
                console.groupEnd();
            }
        };

        initializeAuth();

        // Escuchar cambios de autenticación (solo para login/logout posterior)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Si el evento es INITIAL_SESSION, lo ignoramos porque initializeAuth ya se encarga
            if (event === 'INITIAL_SESSION') return;

            console.group(`🔔 Evento de Auth: ${event}`);
            
            if (session?.user) {
                if (session.user.id !== currentUserIdRef.current) {
                    console.log('🆕 Cambio de usuario detectado:', session.user.email);
                    currentUserIdRef.current = session.user.id;
                    setUser(session.user);
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        await prefetchMasterData(profile);
                    }
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 Sesión cerrada');
                currentUserIdRef.current = null;
                setUser(null);
                setUserProfile(null);
                setRole(null);
                cacheService.clear();
                queryClient.clear();
                setLoading(false);
            }
            
            console.groupEnd();
        });

        return () => {
            clearTimeout(failsafeTimeout);
            subscription.unsubscribe();
        };
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

