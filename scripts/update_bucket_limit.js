
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

async function updateLimit() {
    console.log('🆙 Intentando aumentar el límite del bucket a 1MB...');
    const { data, error } = await supabase.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 1048576, // 1MB
    });
    
    if (error) console.error('Error al actualizar:', error.message);
    else console.log('✅ Bucket actualizado con éxito.');
}

updateLimit();
