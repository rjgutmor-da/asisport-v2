import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    const { data: users } = await supabase.from('usuarios').select('id').ilike('nombres', '%Ruddy%').ilike('apellidos', '%Coronado%');
    const ruddyId = users[0].id;

    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select(`
            id, 
            nombres, 
            apellidos, 
            fecha_nacimiento, 
            profesor_asignado_id
        `)
        .gte('fecha_nacimiento', '2014-01-01')
        .lte('fecha_nacimiento', '2014-12-31')
        .is('archivado', false);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Alumnos nacidos en 2014: ${alumnos.length}`);
    const rudders = alumnos.filter(a => a.profesor_asignado_id === ruddyId);
    console.log(`Asignados a Ruddy Coronado: ${rudders.length}`);


    if (alumnos.length > 0) {
        console.log('\nMuestra:');
        alumnos.slice(0, 5).forEach(a => {
            console.log(`${a.nombres} ${a.apellidos} (${a.fecha_nacimiento}) -> Profesor ID: ${a.profesor_asignado_id}`);
        });
    }
}

verify();
