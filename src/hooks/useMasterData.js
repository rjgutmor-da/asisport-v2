import { useQuery, useQueries } from '@tanstack/react-query';
import { getAlumnos } from '../services/alumnos';
import { getCanchas, getHorarios, getEntrenadores } from '../services/maestros';

// --- Query Keys (centralizados para invalidación precisa) ---
export const queryKeys = {
  alumnos: ['alumnos'],
  entrenadores: ['entrenadores'],
  canchas: ['canchas'],
  horarios: ['horarios'],
  estadisticas: (filtros) => ['estadisticas', filtros],
};

// --- Hooks individuales ---
export const useAlumnos = () =>
  useQuery({ queryKey: queryKeys.alumnos, queryFn: getAlumnos });

export const useEntrenadores = () =>
  useQuery({ queryKey: queryKeys.entrenadores, queryFn: getEntrenadores });

export const useCanchas = () =>
  useQuery({ queryKey: queryKeys.canchas, queryFn: getCanchas });

export const useHorarios = () =>
  useQuery({ queryKey: queryKeys.horarios, queryFn: getHorarios });

// --- Hook combinado (reemplaza Promise.all en dashboard/estadísticas) ---
// Dispara TODAS las queries en paralelo, sin waterfall
export const useMasterData = () => {
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.alumnos, queryFn: getAlumnos },
      { queryKey: queryKeys.entrenadores, queryFn: getEntrenadores },
      { queryKey: queryKeys.canchas, queryFn: getCanchas },
      { queryKey: queryKeys.horarios, queryFn: getHorarios },
    ],
  });

  const [alumnos, entrenadores, canchas, horarios] = results;

  return {
    alumnos: alumnos.data || [],
    entrenadores: entrenadores.data || [],
    canchas: canchas.data || [],
    horarios: horarios.data || [],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  };
};
