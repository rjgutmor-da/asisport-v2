
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const coachId = '4540a17c-7f3d-474b-9c0f-ac638fc290d0';

async function check() {
    const { data: students, error } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, estado, sucursal_id, profesor_asignado_id')
        .eq('profesor_asignado_id', coachId);
    
    console.log(`Total students assigned to Coach ${coachId}: ${students.length}`);
    students.forEach(s => {
        console.log(`- ${s.nombres} ${s.apellidos} [ID: ${s.id}] [Estado: ${s.estado}] [Sucursal: ${s.sucursal_id}]`);
    });

    const targetStudentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';
    const target = students.find(s => s.id === targetStudentId);
    if (target) {
        console.log('\nTarget student IS in the assigned list.');
    } else {
        console.log('\nTarget student IS NOT in the assigned list!!');
    }
}

check();
