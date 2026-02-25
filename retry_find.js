import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function tryFind() {
    for (let i = 0; i < 3; i++) {
        console.log(`Intento ${i + 1}...`);
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
            console.error('Error:', error.message);
            await new Promise(r => setTimeout(r, 1000));
        } else {
            const user = data.users.find(u => u.email === 'chipamo152183@gmail.com');
            if (user) {
                console.log('✅ ENCONTRADO:', user.id);
                return;
            } else {
                console.log('No está en esta lista.');
                return;
            }
        }
    }
}

tryFind();
