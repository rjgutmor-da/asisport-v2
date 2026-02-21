import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function buscarProfesor() {
    console.log('🔍 Buscando a "Jaime Sanchez" en la tabla usuarios...');

    // Intentamos buscar coincidencias aproximadas
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nombres', '%Jaime%') // Buscamos por nombre 
    // También podríamos buscar por apellidos si estuvieran separados, pero 'nombres' parece ser el campo completo o nombre
    // En importar_alumnos vimos 'nombres' y 'apellidos', PERO en usuarios.js solo vimos 'nombres' usado en order()
    // Asumimos que usuarios tiene 'nombres' y 'apellidos' o un campo completo.
    // Haremos una búsqueda amplia.

    if (error) {
        console.error('❌ Error al buscar:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        // Intentar buscar por apellidos si no se encontró por nombres
        const { data: dataApellidos, error: errorApellidos } = await supabase
            .from('usuarios')
            .select('*')
            .ilike('apellidos', '%Sanchez%');

        if (dataApellidos && dataApellidos.length > 0) {
            console.log('✅ Encontrado(s) por apellido "Sanchez":');
            mostrarResultados(dataApellidos);
            return;
        }

        console.log('⚠️ No se encontró ningún usuario con ese nombre.');
    } else {
        console.log(`✅ Encontrado(s) ${data.length} coincidencias por nombre "Jaime":`);
        mostrarResultados(data);
    }
}

function mostrarResultados(usuarios) {
    usuarios.forEach(u => {
        // Verificamos si coincide con Jaime Sanchez
        const nombreCompleto = `${u.nombres} ${u.apellidos || ''}`.trim();
        if (nombreCompleto.toLowerCase().includes('jaime sanchez') ||
            (u.nombres.toLowerCase().includes('jaime') && u.apellidos?.toLowerCase().includes('sanchez'))) {
            console.log('\n🎯 ¡COINCIDENCIA EXACTA O CERCANA!');
        }

        console.log(`----------------------------------------`);
        console.log(`🆔 ID:       ${u.id}`);
        console.log(`👤 Nombre:   ${u.nombres} ${u.apellidos || ''}`);
        console.log(`📧 Email:    ${u.email || 'N/A'}`);
        console.log(`🎭 Rol:      ${u.rol || 'N/A'}`);
        console.log(`🏫 Escuela:  ${u.escuela_id || 'N/A'}`);
    });
    console.log(`----------------------------------------`);
}

buscarProfesor();
