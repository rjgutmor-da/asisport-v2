
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole(email) {
    console.log(`🔍 Buscando usuario: ${email}`);

    // 1. Obtener ID de Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const userAuth = users.find(u => u.email === email);

    if (!userAuth) {
        console.error('❌ Usuario no encontrado en Auth');
        return;
    }

    console.log('✅ ID Auth:', userAuth.id);

    // 2. Obtener Perfil en DB
    const { data: profile, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userAuth.id)
        .single();

    if (dbError) {
        console.error('❌ Error buscando perfil:', dbError.message);
    } else {
        console.log('👤 Perfil encontrado:');
        console.log('   - ID:', profile.id);
        console.log('   - Email:', profile.email);
        console.log('   - Rol:', `"${profile.rol}"`); // Comillas para ver espacios
        console.log('   - Activo:', profile.activo);

        // Verificación de lógica
        const isAdmin = profile.rol === 'Administrador';
        console.log('   ¿Es Administrador (exacto)?:', isAdmin);
    }
}

checkUserRole('admin@asisport.com');
checkUserRole('super@asisport.com');
