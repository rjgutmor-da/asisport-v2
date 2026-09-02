import { useQuery } from '@tanstack/react-query';
import { obtenerCumpleanosAsisport } from '../../../services/cumpleanosService';
import { queryKeys } from '../../../hooks/useMasterData';
import { useAuth } from '../../../context/AuthContext';

/**
 * Hook para obtener alumnos que cumplen años (hoy, ayer, mañana y próximos 7 días).
 * Utiliza TanStack Query y la RPC optimizada rpc_cumpleanos_asisport.
 */
export const useCumpleanos = () => {
    const { user, escuelaId, userProfile } = useAuth();
    const { data, isLoading: loading, refetch: loadData } = useQuery({
        queryKey: queryKeys.cumpleanos({
            userId: user?.id || 'sin-usuario',
            escuelaId: escuelaId || 'sin-escuela',
            sucursalId: userProfile?.sucursal_id || 'todas'
        }),
        queryFn: ({ signal }) => obtenerCumpleanosAsisport({ signal }),
        staleTime: 15 * 60 * 1000, // 15 minutos
        gcTime: 60 * 60 * 1000,
        enabled: Boolean(user?.id)
    });

    return {
        loading,
        today: data?.today || [],
        yesterday: data?.yesterday || [],
        tomorrow: data?.tomorrow || [],
        upcoming: data?.upcoming || [],
        loadData
    };
};
