import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUserAuth() {
    console.log('Buscando en auth.users: chipamo152183@gmail.com');
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'chipamo152183@gmail.com');

    // Note: By default supabase client points to 'public' schema. 
    // We need to point to 'auth' schema.
    const { data: usersAuth, error: errorAuth } = await supabase
        .schema('auth')
        .from('users')
        .select('id, email')
        .eq('email', 'chipamo152183@gmail.com');

    if (errorAuth) {
        console.error('Error Auth Schema:', errorAuth.message);
    } else {
        console.log('Resultados Auth Schema:', usersAuth);
    }
}

findUserAuth();
