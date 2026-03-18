import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        // Code splitting — separar librerías pesadas en sus propios chunks
        // para que se descarguen solo cuando se necesitan (en conjunto con React.lazy)
        rollupOptions: {
            output: {
                manualChunks: {
                    // React y React DOM en un chunk separado (se cachea a largo plazo)
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Recharts solo se descarga cuando el usuario abre Estadísticas
                    'vendor-charts': ['recharts'],
                    // XLSX solo se descarga cuando el usuario exporta a Excel
                    'vendor-xlsx': ['xlsx'],
                    // Supabase en su propio chunk
                    'vendor-supabase': ['@supabase/supabase-js'],
                },
            },
        },
    },
})
