
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function determineValidStateAndResponsible() {
    const states = ['Pendiente', 'Aprobado', 'Rechazado', 'activo', 'inactivo'];

    console.log('--- Probing Valid State and Responsible Fields ---');

    for (const state of states) {
        console.log(`Checking state: "${state}"`);
        const { error } = await supabase.from('alumnos').insert({
            nombres: 'Probe',
            apellidos: 'Test',
            escuela_id: escuelaId,
            estado: state,
            fecha_nacimiento: '2015-01-01',
            nombre_padre: 'Padre Name',
            telefono_padre: '+56900000000'
        });

        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
        } else {
            console.log(`   ✅ SUCCESS with state: "${state}"`);
            await supabase.from('alumnos').delete().eq('nombres', 'Probe');
            return state;
        }
    }
}

determineValidStateAndResponsible();
