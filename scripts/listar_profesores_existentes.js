import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listarProfes() {
    console.log('🔍 Buscando profesores asignados previamente...');

    // Buscar en la tabla de relaciones
    const { data: relaciones, error } = await supabase
        .from('alumnos_entrenadores')
        .select('entrenador_id')
        .limit(50);

    if (error) {
        console.error('❌ Error al consultar asignaciones:', error.message);
        return;
    }

    if (!relaciones || relaciones.length === 0) {
        console.log('⚠️ No se encontraron profesores asignados en el sistema aún.');
        console.log('➡️ Si no tienes el ID, puedes dejar la columna "Profesor ID" vacía en el Excel.');
        console.log('   Podrás asignar el profesor más tarde desde la aplicación.');
        return;
    }

    // Obtener IDs únicos
    const unicos = [...new Set(relaciones.map(r => r.entrenador_id))];

    console.log('\n==========================================');
    console.log('📋 IDs DE PROFESORES YA EN USO');
    console.log('==========================================');
    unicos.forEach(id => {
        console.log(`🆔 ${id}`);
    });
    console.log('\n(Copia uno de estos IDs si corresponde al profesor que buscas)');
}

listarProfes();
