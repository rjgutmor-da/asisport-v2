
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

async function checkData() {
    const { data, error } = await supabase
        .from('alumnos')
        .select('nombres, apellidos, foto_url')
        .eq('escuela_id', '07d945a7-99ba-4e7d-ba9c-258e7ee27659');

    if (error) {
        console.error(error);
        return;
    }

    console.log('Alumnos en la escuela demo:');
    data.forEach(a => {
        console.log(`${a.nombres} ${a.apellidos}: ${a.foto_url || 'SIN FOTO'}`);
    });
    
    // Check storage buckets
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    console.log('\nBuckets disponibles:', buckets ? buckets.map(b => b.name) : 'Error listing buckets');
}

checkData();
