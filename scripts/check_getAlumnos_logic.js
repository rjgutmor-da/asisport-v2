
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const coachId = '4540a17c-7f3d-474b-9c0f-ac638fc290d0';
const targetStudentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';

const hoy = new Date();
const anoActual = hoy.getFullYear();
const mesFormat = String(hoy.getMonth() + 1).padStart(2, '0');
const primerDiaMes = `${anoActual}-${mesFormat}-01`;

async function check() {
    let query = supabase
        .from('alumnos')
        .select(`
            id,
            nombres,
            apellidos,
            asistencias_normales(count),
            asistencias_arqueros(count)
        `)
        .eq('escuela_id', '218ea007-49c4-4fa2-9e81-3b6663496f26')
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA')
        .eq('profesor_asignado_id', coachId);

    console.log('--- Phase 1: Basic Query ---');
    const { data: d1 } = await query;
    console.log('Count before assist filters:', d1.length);
    console.log('Target present in Phase 1:', d1.some(a => a.id === targetStudentId));

    console.log('\n--- Phase 2: Adding Normal Asis Filters ---');
    let q2 = query
        .gte('asistencias_normales.fecha', primerDiaMes)
        .in('asistencias_normales.estado', ['Presente', 'Licencia']);
    const { data: d2 } = await q2;
    console.log('Count after normal assist filters:', d2 ? d2.length : 'error');
    console.log('Target present in Phase 2:', d2?.some(a => a.id === targetStudentId));

    console.log('\n--- Phase 3: Adding Arquero Asis Filters ---');
    let q3 = q2
        .gte('asistencias_arqueros.fecha', primerDiaMes)
        .in('asistencias_arqueros.estado', ['Presente', 'Licencia']);
    const { data: d3 } = await q3;
    console.log('Count after all assist filters:', d3 ? d3.length : 'error');
    console.log('Target present in Phase 3:', d3?.some(a => a.id === targetStudentId));
}

check();
