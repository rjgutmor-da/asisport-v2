
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';
const supabase = obtenerClienteSupabaseAdmin();
async function listProfiles() {
    const { data, error } = await supabase.from('usuarios').select('id, email');
    console.log('Profiles:', data);
}
listProfiles();
