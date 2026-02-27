import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function transfer() {
    const jaimeId = 'a2630b25-8bfc-40dd-bfa3-49d29dee6295';
    const ruddyId = '1259d0e6-8fa4-48ba-b262-4427c7b971c4';

    console.log('--- Buscando alumnos nacidos en 2014 asignados a Jaime Sanchez ---');

    const { data: alumnos, error: alumnosError } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, fecha_nacimiento')
        .gte('fecha_nacimiento', '2014-01-01')
        .lte('fecha_nacimiento', '2014-12-31')
        .eq('profesor_asignado_id', jaimeId)
        .is('archivado', false);

    if (alumnosError) {
        console.error('Error al buscar alumnos:', alumnosError.message);
        return;
    }

    if (!alumnos || alumnos.length === 0) {
        console.log('No se encontraron alumnos nacidos en 2014 asignados a Jaime Sanchez.');
        return;
    }

    console.log(`Se encontraron ${alumnos.length} alumnos para transferir.`);

    const idsToUpdate = alumnos.map(a => a.id);

    console.log('\n--- Actualizando alumnos en tabla principal ---');
    const { data: updated, error: updateError } = await supabase
        .from('alumnos')
        .update({ profesor_asignado_id: ruddyId })
        .in('id', idsToUpdate)
        .select();

    if (updateError) {
        console.error('Error al actualizar alumnos:', updateError.message);
        return;
    }

    console.log(`Se actualizaron ${updated.length} alumnos exitosamente en la tabla alumnos.`);

    console.log('\n--- Sincronizando tabla alumnos_entrenadores ---');

    for (const alumnoId of idsToUpdate) {
        // Eliminar relación antigua con Jaime (para este alumno)
        const { error: delError } = await supabase
            .from('alumnos_entrenadores')
            .delete()
            .eq('alumno_id', alumnoId)
            .eq('entrenador_id', jaimeId);

        if (delError) {
            console.error(`Error al eliminar relación previa para alumno ${alumnoId}:`, delError.message);
        }

        // Insertar o actualizar relación con Ruddy
        // Usamos upsert si la tabla tiene una constraint única o simplemente insertamos manejando el error
        // Según logs previos, hay una constraint única en alumnos_entrenadores_pkey (probablemente alumno_id, entrenador_id)
        const { error: relError } = await supabase
            .from('alumnos_entrenadores')
            .upsert({ alumno_id: alumnoId, entrenador_id: ruddyId }, { onConflict: 'alumno_id, entrenador_id' });

        if (relError) {
            console.error(`Error en la tabla alumnos_entrenadores para alumno ${alumnoId}:`, relError.message);
        }
    }

    console.log('\nProceso completado exitosamente.');
}

transfer();
