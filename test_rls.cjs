const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(url, key);

async function testRLS() {
    const email = `test_owner_${Date.now()}@asisport.com`; // Unique email
    const password = 'password123';

    console.log(`1. Intentando crear usuario único: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        console.error('ERROR Auth:', authError.message);
        return;
    }

    const user = authData.user;
    if (!user) {
        console.error('No se recibió objeto usuario. Posiblemente confirmación de email requerida?');
        return;
    }
    console.log(`   Usuario Auth Creado ID: ${user.id}`);

    // El cliente supabase ahora tiene la sesión. Intentemos leer 'usuarios' para ver si tenemos permiso SELECT
    console.log('2. Probando Permiso SELECT en usuarios...');
    const { data: selectData, error: selectError } = await supabase.from('usuarios').select('*').limit(1);
    if (selectError) {
        console.error('   ERROR SELECT:', selectError.message);
    } else {
        console.log('   SELECT OK. Filas:', selectData.length);
    }

    // Intentar INSERT/UPSERT del perfil
    console.log('3. Intentando INSERT/UPSERT en usuarios...');
    const perfil = {
        id: user.id,
        email: email,
        nombres: 'Test',
        apellidos: 'Owner',
        telefono_whatsapp: '12345678',
        rol: 'Dueño',
        escuela_id: escuelaId,
        activo: true
    };

    const { error: insertError } = await supabase
        .from('usuarios')
        .insert([perfil]);

    if (insertError) {
        console.error('   ERROR INSERT:', insertError.message);
        console.log('   CONCLUSIÓN: RLS sigue bloqueando la creación de perfil.');
    } else {
        console.log('   INSERT EXITOSO!');
        console.log('   CONCLUSIÓN: RLS funciona correctamente.');
    }
}

testRLS();
