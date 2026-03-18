
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function probe() {
    const content = 'tiny test';
    const { data, error } = await supabase.storage.from('avatars').upload(`test_${Date.now()}.txt`, content, { contentType: 'text/plain' });
    if (error) console.error('Upload error:', error);
    else console.log('Upload success:', data);
    
    // Check bucket info
    const { data: bucket, error: bErr } = await supabase.storage.getBucket('avatars');
    if (bErr) console.error('Bucket error:', bErr);
    else console.log('Bucket details:', JSON.stringify(bucket, null, 2));
}

probe();
