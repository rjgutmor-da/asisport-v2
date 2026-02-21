import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';
const HORARIO_ID_1830 = '12536d53-38a6-4c87-b00a-49de789a9d25';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function asignarHorarioMasivo() {
    console.log('🚀 Iniciando asignación masiva de horario 18:30...');

    // 1. Obtener la fecha de hoy para filtrar (formato YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    console.log(`📅 Buscando alumnos creados HOY (${today}) en la escuela PLANETA FC...`);

    // 2. Buscar alumnos candidatos
    // - De la escuela correcta
    // - Creados hoy (gte today)
    // - Que NO tengan horario asignado (o podemos pisarlo, pero seguro mejor chequear)
    // Vamos a buscar todos los de hoy para confirmar
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, created_at, horario_id')
        .eq('escuela_id', ESCUELA_ID)
        .gte('created_at', today) // Creados desde las 00:00 de hoy UTC
        .is('horario_id', null);  // Solo los que no tienen horario (los importados tenian null)

    if (error) {
        console.error('❌ Error al buscar alumnos:', error.message);
        return;
    }

    if (!alumnos || alumnos.length === 0) {
        console.log('⚠️ No se encontraron alumnos recientes SIN horario.');
        return;
    }

    console.log(`📋 Se encontraron ${alumnos.length} alumnos para actualizar.`);
    // Mostrar nombres para que el usuario confirme mentalmente (o vea el log)
    alumnos.forEach(a => console.log(`   - ${a.nombres} ${a.apellidos}`));

    // 3. Actualizar masivamente
    // Obtenemos los IDs
    const ids = alumnos.map(a => a.id);

    const { error: updateError } = await supabase
        .from('alumnos')
        .update({ horario_id: HORARIO_ID_1830 })
        .in('id', ids);

    if (updateError) {
        console.error('❌ Error al actualizar horarios:', updateError.message);
    } else {
        console.log(`\n✅ ÉXITO: Se asignó el horario 18:30 a los ${ids.length} alumnos.`);
    }
}

asignarHorarioMasivo();
