
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRpc() {
    console.log('Checking RPC current_user_escuela_id...');

    // We need to act as a specific user to test the RPC
    // Let's use the SuperAdmin email/pass
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@asisport.com',
        password: 'Super123!'
    });

    if (loginError) {
        console.log('❌ Login failed:', loginError.message);
        return;
    }

    console.log('✅ Logged in as:', authData.user.email);

    const { data, error } = await supabase.rpc('current_user_escuela_id');

    if (error) {
        console.log('❌ RPC Error:', error.message);
        console.log('Code:', error.code);
    } else {
        console.log('✅ RPC Result:', data);
    }
}

checkRpc();
