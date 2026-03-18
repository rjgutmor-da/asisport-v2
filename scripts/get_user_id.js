
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const u = users.find(u => u.email === 'demo@asisport.com');
    console.log(u ? u.id : 'Not found');
}
findUser();
