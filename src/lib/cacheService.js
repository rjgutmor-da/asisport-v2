/**
 * Servicio de caché en memoria para datos maestros.
 * 
 * Almacena resultados de consultas frecuentes (canchas, horarios, entrenadores)
 * con un TTL configurable para evitar llamadas repetitivas a Supabase.
 * 
 * Uso:
 *   import { cacheService } from './cacheService';
 *   const data = cacheService.get('canchas');
 *   if (!data) {
 *       const fresh = await fetchFromSupabase();
 *       cacheService.set('canchas', fresh);
 *   }
 */

// Tiempo de vida por defecto: 5 minutos
const DEFAULT_TTL_MS = 5 * 60 * 1000;

// Almacén interno de caché
const store = new Map();

/**
 * Servicio singleton de caché en memoria.
 * Cada entrada tiene: { data, timestamp, ttl }
 */
export const cacheService = {
    /**
     * Obtiene un valor del caché si aún no expiró.
     * @param {string} key - Clave del dato almacenado
     * @returns {*|null} - Dato almacenado o null si expiró/no existe
     */
    get(key) {
        const entry = store.get(key);
        if (!entry) return null;

        const ahora = Date.now();
        if (ahora - entry.timestamp > entry.ttl) {
            // Expiró, eliminarlo
            store.delete(key);
            return null;
        }

        return entry.data;
    },

    /**
     * Almacena un valor en el caché con TTL configurable.
     * @param {string} key - Clave para identificar el dato
     * @param {*} data - Dato a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos (por defecto 5 min)
     */
    set(key, data, ttl = DEFAULT_TTL_MS) {
        store.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    },

    /**
     * Invalida una entrada específica del caché.
     * @param {string} key - Clave a invalidar
     */
    invalidate(key) {
        store.delete(key);
    },

    /**
     * Limpia todo el caché (útil al cerrar sesión).
     */
    clear() {
        store.clear();
    }
};
