
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';
const supabase = obtenerClienteSupabaseAdmin();
async function listAll() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    console.log('Emails in DB:', users.map(u => u.email).join(', '));
}
listAll();
