
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resolveIds() {
    const profId = 'a2630b25-8bfc-40dd-bfa3-49d29dee6309';
    const canchaId = '554a997b-1604-4a34-8ece-9576dceb8ff4';
    const horarioId = '43688db4-dfeb-4991-84cb-2d5719f51437';

    console.log('--- RESOLVIENDO IDs DEL ALUMNO ---');

    // Profesor
    const { data: prof } = await supabase
        .from('usuarios')
        .select('nombres, apellidos')
        .eq('id', profId)
        .maybeSingle();

    if (prof) console.log(`Profesor: ${prof.nombres} ${prof.apellidos}`);
    else console.log(`Profesor: No encontrado (${profId})`);

    // Cancha
    const { data: cancha } = await supabase
        .from('canchas')
        .select('nombre')
        .eq('id', canchaId)
        .maybeSingle();

    if (cancha) console.log(`Cancha: ${cancha.nombre}`);
    else console.log(`Cancha: No encontrada (${canchaId})`);

    // Horario
    const { data: horario } = await supabase
        .from('horarios')
        .select('hora')
        .eq('id', horarioId)
        .maybeSingle();

    if (horario) console.log(`Horario: ${horario.hora}`);
    else console.log(`Horario: No encontrado (${horarioId})`);
}

resolveIds();
