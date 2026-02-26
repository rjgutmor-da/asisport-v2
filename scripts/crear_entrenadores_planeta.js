import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearEntrenador(email, password, nombres) {
    console.log(`\n⏳ Procesando entrenador: ${nombres} (${email})...`);

    // 1. Intentar crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    let userId;

    if (authError) {
        console.log(`ℹ️ Auth respondió con error: ${authError.message}. Buscando si el usuario ya existe...`);
        // Intentar obtener el usuario por email
        const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = usersList.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
            console.error(`❌ El usuario no pudo ser creado y tampoco fue encontrado en la lista.`);
            return;
        }
        userId = existingUser.id;
        console.log(`✅ Usuario encontrado con ID: ${userId}`);
    } else {
        userId = authData.user.id;
        console.log(`✅ Usuario creado en Auth con ID: ${userId}`);
    }

    // 2. Insertar/Actualizar en la tabla 'usuarios'
    const partes = nombres.split(' ');
    const firstName = partes[0];
    const lastName = partes.slice(1).join(' ') || '';

    const { error: dbError } = await supabase
        .from('usuarios')
        .upsert({
            id: userId,
            email: email,
            nombres: firstName,
            apellidos: lastName,
            rol: 'Entrenador',
            escuela_id: ESCUELA_ID,
            activo: true,
            telefono_whatsapp: ''
        }, { onConflict: 'id' });

    if (dbError) {
        console.error(`❌ Error al registrar en tabla usuarios: ${dbError.message}`);
    } else {
        console.log(`✨ Entrenador ${nombres} registrado correctamente en la base de datos.`);
    }
}

async function main() {
    try {
        await crearEntrenador('edgarmarceloescalante@hotmail.es', 'edgar761', 'Marcelo Escalante');
        await crearEntrenador('ruddycoronadomercado0027@gmail.com', 'ruddy771', 'Ruddy Coronado');
        console.log('\n🏁 Proceso finalizado.');
    } catch (error) {
        console.error('\n💥 Error fatal:', error);
    }
}

main();
