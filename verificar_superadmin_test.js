
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificUser() {
    const email = 'superadmin@asisport.test';
    console.log(`🔍 Buscando usuario ${email}...`);

    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('Error:', error.message);
    } else {
        if (users.length > 0) {
            console.log('✅ Usuario encontrado:', users[0]);
        } else {
            console.log(`❌ Usuario ${email} NO encontrado en public.usuarios`);
        }
    }
}

checkSpecificUser();
