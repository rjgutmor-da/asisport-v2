
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
    console.log('🔄 Sincronizando usuarios de Auth con tabla usuarios...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    const testUsersData = {
        'superadmin@asisport.com': { nombres: 'Super', apellidos: 'Administrador', rol: 'SuperAdministrador' },
        'admin@asisport.com': { nombres: 'Juan', apellidos: 'Pérez', rol: 'Administrador' },
        'entrenador@asisport.com': { nombres: 'Carlos', apellidos: 'González', rol: 'Entrenador' }
    };

    for (const authUser of users) {
        if (testUsersData[authUser.email]) {
            const data = testUsersData[authUser.email];
            console.log(`   Sincronizando ${authUser.email} (ID: ${authUser.id})...`);

            // Upsert in public.usuarios
            const { error: upsertErr } = await supabase.from('usuarios').upsert({
                id: authUser.id,
                email: authUser.email,
                nombres: data.nombres,
                apellidos: data.apellidos,
                rol: data.rol,
                escuela_id: escuelaId,
                activo: true,
                telefono_whatsapp: '+56900000000'
            });

            if (upsertErr) console.log(`      ❌ Error: ${upsertErr.message}`);
            else console.log(`      ✅ Sincronizado`);
        }
    }
}

syncUsers();
