
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

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
