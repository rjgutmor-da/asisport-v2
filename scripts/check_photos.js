
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
