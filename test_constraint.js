
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConstraint() {
    console.log('Testing alumnos_estado_check with parents & telefono_deportista...');
    const valuesToTry = ['Activo', 'activo', 'ACTIVO', 'Active', 'active', 'Inactivo', 'inactivo', 'INACTIVO', '1', 'true'];

    for (const val of valuesToTry) {
        // console.log(`Trying val: "${val}"`);
        const { error } = await supabase.from('alumnos').insert({
            nombres: 'Test',
            apellidos: 'Constraint',
            escuela_id: escuelaId,
            estado: val,
            nombre_padre: 'Test Padre',
            telefono_padre: '+1234567890',
            telefono_deportista: '+1234567890' // Providing this instead of whatsapp
        });

        if (error) {
            console.log(`❌ Failed "${val}": ${error.message}`);
        } else {
            console.log(`✅ SUCCESS! Valid value is: "${val}"`);
            await supabase.from('alumnos').delete().eq('nombres', 'Test');
            break;
        }
    }
}

testConstraint();
