import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const COACH_ID = '1259d0e6-8fa4-48ba-b262-4427c7b971c4'; // Ruddy Coronado

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function asignarAlumnos2014() {
    console.log('🔍 Buscando alumnos nacidos en 2014...');

    // 1. Buscar alumnos nacidos en 2014
    const { data: alumnos, error: alumnosErr } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, fecha_nacimiento')
        .gte('fecha_nacimiento', '2014-01-01')
        .lte('fecha_nacimiento', '2014-12-31')
        .eq('archivado', false);

    if (alumnosErr) {
        console.error('❌ Error al buscar alumnos:', alumnosErr.message);
        return;
    }

    if (!alumnos || alumnos.length === 0) {
        console.log('⚠️ No se encontraron alumnos nacidos en 2014.');
        return;
    }

    console.log(`✅ Encontrados ${alumnos.length} alumnos.`);

    // 2. Preparar inserciones en alumnos_entrenadores
    const asignaciones = alumnos.map(a => ({
        alumno_id: a.id,
        entrenador_id: COACH_ID
    }));

    console.log(`🚀 Asignando a entrenador ${COACH_ID}...`);

    // Usamos upsert por si ya existía alguna relación
    const { error: insertErr } = await supabase
        .from('alumnos_entrenadores')
        .upsert(asignaciones, { onConflict: 'alumno_id, entrenador_id' });

    if (insertErr) {
        console.error('❌ Error al asignar alumnos:', insertErr.message);
    } else {
        console.log(`✨ Se han asignado los ${alumnos.length} alumnos correctamente.`);
    }
}

asignarAlumnos2014();
