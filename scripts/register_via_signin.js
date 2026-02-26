import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InVlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserIdBySignIn(email, password) {
    const tempClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await tempClient.auth.signInWithPassword({ email, password });
    if (error) {
        console.error(`Error al iniciar sesión para ${email}:`, error.message);
        return null;
    }
    return data.user.id;
}

async function registerUser(id, email, nombres) {
    const partes = nombres.split(' ');
    const firstName = partes[0];
    const lastName = partes.slice(1).join(' ') || '';

    const { error: dbError } = await supabase
        .from('usuarios')
        .upsert({
            id: id,
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
        console.log(`✨ Entrenador ${nombres} registrado correctamente.`);
    }
}

async function main() {
    const users = [
        { email: 'edgarmarceloescalante@hotmail.es', pass: 'edgar761', name: 'Marcelo Escalante' },
        { email: 'ruddycoronadomercado0027@gmail.com', pass: 'ruddy771', name: 'Ruddy Coronado' }
    ];

    for (const u of users) {
        console.log(`\n⏳ Procesando ${u.name}...`);
        const id = await getUserIdBySignIn(u.email, u.pass);
        if (id) {
            await registerUser(id, u.email, u.name);
        }
    }
}

main();
