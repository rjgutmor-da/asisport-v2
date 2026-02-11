
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceSync() {
    const users = [
        { email: 'superadmin@asisport.com', password: 'Super123!', nombres: 'Super', apellidos: 'Administrador', rol: 'SuperAdministrador' },
        { email: 'admin@asisport.com', password: 'Admin123!', nombres: 'Juan', apellidos: 'Pérez', rol: 'Administrador' },
        { email: 'entrenador@asisport.com', password: 'Entrena123!', nombres: 'Carlos', apellidos: 'González', rol: 'Entrenador' }
    ];

    for (const u of users) {
        console.log(`Checking ${u.email}...`);
        const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: u.password
        });

        if (authErr) {
            console.log(`   ❌ Auth failed: ${authErr.message}`);
            continue;
        }

        const userId = auth.user.id;
        console.log(`   Found ID: ${userId}. Upserting in DB...`);

        const { error: dbErr } = await supabase.from('usuarios').upsert({
            id: userId,
            email: u.email,
            nombres: u.nombres,
            apellidos: u.apellidos,
            rol: u.rol,
            escuela_id: escuelaId,
            activo: true,
            telefono_whatsapp: '+56900000000'
        });

        if (dbErr) console.log(`   ❌ DB Error: ${dbErr.message}`);
        else console.log(`   ✅ Success`);
    }
}

forceSync();
