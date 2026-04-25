import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { asistenciasKeys } from './useAsistenciasQuery';

/**
 * Hook de Realtime para Asistencias.
 * Escucha cambios en la tabla asistencias_normales e invalida la caché de TanStack Query.
 * Restricción: Solo reacciona a cambios con la fecha de HOY para evitar re-fetches históricos.
 */
export const useAsistenciasRealtime = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Obtenemos la fecha de hoy en formato YYYY-MM-DD local
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hoyStr = `${year}-${month}-${day}`;

        const channel = supabase
            .channel('asistencias-hoy-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'asistencias_normales',
                    filter: `fecha=eq.${hoyStr}` // FILTRO CRÍTICO: Solo hoy
                },
                (payload) => {
                    console.log('[Realtime] Cambio detectado en asistencias hoy:', payload);
                    
                    // Invalidación quirúrgica:
                    // Solo refresca las queries cuya fecha coincida con el cambio (hoy)
                    queryClient.invalidateQueries({
                        queryKey: asistenciasKeys.all,
                        predicate: (query) => {
                            const queryFecha = query.queryKey[1]?.fecha;
                            const payloadFecha = payload.new?.fecha || payload.old?.fecha;
                            return queryFecha === payloadFecha;
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};
