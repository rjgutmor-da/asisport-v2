import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

/**
 * Storage personalizado para compartir la sesión entre subdominios.
 * Guarda la sesión en una cookie en el dominio raíz (.saasport.pro).
 */
const isBrowser = typeof document !== 'undefined';
const domain = isBrowser && window.location.hostname.endsWith('saasport.pro') 
  ? '.saasport.pro' 
  : '';

const cookieStorage = {
  getItem: (key) => {
    if (!isBrowser) return null;
    const name = `${key}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  },
  setItem: (key, value) => {
    if (!isBrowser) return;
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const domainAttr = domain ? `;domain=${domain}` : '';
    document.cookie = `${key}=${value};${expires}${domainAttr};path=/;SameSite=Lax;Secure`;
  },
  removeItem: (key) => {
    if (!isBrowser) return;
    const domainAttr = domain ? `;domain=${domain}` : '';
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr};path=/;SameSite=Lax;Secure`;
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

