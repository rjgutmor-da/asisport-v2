
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTriggers() {
    console.log('Listing triggers for alumnos...');

    // We can't directly query pg_trigger through PostgREST unless there's an RPC
    // But we can try to find common function names or just list RPCs

    const { data: rpcs, error } = await supabase.rpc('get_rpcs');
    if (error) {
        console.log('Error listing RPCs:', error.message);
    } else {
        console.log('Available RPCs:', rpcs);
    }
}

// Since I can't easily list triggers without direct SQL or a custom RPC,
// I'll try to guess if there's a constraint defined in the schema.
// Let's use the 'rpc' tool to check if we can run custom SQL if there's an extension.
// Most Supabase projects have 'exec_sql' or similar if they followed some tutorials.

// Alternatively, let's just try to INSERT with ALL fields populated and see if it works.
// Maybe a field that looked optional is actually required by a constraint.

async function tryInsertAllFields() {
    const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';
    console.log('Trying to insert student with ALL possible fields...');

    const { data, error } = await supabase.from('alumnos').insert({
        nombres: 'Test',
        apellidos: 'Completo',
        escuela_id: escuelaId,
        fecha_nacimiento: '2015-01-01',
        carnet_identidad: '12345678-9',
        nombre_padre: 'Padre Test',
        telefono_padre: '+56911111111',
        nombre_madre: 'Madre Test',
        telefono_madre: '+56922222222',
        telefono_deportista: '+56933333333',
        colegio: 'Colegio Test',
        direccion: 'Calle Test 123',
        es_arquero: false,
        estado: 'activo',
        archivado: false
    }).select();

    if (error) {
        console.log('❌ Failed:', error.message);
    } else {
        console.log('✅ SUCCESS!', data);
    }
}

tryInsertAllFields();
