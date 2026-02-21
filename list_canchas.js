
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listCanchas() {
    const { data, error } = await supabase
        .from('canchas')
        .select('id, nombre')
        .order('nombre');

    if (error) {
        console.error('Error fetching canchas:', error);
        return;
    }

    console.log('--- LISTA DE CANCHAS ---');
    data.forEach(c => {
        console.log(`Nombre: ${c.nombre} | ID: ${c.id}`);
    });
}

listCanchas();
