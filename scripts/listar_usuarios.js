import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listarUsuarios() {
    console.log('🔍 Buscando usuarios en el sistema...');

    // Usamos auth.admin para listar usuarios (requiere service_role key)
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error al listar usuarios:', error.message);
        return;
    }

    const users = data.users;

    if (!users || users.length === 0) {
        console.log('⚠️ No se encontraron usuarios registrados.');
        return;
    }

    console.log('\n==========================================');
    console.log('👥 USUARIOS DISPONIBLES (Profesores/Admins)');
    console.log('   Copia el ID del usuario que quieras asignar como Profesor.');
    console.log('==========================================');

    // Mostramos formato tabla simplificado
    const simplified = users.map(u => ({
        ID: u.id,
        Email: u.email,
        Nombre: u.user_metadata?.nombre || u.user_metadata?.full_name || u.user_metadata?.first_name || 'Sin nombre',
        Rol: u.user_metadata?.rol || 'Sin rol'
    }));

    console.table(simplified);
    console.log('\n==========================================');
}

listarUsuarios();
