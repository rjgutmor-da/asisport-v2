
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const studentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';
const coachId = '4540a17c-7f3d-474b-9c0f-ac638fc290d0';

const hoy = new Date();
const anoActual = hoy.getFullYear();
const mesFormat = String(hoy.getMonth() + 1).padStart(2, '0');
const primerDiaMes = `${anoActual}-${mesFormat}-01`;

async function check() {
    console.log('Checking student asistencias...');
    const { data: asistenciasN, error: errN } = await supabase
        .from('asistencias_normales')
        .select('*')
        .eq('alumno_id', studentId)
        .gte('fecha', primerDiaMes);
    
    console.log('Normal Asistencias this month:', asistenciasN?.length || 0);

    const { data: asistenciasA, error: errA } = await supabase
        .from('asistencias_arqueros')
        .select('*')
        .eq('alumno_id', studentId)
        .gte('fecha', primerDiaMes);
    
    console.log('Arquero Asistencias this month:', asistenciasA?.length || 0);

    // Simulate the query in getAlumnos
    console.log('\nSimulating getAlumnos query for this coach...');
    let query = supabase
        .from('alumnos')
        .select(`
            id,
            nombres,
            profesor_asignado_id,
            asistencias_normales(count),
            asistencias_arqueros(count)
        `)
        .eq('id', studentId) // Check specifically for this student
        .eq('profesor_asignado_id', coachId)
        .gte('asistencias_normales.fecha', primerDiaMes)
        .in('asistencias_normales.estado', ['Presente', 'Licencia'])
        .gte('asistencias_arqueros.fecha', primerDiaMes)
        .in('asistencias_arqueros.estado', ['Presente', 'Licencia']);

    const { data, error } = await query;
    if (error) {
        console.error('getAlumnos simulation error:', error);
    } else {
        console.log('getAlumnos simulation result (count):', data.length);
        if (data.length === 0) {
            console.log('STUDENT IS FILTERED OUT by the query logic!');
        }
    }
}

check();
