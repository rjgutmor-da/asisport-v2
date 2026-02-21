import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listar() {
    console.log('🔍 Buscando datos...');

    console.log('\n==========================================');
    console.log('🏫 ESCUELAS DISPONIBLES');
    console.log('==========================================');
    const { data: escuelas, error: errEsc } = await supabase.from('escuelas').select('id, nombre');
    if (errEsc) console.error('Error al obtener escuelas:', errEsc.message);
    else if (escuelas.length === 0) console.log('No se encontraron escuelas.');
    else console.table(escuelas);

    console.log('\n==========================================');
    console.log('👨‍🏫 PROFESORES (Perfiles con rol Entrenador)');
    console.log('==========================================');
    // Intentamos buscar perfiles con rol de Entrenador
    // Ajusta 'rol' si tu columna se llama diferente (ej: role)
    const { data: profiles, error: errProf } = await supabase
        .from('profiles')
        .select('id, nombres, apellidos, rol')
        .eq('rol', 'Entrenador');

    if (errProf) {
        console.log('⚠️ Error al buscar por rol "Entrenador", listando los primeros 10 perfiles para referencia...');
        const { data: allP } = await supabase.from('profiles').select('id, nombres, apellidos, rol').limit(10);
        console.table(allP);
    } else if (profiles && profiles.length > 0) {
        console.table(profiles);
    } else {
        console.log('No se encontraron perfiles con el rol "Entrenador".');
        console.log('Listando todos los perfiles disponibles (limitado a 5) para verificar:');
        const { data: allP } = await supabase.from('profiles').select('id, nombres, apellidos, rol').limit(5);
        if (allP) console.table(allP);
    }
    console.log('\n==========================================');
}

listar();
