import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function eliminarDuplicado() {
    console.log('🔍 Buscando duplicados de "Josue Vaca Gutierrez"...');

    // Búsqueda amplia
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('*')
        .ilike('nombres', '%Josue%')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error al buscar:', error.message);
        return;
    }

    // Filtrar en JS para ver qué está pasando
    console.log(`📋 Total encontrados con nombre "Josue": ${alumnos.length}`);

    const candidatos = alumnos.filter(a => {
        const full = `${a.nombres} ${a.apellidos}`.toLowerCase();
        return full.includes('vaca');
    });

    console.log(`📋 Filtrados que contienen "vaca": ${candidatos.length}`);
    candidatos.forEach((c, idx) =>
        console.log(`   ${idx + 1}. ${c.nombres} ${c.apellidos} (ID: ${c.id}) - Creado: ${c.created_at}`)
    );

    if (candidatos.length < 2) {
        console.log('⚠️ No hay suficientes coincidencias para determinar duplicados.');
        return;
    }

    // Estrategia: Conservar el primero (más antiguo), eliminar el resto.
    // El primero del array [0] es el más antiguo porque ordenamos ascending
    const [original, ...duplicados] = candidatos;
    const idsEliminar = duplicados.map(d => d.id);

    if (idsEliminar.length > 0) {
        console.log(`\n🛑 Procesando eliminación de ${idsEliminar.length} duplicado(s)...`);
        console.log(`   Conservando a: ${original.nombres} ${original.apellidos} (ID: ${original.id})`);

        // ESTRATEGIA: Soft Delete (Archivar) porque el trigger de BD impide Hard Delete
        console.log('   ⚠️ Trigger de BD impide borrado físico completo.');
        console.log('   🔧 Solución: Archivando el registro para que no aparezca en listas...');

        const { error: updateError } = await supabase
            .from('alumnos')
            .update({
                archivado: true,
                nombres: `(DUPLICADO) ${duplicados[0].nombres}` // Renombrar para evitar confusión futura
            })
            .in('id', idsEliminar);

        if (updateError) {
            console.error('❌ Error al archivar:', updateError.message);
        } else {
            console.log('✅ Alumno duplicado archivado correctamente (Oculto de la vista).');
        }
    }
}

eliminarDuplicado();
