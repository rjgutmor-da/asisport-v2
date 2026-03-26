
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Searching for users named Marcelo Escalante...');
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nombres', '%Marcelo%')
        .ilike('apellidos', '%Escalante%');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Rol: ${u.rol}, Escuela: ${u.escuela_id}`);
        });
    }

    const targetStudentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';
    const { data: student } = await supabase
        .from('alumnos')
        .select('profesor_asignado_id')
        .eq('id', targetStudentId)
        .single();
    
    console.log(`\nStudent assigned to professor ID: ${student?.profesor_asignado_id}`);
}

check();
