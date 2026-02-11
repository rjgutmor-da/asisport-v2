const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(url, key);

async function createUser(email, password, role, firstName, lastName) {
    console.log(`Creando/Verificando usuario: ${email} (${role})`);

    // 1. SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    let userId = authData.user?.id;

    if (authError || !userId) {
        console.log(`SignUp falló o retornó vacio (${authError?.message}). Intentando login...`);
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            console.error(`ERROR: No se pudo acceder a ${email}:`, loginError.message);
            return null;
        }
        userId = loginData.user.id;
    }

    console.log(`Usuario Auth ID: ${userId}`);

    // 2. Upsert Profile
    const perfil = {
        id: userId,
        email: email,
        nombres: firstName,
        apellidos: lastName,
        telefono_whatsapp: '00000000',
        rol: role,
        escuela_id: escuelaId,
        activo: true
    };

    const { error: profileError } = await supabase
        .from('usuarios')
        .upsert(perfil);

    if (profileError) {
        console.error(`ERROR creando perfil para ${email}:`, profileError.message);
    } else {
        console.log(`Perfil actualizado correctamente para ${email}`);
    }

    return userId;
}

async function main() {
    await createUser('test_owner@asisport.com', 'password123', 'Dueño', 'Test', 'Owner');
    await createUser('test_coach@asisport.com', 'password123', 'Entrenador', 'Test', 'Coach');
}

main();
