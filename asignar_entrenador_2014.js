import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);


async function run() {
    console.log('--- Buscando al entrenador Ruddy Coronado ---');
    const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos, email')
        .ilike('nombres', '%Ruddy%')
        .ilike('apellidos', '%Coronado%');


    if (userError) {
        console.error('Error al buscar usuario:', userError.message);
        return;
    }

    if (users.length === 0) {
        console.log('No se encontró al entrenador Ruddy Coronado.');
        return;
    }

    const trainer = users[0];
    console.log(`Entrenador encontrado: ${trainer.nombres} ${trainer.apellidos} (ID: ${trainer.id})`);


    console.log('\n--- Buscando alumnos nacidos en 2014 ---');
    // Supabase permite usar like para fechas si se convierten a string, 
    // pero es mejor filtrar por rango si es posible o usar la columna directamente si es texto.
    // Asumiendo que fecha_nacimiento es tipo Date o ISO string.

    const { data: alumnos, error: alumnosError } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, fecha_nacimiento')
        .gte('fecha_nacimiento', '2014-01-01')
        .lte('fecha_nacimiento', '2014-12-31')
        .is('archivado', false);

    if (alumnosError) {
        console.error('Error al buscar alumnos:', alumnosError.message);
        return;
    }

    if (alumnos.length === 0) {
        console.log('No se encontraron alumnos nacidos en 2014.');
        return;
    }

    console.log(`Se encontraron ${alumnos.length} alumnos nacidos en 2014.`);

    const idsToUpdate = alumnos.map(a => a.id);

    console.log('\n--- Actualizando alumnos ---');
    const { data: updated, error: updateError } = await supabase
        .from('alumnos')
        .update({ profesor_asignado_id: trainer.id })
        .in('id', idsToUpdate)
        .select();

    if (updateError) {
        console.error('Error al actualizar alumnos:', updateError.message);
        return;
    }

    console.log(`Se actualizaron ${updated.length} alumnos exitosamente.`);

    // También actualizar la tabla de relación por si acaso (aunque se supone que ya no se usa, es mejor mantener consistencia si existe)
    console.log('\n--- Actualizando tabla de relación alumnos_entrenadores ---');

    for (const alumnoId of idsToUpdate) {
        // Primero eliminar relaciones previas si existen (según la nueva lógica de 1 a 1)
        await supabase.from('alumnos_entrenadores').delete().eq('alumno_id', alumnoId);

        // Insertar la nueva relación
        const { error: relError } = await supabase
            .from('alumnos_entrenadores')
            .insert({ alumno_id: alumnoId, entrenador_id: trainer.id });

        if (relError) {
            console.error(`Error al insertar relación para alumno ${alumnoId}:`, relError.message);
        }
    }

    console.log('Proceso completado.');
}

run();
