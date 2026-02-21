
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resolveAdrianoData() {
    const escuelaId = '218ea007-49c4-4fa2-9e81-3b6663496f26';
    const profId = 'a2630b25-8bfc-40dd-bfa3-49d29dee6295';
    const canchaId = '0336a91f-a3c7-4ca2-b01c-043f21bf8f03';
    const horarioId = '832bf94e-fe52-449b-b5bd-271aa50e1b29';

    console.log('--- RESOLVIENDO DATOS DE ADRIANO ---');

    // Escuela
    const { data: escuela } = await supabase
        .from('escuelas')
        .select('nombre')
        .eq('id', escuelaId)
        .maybeSingle();

    if (escuela) console.log(`Escuela: ${escuela.nombre}`);
    else console.log(`Escuela: No encontrada (${escuelaId})`);

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

resolveAdrianoData();
