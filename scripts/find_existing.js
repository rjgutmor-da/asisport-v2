import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUsers() {
    console.log('🔍 Buscando usuarios por email en tabla usuarios...');
    const emails = ['edgarmarceloescalante@hotmail.es', 'ruddycoronadomercado0027@gmail.com'];

    const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nombres')
        .in('email', emails);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Encontrados:', data);
    }
}

findUsers();
