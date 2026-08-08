import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const CHUNK_SIZE = 3000;
// Las tres aplicaciones viven bajo *.saasport.pro y deben leer la misma
// sesión del portal SSO. Conservamos la clave anterior solo para migrar una
// sesión de AsiSport que ya esté abierta en el navegador.
const AUTH_STORAGE_KEY = 'saasport-auth';
const LEGACY_AUTH_STORAGE_KEY = 'asisport-auth';

const getStoredCookieValue = (key) => {
  const first = Cookies.get(key);
  if (!first) return null;
  if (!first.startsWith('chunk_0:')) return first;

  let result = '';
  let i = 0;
  while (true) {
    const chunk = Cookies.get(`${key}_chunk_${i}`);
    if (!chunk) break;
    result += chunk;
    i++;
  }
  return result || null;
};

/**
 * Storage personalizado usando js-cookie con fragmentación (chunking).
 */
const cookieStorage = {
  getItem: (key) => {
    const currentValue = getStoredCookieValue(key);
    if (currentValue || key !== AUTH_STORAGE_KEY) return currentValue;

    const legacyValue = getStoredCookieValue(LEGACY_AUTH_STORAGE_KEY);
    if (legacyValue) {
      // Evita que una sesión válida creada antes de la unificación obligue a
      // iniciar sesión otra vez. A partir de aquí el portal SSO y AsiSport
      // usarán la misma cookie.
      cookieStorage.setItem(AUTH_STORAGE_KEY, legacyValue);
      cookieStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    }
    return legacyValue;
  },
  setItem: (key, value) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const opts = {
      expires: 7,
      path: '/',
      sameSite: 'lax',
      secure: !isLocalhost,
    };

    if (!isLocalhost) {
      opts.domain = '.saasport.pro';
    }

    if (value.length <= CHUNK_SIZE) {
      Cookies.set(key, value, opts);
      return;
    }

    // Dividir en chunks
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    Cookies.set(key, `chunk_0:${chunks.length}`, opts);
    chunks.forEach((chunk, i) => {
      Cookies.set(`${key}_chunk_${i}`, chunk, opts);
    });
  },
  removeItem: (key) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const opts = { path: '/' };
    if (!isLocalhost) {
      opts.domain = '.saasport.pro';
    }
    
    const first = Cookies.get(key);
    
    if (first?.startsWith('chunk_0:')) {
      const count = parseInt(first.split(':')[1]);
      for (let i = 0; i < count; i++) {
        Cookies.remove(`${key}_chunk_${i}`, opts);
      }
    }
    Cookies.remove(key, opts);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
