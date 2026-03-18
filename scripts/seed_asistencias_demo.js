
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
const USUARIO_DEMO_ID = '5bc0896a-9a9d-4135-b835-f552fa92abfa';

async function generateHistory() {
    console.log('📅 Generando historial de asistencias para Marzo...');

    try {
        const { data: alumnos, error: aErr } = await supabase
            .from('alumnos')
            .select('id, nombres')
            .eq('escuela_id', ESCUELA_ID);

        if (aErr) throw aErr;
        console.log(`📦 Procesando ${alumnos.length} alumnos.`);

        const hoy = 17;
        const asistencias = [];

        for (let dia = 1; dia <= hoy; dia++) {
            const fecha = `2026-03-${dia.toString().padStart(2, '0')}`;
            
            for (const alumno of alumnos) {
                let estado = 'Presente';
                const rand = Math.random();

                if (alumno.nombres.includes('Lionel')) {
                    estado = rand > 0.05 ? 'Presente' : 'Licencia';
                } else if (alumno.nombres.includes('Neymar')) {
                    if (rand < 0.6) estado = 'Ausente';
                    else if (rand < 0.8) estado = 'Licencia';
                    else estado = 'Presente';
                } else {
                    if (rand < 0.75) estado = 'Presente';
                    else if (rand < 0.9) estado = 'Licencia';
                    else estado = 'Ausente';
                }

                asistencias.push({
                    alumno_id: alumno.id,
                    fecha: fecha,
                    estado: estado,
                    entrenador_id: USUARIO_DEMO_ID
                });
            }
        }

        console.log(`🚀 Insertando ${asistencias.length} registros...`);

        for (let i = 0; i < asistencias.length; i += 100) {
            const batch = asistencias.slice(i, i + 100);
            const { error: iErr } = await supabase
                .from('asistencias_normales')
                .insert(batch);
            
            if (iErr) console.error(`❌ Error en lote ${i}:`, iErr.message);
        }

        console.log('✨ Historial de Marzo completado con éxito.');
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
}

generateHistory();
