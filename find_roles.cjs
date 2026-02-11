const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(url, key);

async function listRoles() {
    // I cannot SELECT DISTINCT easily without RPC if RLS blocks me or if I don't know the values.
    // However, I have the key, so RLS is bypassed? No, 'key' here is Anon key usually. 
    // Wait, the user gave me the service role key earlier!
    // Let's use THAT to bypass RLS and seeing everything.

    // Key from previous turn (user provided):
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

    const adminClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const { data, error } = await adminClient
        .from('usuarios')
        .select('rol');

    if (error) {
        console.error('Error fetching roles:', error);
    } else {
        const roles = [...new Set(data.map(u => u.rol))];
        console.log('Existing Roles:', roles);
    }
}

listRoles();
