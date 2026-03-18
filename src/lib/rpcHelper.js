/**
 * Módulo: Wrapper centralizado para llamadas RPC de Supabase
 * 
 * Proporciona logging, manejo de errores y timeouts consistentes
 * para todas las llamadas al RPC `current_user_escuela_id` y cualquier
 * otro RPC que se use en la aplicación.
 * 
 * Uso en servicios:
 *   import { obtenerEscuelaId, ejecutarRPC } from '../lib/rpcHelper';
 *   const escuelaId = await obtenerEscuelaId();
 */

import { supabase } from './supabaseClient';
import { cacheService } from './cacheService';

// Configuración
const RPC_TIMEOUT_MS = 8000;   // Timeout por defecto para RPCs
const LOG_ENABLED = import.meta.env.DEV; // Solo en desarrollo
const ESCUELA_CACHE_TTL = 30 * 60 * 1000; // 30 minutos — el escuela_id no cambia durante la sesión

/**
 * Logger condicional — solo muestra mensajes en modo desarrollo
 */
const rpcLog = {
    info: (...args) => LOG_ENABLED && console.log('🔵 [RPC]', ...args),
    warn: (...args) => console.warn('🟡 [RPC]', ...args),
    error: (...args) => console.error('🔴 [RPC]', ...args),
};

/**
 * Ejecuta un RPC de Supabase con timeout y logging
 * 
 * @param {string} rpcName - Nombre del RPC a ejecutar
 * @param {object} params - Parámetros del RPC (opcional)
 * @param {number} timeoutMs - Timeout en milisegundos (por defecto 8000)
 * @returns {*} - El dato devuelto por el RPC
 * @throws {Error} - Si el RPC falla o hay timeout
 */
export async function ejecutarRPC(rpcName, params = {}, timeoutMs = RPC_TIMEOUT_MS) {
    const inicio = performance.now();
    rpcLog.info(`Ejecutando: ${rpcName}`, params);

    try {
        const rpcPromise = Object.keys(params).length > 0
            ? supabase.rpc(rpcName, params)
            : supabase.rpc(rpcName);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${rpcName} tardó más de ${timeoutMs}ms`)), timeoutMs)
        );

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

        const duracion = Math.round(performance.now() - inicio);

        if (error) {
            rpcLog.error(`Error en ${rpcName} (${duracion}ms):`, error.message);
            throw new Error(`Error en ${rpcName}: ${error.message}`);
        }

        rpcLog.info(`${rpcName} completado (${duracion}ms):`, data);
        return data;

    } catch (err) {
        const duracion = Math.round(performance.now() - inicio);

        if (err.message.startsWith('Timeout:')) {
            rpcLog.error(`${rpcName} — TIMEOUT después de ${duracion}ms`);
        } else {
            rpcLog.error(`${rpcName} — Error inesperado (${duracion}ms):`, err.message);
        }

        throw err;
    }
}

/**
 * Obtiene el escuela_id del usuario autenticado actual
 * 
 * Wrapper específico para el RPC más usado en la app.
 * Incluye validación de que el resultado no sea null.
 * 
 * @returns {string} - UUID de la escuela del usuario
 * @throws {Error} - Si no se puede obtener la escuela
 */
export async function obtenerEscuelaId() {
    // Verificar caché antes de ejecutar el RPC
    const cached = cacheService.get('escuela_id');
    if (cached) return cached;

    const escuelaId = await ejecutarRPC('current_user_escuela_id');

    if (!escuelaId) {
        rpcLog.warn('El RPC devolvió null — usuario sin escuela asignada');
        throw new Error('No se pudo obtener la escuela del usuario.');
    }

    // Cachear por 30 minutos — el escuela_id no cambia durante la sesión
    cacheService.set('escuela_id', escuelaId, ESCUELA_CACHE_TTL);
    return escuelaId;
}
