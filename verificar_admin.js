
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
    console.log('🔍 Buscando usuario admin@asisport.com...');

    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', 'admin@asisport.com');

    if (error) {
        console.error('Error:', error.message);
    } else {
        if (users.length > 0) {
            console.log('✅ Usuario encontrado en public.usuarios:', users[0]);
        } else {
            console.log('❌ Usuario admin@asisport.com NO encontrado en public.usuarios');
        }
    }

    // También listar todos para ver qué hay
    console.log('\n📋 Todos los usuarios en public.usuarios:');
    const { data: allUsers } = await supabase.from('usuarios').select('email, rol, escuela_id');
    console.table(allUsers);
}

checkAdmin();
