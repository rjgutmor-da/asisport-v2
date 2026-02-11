const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(url, key);

async function checkCreds() {
    const email = 'test_owner@asisport.com';
    const password = 'password123';

    console.log(`1. Login con ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('   ERROR Login:', error.message);
        return;
    }

    console.log('   Login OK. User ID:', data.user.id);

    console.log('2. Intentando INSERT en usuarios con esta sesión...');

    // Check if row exists first
    const { data: existing, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id);

    if (existing && existing.length > 0) {
        console.log('   El usuario YA existe en tabla usuarios. (RLS funcionó antes o estaba abierto).');
        console.log('   Rol actual:', existing[0].rol);
        return;
    }

    const perfil = {
        id: data.user.id,
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
        // Try to dump policies info? No can do.
    } else {
        console.log('   INSERT EXITOSO!');
    }
}

checkCreds();
