
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogin(email, password) {
    console.log(`\n🔐 Intentando login con: ${email}`);

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Error de Auth:', authError.message);
        return;
    }

    if (!user) {
        console.error('❌ Usuario no devuelto tras login (caso raro)');
        return;
    }

    console.log('✅ Login exitoso. ID:', user.id);

    // Ahora consultar el perfil público
    const { data: profile, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

    if (dbError) {
        console.error('❌ Error buscando perfil en public.usuarios:', dbError.message);
        console.log('   (Posible causa: RLS o tabla vacía)');
    } else {
        console.log('👤 Perfil encontrado:');
        console.log(`   Rol: [${profile.rol}]`); // Corchetes para ver espacios
        console.log('   Escuela ID:', profile.escuela_id);
    }
}

async function run() {
    await checkLogin('admin@asisport.com', 'Admin123!');
    await checkLogin('super@asisport.com', 'Super123!');
}

run();
