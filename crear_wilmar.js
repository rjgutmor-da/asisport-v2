import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function crearNuevoUser() {
    const email = 'wilmarcardozo62@gmail.com';
    const password = 'Entrenador123!'; // Contraseña temporal
    const nombres = 'Wilmar';
    const apellidos = 'Cardozo';
    const telefono = '67770639';
    const escuelaId = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC
    const rol = 'Entrenador';

    console.log(`🚀 Creando usuario ${email} en Auth...`);

    // 1. Crear en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            nombres: nombres,
            apellidos: apellidos
        }
    });

    if (authError) {
        console.error('❌ Error en Auth:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`✅ Usuario creado en Auth (ID: ${userId})`);

    // 2. Crear en la tabla public.usuarios
    console.log(`📝 Registrando en tabla public.usuarios...`);
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .insert([
            {
                id: userId,
                email: email,
                nombres: nombres,
                apellidos: apellidos,
                telefono_whatsapp: `+591${telefono}`,
                rol: rol,
                escuela_id: escuelaId,
                activo: true
            }
        ])
        .select()
        .single();

    if (userError) {
        console.error('❌ Error en tabla usuarios:', userError.message);
    } else {
        console.log('✅ Usuario registrado exitosamente en el sistema.');
        console.log('');
        console.log('📋 DATOS DE ACCESO:');
        console.log(`   Email:      ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log(`   Rol:        ${rol}`);
        console.log(`   Escuela:    PLANETA FC`);
    }
}

crearNuevoUser();
