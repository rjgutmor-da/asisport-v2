import { useQuery, useQueries } from '@tanstack/react-query';
import { getCanchas, getHorarios, getEntrenadores } from '../services/maestros';
import { obtenerCatalogosAsisport } from '../services/catalogosService';

// --- Query Keys centralizados para invalidación precisa ---
export const queryKeys = {
  catalogos: ({ userId = null, escuelaId = null, sucursalId = null } = {}) => [
    'catalogos',
    { userId: userId || 'sin-usuario', escuelaId: escuelaId || 'sin-escuela', sucursalId: sucursalId || 'todas' }
  ],
  alumnos: ['alumnos'],
  alumnosLista: (filtros = {}) => ['alumnos', 'lista', filtros],
  alumnosFamilia: ['alumnos'],
  entrenadores: ['entrenadores'],
  canchas: ['canchas'],
  horarios: ['horarios'],
  gestiones: ['gestiones'],
  sucursales: ['sucursales'],
  estadisticas: ['estadisticas'],
  estadisticasResumen: (filtros = {}) => ['estadisticas', 'resumen', filtros],
  estadisticasFamilia: ['estadisticas'],
  asistencias: ['asistencias'],
  asistenciasFamilia: ['asistencias'],
  cumpleanos: (contexto = {}) => ['cumpleanos', contexto],
  cumpleanosFamilia: ['cumpleanos'],
  actividad: ['actividad'],
};

// --- Hook de Catálogos Completos Autorizados de AsiSport ---
export const useCatalogosAsisport = (sucursalId = null, contexto = {}) => {
  return useQuery({
    queryKey: queryKeys.catalogos({ ...contexto, sucursalId }),
    queryFn: ({ signal }) => obtenerCatalogosAsisport(sucursalId, { signal }),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,
    enabled: Boolean(contexto.userId),
  });
};

// --- Hooks individuales ---
export const useEntrenadores = () =>
  useQuery({ queryKey: queryKeys.entrenadores, queryFn: getEntrenadores, staleTime: 10 * 60 * 1000 });

export const useCanchas = () =>
  useQuery({ queryKey: queryKeys.canchas, queryFn: getCanchas, staleTime: 30 * 60 * 1000 });

export const useHorarios = () =>
  useQuery({ queryKey: queryKeys.horarios, queryFn: getHorarios, staleTime: 30 * 60 * 1000 });

// --- Hook combinado para datos maestros (desacoplado de alumnos) ---
// Evita descargar la lista masiva de alumnos al ingresar a Asistencia o Estadísticas
export const useMasterData = () => {
  const results = useQueries({
    queries: [
      { 
        queryKey: queryKeys.entrenadores, 
        queryFn: getEntrenadores, 
        staleTime: 10 * 60 * 1000 // 10 minutos
      },
      { 
        queryKey: queryKeys.canchas, 
        queryFn: getCanchas, 
        staleTime: 30 * 60 * 1000 // 30 minutos
      },
      { 
        queryKey: queryKeys.horarios, 
        queryFn: getHorarios, 
        staleTime: 30 * 60 * 1000 // 30 minutos
      },
    ],
  });

  const [entrenadores, canchas, horarios] = results;

  return {
    alumnos: [], // Desacoplado intencionalmente para evitar descargas masivas no solicitadas
    entrenadores: entrenadores.data || [],
    canchas: canchas.data || [],
    horarios: horarios.data || [],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  };
};
