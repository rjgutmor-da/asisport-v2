import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const CHUNK_SIZE = 3000;

/**
 * Storage personalizado usando js-cookie con fragmentación (chunking).
 */
const cookieStorage = {
  getItem: (key) => {
    const first = Cookies.get(key);
    if (!first) return null;
    if (!first.startsWith('chunk_0:')) return first;
    
    try {
      const count = parseInt(first.split(':')[1]);
      let result = '';
      for (let i = 0; i < count; i++) {
        const chunk = Cookies.get(`${key}_chunk_${i}`);
        if (!chunk) return null; // Si falta un fragmento, la sesión está corrupta
        result += chunk;
      }
      return result;
    } catch (e) {
      console.error('Error al reconstruir cookie fragmentada:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    const opts = {
      expires: 7,
      path: '/',
      sameSite: 'lax',
      secure: true,
    };

    // 1. Limpiar posibles fragmentos antiguos antes de nada
    const oldFirst = Cookies.get(key);
    if (oldFirst?.startsWith('chunk_0:')) {
      const oldCount = parseInt(oldFirst.split(':')[1]);
      for (let i = 0; i < oldCount; i++) {
        Cookies.remove(`${key}_chunk_${i}`, { path: '/' });
      }
    }

    if (value.length <= CHUNK_SIZE) {
      Cookies.set(key, value, opts);
      return;
    }

    // 2. Dividir en nuevos chunks
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    // 3. Guardar índice y fragmentos
    Cookies.set(key, `chunk_0:${chunks.length}`, opts);
    chunks.forEach((chunk, i) => {
      Cookies.set(`${key}_chunk_${i}`, chunk, opts);
    });
  },
  removeItem: (key) => {
    const opts = { path: '/' };
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
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

