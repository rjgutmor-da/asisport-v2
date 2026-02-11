const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(url, key);

async function createAdminUser() {
    console.log('Creando usuario admin@test.com...');

    // 1. SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'admin123',
        options: {
            emailRedirectTo: undefined,
            data: {
                nombres: 'Admin',
                apellidos: 'Test'
            }
        }
    });

    let userId = authData.user?.id;

    if (authError) {
        console.log(`SignUp error: ${authError.message}`);
        // Intentar login si ya existe
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (loginError) {
            console.error(`ERROR: No se pudo acceder:`, loginError.message);
            return;
        }
        userId = loginData.user.id;
        console.log('Usuario ya existía, usando ID:', userId);
    } else {
        console.log('Usuario creado en Auth, ID:', userId);
    }

    // 2. Crear perfil en tabla usuarios
    const perfil = {
        id: userId,
        email: 'admin@test.com',
        nombres: 'Admin',
        apellidos: 'Test',
        telefono_whatsapp: '+584121234567',
        rol: 'Dueño',
        escuela_id: escuelaId,
        activo: true
    };

    const { error: profileError } = await supabase
        .from('usuarios')
        .upsert(perfil);

    if (profileError) {
        console.error('ERROR creando perfil:', profileError.message);
    } else {
        console.log('✅ Perfil creado correctamente');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        console.log('Rol: Dueño');
    }
}

createAdminUser();
