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
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'alumnos',
                },
                () => {
                    // Invalida la familia completa de queries de alumnos
                    queryClient.invalidateQueries({ queryKey: queryKeys.alumnosFamilia });
                    queryClient.invalidateQueries({ queryKey: queryKeys.estadisticasFamilia });
                    queryClient.invalidateQueries({ queryKey: queryKeys.cumpleanosFamilia });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};
