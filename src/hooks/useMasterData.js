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
      { 
        queryKey: queryKeys.alumnos, 
        queryFn: getAlumnos, 
        staleTime: 10 * 60 * 1000 // Alumnos: 10 minutos
      },
      { 
        queryKey: queryKeys.entrenadores, 
        queryFn: getEntrenadores, 
        staleTime: 10 * 60 * 1000 // Entrenadores: 10 minutos
      },
      { 
        queryKey: queryKeys.canchas, 
        queryFn: getCanchas, 
        staleTime: 30 * 60 * 1000 // Canchas: 30 minutos
      },
      { 
        queryKey: queryKeys.horarios, 
        queryFn: getHorarios, 
        staleTime: 30 * 60 * 1000 // Horarios: 30 minutos
      },
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
