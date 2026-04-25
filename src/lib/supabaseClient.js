import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

/**
 * Storage personalizado usando js-cookie para compartir la sesión entre subdominios (.saasport.pro).
 */
const cookieStorage = {
  getItem: (key) => {
    return Cookies.get(key) || null;
  },
  setItem: (key, value) => {
    Cookies.set(key, value, {
      expires: 365,
      domain: '.saasport.pro',
      path: '/',
      sameSite: 'lax',
      secure: true
    });
  },
  removeItem: (key) => {
    Cookies.remove(key, { domain: '.saasport.pro', path: '/' });
  }
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

