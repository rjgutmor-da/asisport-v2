import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsersService() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Usuarios en public.usuarios (SERVICE ROLE):', data.length);
        data.forEach(u => {
            console.log(`- ${u.email} [${u.rol}] (ID: ${u.id})`);
        });
    }
}

listUsersService();
