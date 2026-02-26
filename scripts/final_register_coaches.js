import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InVlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function register(email, id, nombres, telefono) {
    const partes = nombres.split(' ');
    const firstName = partes[0];
    const lastName = partes.slice(1).join(' ') || '';

    console.log(`📡 Registrando ${nombres}...`);

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
            telefono_whatsapp: telefono
        });

    if (dbError) {
        console.error(`❌ Error: ${dbError.message}`);
    } else {
        console.log(`✨ ${nombres} registrado correctamente.`);
    }
}

async function main() {
    // Verificar que el cliente funciona
    const { data: check, error: checkErr } = await supabase.from('escuelas').select('id').limit(1);
    if (checkErr) {
        console.error('💥 Error de conexión/clave:', checkErr.message);
        return;
    }
    console.log('✅ Conexión con service_role verificada.');

    const users = [
        { email: 'edgarmarceloescalante@hotmail.es', id: '4540a17c-7f3d-474b-9c0f-ac638fc290d0', name: 'Marcelo Escalante', phone: '76129594' },
        { email: 'ruddycoronadomercado0027@gmail.com', id: '1259d0e6-8fa4-48ba-b262-4427c7b971c4', name: 'Ruddy Coronado', phone: '77164775' }
    ];

    for (const u of users) {
        await register(u.email, u.id, u.name, u.phone);
    }
}

main();
