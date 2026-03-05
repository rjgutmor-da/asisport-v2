import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('URL:', supabaseUrl)
  console.error('KEY:', supabaseAnonKey)
}

// 🔴 DEPURACIÓN MÓVIL: Interceptar errores de red "Failed to fetch"
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && (error.message === 'Failed to fetch' || error.name === 'TypeError' && error.message.includes('fetch'))) {
      alert('⚠️ ERROR DE CONEXIÓN: No se pudo contactar con el servidor. Verifica tu internet o si el dominio de la app está permitido en Supabase (CORS).');
    }
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
