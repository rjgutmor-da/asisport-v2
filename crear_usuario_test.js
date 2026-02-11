
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function crearUsuarioTest() {
    const email = 'superadmin@asisport.test';
    const password = 'TestAdmin123!';

    console.log(`🚀 Creando usuario de prueba ${email}...`);

    // 1. Crear en Auth
    let userId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        console.log('⚠️  Info Auth:', authError.message);
        // Intentar recuperar ID si ya existe
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users.users.find(u => u.email === email);
        if (existing) {
            userId = existing.id;
            console.log('✅ Usuario encontrado en Auth:', userId);
            // Actualizar password porsiaca
            await supabase.auth.admin.updateUserById(userId, { password });
        } else {
            console.error('❌ No se pudo crear ni encontrar el usuario en Auth');
            return;
        }
    } else {
        userId = authData.user.id;
        console.log('✅ Usuario creado en Auth:', userId);
    }

    // 2. Crear/Actualizar en DB
    const { error: dbError } = await supabase.from('usuarios').upsert({
        id: userId,
        email,
        nombres: 'SuperAdmin',
        apellidos: 'Test',
        telefono_whatsapp: '+555555555',
        rol: 'SuperAdministrador',
        escuela_id: escuelaId,
        activo: true
    });

    if (dbError) {
        console.error('❌ Error en DB:', dbError.message);
    } else {
        console.log('✅ Usuario sincronizado en public.usuarios');
        console.log('');
        console.log('📋 TUS CREDENCIALES:');
        console.log(`   Email:      ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log('   Rol:        SuperAdministrador');
    }
}

crearUsuarioTest();
