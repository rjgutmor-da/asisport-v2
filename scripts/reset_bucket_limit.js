
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

async function setLimit() {
    console.log('📏 Restableciendo límite del bucket a 150KB...');
    const { data, error } = await supabase.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 153600, // 150KB (150 * 1024)
    });
    
    if (error) console.error('Error al actualizar:', error.message);
    else console.log('✅ Límite de 150KB establecido correctamente.');
}

setLimit();
