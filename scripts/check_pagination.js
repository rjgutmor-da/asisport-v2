
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const coachId = '4540a17c-7f3d-474b-9c0f-ac638fc290d0';
const targetStudentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';

async function check() {
    const { data: students } = await supabase
        .from('alumnos')
        .select('id, created_at, nombres, apellidos')
        .eq('profesor_asignado_id', coachId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA')
        .order('created_at', { ascending: false });

    console.log(`Total students: ${students.length}`);
    const index = students.findIndex(s => s.id === targetStudentId);
    console.log(`Target student index in sorted list: ${index}`);
    console.log(`Target student created_at: ${students[index]?.created_at}`);

    if (index >= 20) {
        console.log(`YES! Target is on page ${Math.floor(index / 20) + 1}.`);
    } else {
        console.log(`NO! Target is on page 1 (index ${index}).`);
    }
}

check();
