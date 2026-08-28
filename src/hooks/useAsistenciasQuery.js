import { useQuery } from '@tanstack/react-query';
import { getAlumnosParaAsistencia } from '../services/asistencias';

export const asistenciasKeys = {
    all: ['asistencias'],
    lista: (fecha, canchaId, horarioId, entrenadorId) => [...asistenciasKeys.all, { fecha, canchaId, horarioId, entrenadorId }],
};

/**
 * Hook para obtener la lista de asistencia usando TanStack Query.
 * Implementa staleTime: 0 para asegurar datos frescos y reactividad con Realtime.
 */
export const useAsistenciasQuery = (fecha, canchaId, horarioId, entrenadorId) => {
    return useQuery({
        queryKey: asistenciasKeys.lista(fecha, canchaId, horarioId, entrenadorId),
        queryFn: () => getAlumnosParaAsistencia(fecha, canchaId, horarioId, entrenadorId),
        staleTime: 0, // Regla de performance: Asistencias no se cachean
        enabled: !!fecha, // Solo ejecutar si hay fecha
    });
};
