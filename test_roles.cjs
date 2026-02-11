const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(url, key);

async function inspectConstraints() {
    console.log('Fetching constraint definition...');

    // Query pg_catalog (might require rpc/postgres function if direct access blocked)
    // But supabase-js doesn't expose raw SQL easily without RPC.

    // Let's try inserting a dummy value and see the error message in more detail, 
    // or try retrieving the definition via the "Meta" API if available? No.

    // Instead, I'll try to find the constraint definition in the public schema info 
    // if I can query information_schema via standard REST? 
    // Often Supabase exposes views.

    const { data, error } = await supabase
        .rpc('list_constraints');

    // Wait, I don't know if that RPC exists. 

    // Let's just try to insert with a known potential value to see if it works, 
    // or better, retrieve the table definition if I had a schema tool.

    // Plan B: Use the error message itself. It says "usuarios_rol_check".
    // I can try inserting 'Administrador' (standard) to see if 'Dueño' is the problem (maybe special char ñ?).

    console.log('Testing "Administrador"...');
    const { error: err1 } = await supabase.from('usuarios').insert([{
        id: '00000000-0000-0000-0000-000000000001', // Dummy UUID
        escuela_id: '91b2a748-f956-41e7-8efe-075257a0889a',
        email: 'test_constraint@test.com',
        nombres: 'Test',
        apellidos: 'Constraint',
        telefono_whatsapp: '000',
        rol: 'Administrador' // Try this
    }]);

    if (err1) console.log('Administrador failed:', err1.message);
    else console.log('Administrador allowed!');

    console.log('Testing "Owner"...');
    const { error: err2 } = await supabase.from('usuarios').insert([{
        id: '00000000-0000-0000-0000-000000000002',
        escuela_id: '91b2a748-f956-41e7-8efe-075257a0889a',
        email: 'test_constraint2@test.com',
        nombres: 'Test',
        apellidos: 'Constraint',
        telefono_whatsapp: '000',
        rol: 'Owner'
    }]);

    if (err2) console.log('Owner failed:', err2.message);
    else console.log('Owner allowed!');

    console.log('Testing "Dueño" (with tilde)...');
    const { error: err3 } = await supabase.from('usuarios').insert([{
        id: '00000000-0000-0000-0000-000000000003',
        escuela_id: '91b2a748-f956-41e7-8efe-075257a0889a',
        email: 'test_constraint3@test.com',
        nombres: 'Test',
        apellidos: 'Constraint',
        telefono_whatsapp: '000',
        rol: 'Dueño'
    }]);

    if (err3) console.log('Dueño failed:', err3.message);
    else console.log('Dueño allowed!');
}

async function run() {
    await inspectConstraints();
}

run();
