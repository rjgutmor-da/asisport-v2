import { useQuery } from '@tanstack/react-query';
import { cargarAsistenciaAsisport } from '../services/asistencias';

export const asistenciasKeys = {
    all: ['asistencias'],
    lista: (fecha, canchaId, horarioId, entrenadorId, contexto = {}) => [
        ...asistenciasKeys.all,
        {
            userId: contexto.userId || 'sin-usuario',
            escuelaId: contexto.escuelaId || 'sin-escuela',
            sucursalId: contexto.sucursalId || 'todas',
            gestionId: contexto.gestionId || 'gestion-por-fecha',
            fecha,
            canchaId,
            horarioId,
            entrenadorId
        }
    ],
};

/**
 * Hook para obtener la lista de asistencia usando TanStack Query.
 * Implementa staleTime: 0 para asegurar datos frescos y reactividad con Realtime.
 */
export const useAsistenciasQuery = (fecha, canchaId, horarioId, entrenadorId, contexto = {}) => {
    return useQuery({
        queryKey: asistenciasKeys.lista(fecha, canchaId, horarioId, entrenadorId, contexto),
        queryFn: async ({ signal }) => {
            const respuesta = await cargarAsistenciaAsisport(
                fecha,
                canchaId,
                horarioId,
                entrenadorId,
                { signal }
            );
            const asistenciasPorAlumno = new Map(
                (respuesta.asistencias_existentes || []).map(asistencia => [asistencia.alumno_id, asistencia])
            );

            return {
                alumnos: (respuesta.candidatos || []).map(alumno => ({
                    ...alumno,
                    asistenciaNormal: asistenciasPorAlumno.get(alumno.id) || null
                })),
                estadoEnvio: respuesta.estado_envio || { existe: false, cantidad: 0 }
            };
        },
        staleTime: 0, // Regla de performance: Asistencias no se cachean
        enabled: Boolean(fecha && contexto.userId), // Solo ejecutar con sesión y fecha
    });
};
