import { useQuery } from '@tanstack/react-query';
import { getAlumnosParaAsistencia } from '../services/asistencias';

export const asistenciasKeys = {
    all: ['asistencias'],
    lista: (fecha, grupoGestionId) => [...asistenciasKeys.all, { fecha, grupoGestionId }],
};

/**
 * Hook para obtener la lista de asistencia usando TanStack Query.
 * Implementa staleTime: 0 para asegurar datos frescos y reactividad con Realtime.
 */
export const useAsistenciasQuery = (fecha, grupoGestionId) => {
    return useQuery({
        queryKey: asistenciasKeys.lista(fecha, grupoGestionId),
        queryFn: () => getAlumnosParaAsistencia(fecha, grupoGestionId),
        staleTime: 0, // Regla de performance: Asistencias no se cachean
        enabled: !!fecha && !!grupoGestionId, // Solo ejecutar con grupo de gestión
    });
};
