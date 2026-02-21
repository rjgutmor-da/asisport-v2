
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIds() {
    console.log('--- VERIFICANDO DISPONIBILIDAD DE IDs ---');

    // Listar todos los profesores (usuarios con rol Entrenador)
    const { data: profesores } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos')
        .eq('rol', 'Entrenador');

    console.log('\nPROFESORES DISPONIBLES:');
    if (profesores) {
        profesores.forEach(p => console.log(`ID: ${p.id} | Nombre: ${p.nombres} ${p.apellidos}`));
    }

    // Listar todos los horarios
    const { data: horarios } = await supabase
        .from('horarios')
        .select('id, hora');

    console.log('\nHORARIOS DISPONIBLES:');
    if (horarios) {
        horarios.forEach(h => console.log(`ID: ${h.id} | Hora: ${h.hora}`));
    }
}

checkIds();
