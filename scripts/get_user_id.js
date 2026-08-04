
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';
const supabase = obtenerClienteSupabaseAdmin();

async function findUser() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const u = users.find(u => u.email === 'demo@asisport.com');
    console.log(u ? u.id : 'Not found');
}
findUser();
