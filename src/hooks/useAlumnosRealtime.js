import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from './useMasterData';

export const useAlumnosRealtime = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('alumnos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',        // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'alumnos',
                },
                () => {
                    // Silencioso: solo marca el caché como stale
                    // TanStack Query re-fetchea cuando se navegue a un módulo que los use
                    queryClient.invalidateQueries({ queryKey: queryKeys.alumnos });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};
