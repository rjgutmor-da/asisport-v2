import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';

// IDs OBTENIDOS
const CANCHA_1_ID = '0336a91f-a3c7-4ca2-b01c-043f21bf8f03'; // Villa-Mercedes-1
const CANCHA_2_ID = '554a997b-1604-4a34-8ece-9576dceb8ff4'; // Villa-Mercedes-2

// LISTA DE NOMBRES PARA CANCHA 1 (Normalizaremos todo a minúsculas y sin acentos para comparar)
const GRUPO_1_KEYWORDS = [
    'Bruno Mateo',
    'Carlito Romero',
    'Diego Meneses',
    'Eduardo Pinera', // Piñera -> Pinera (luego normalizamos)
    'Facundo Velasco',
    'Federico Vaca',
    'Gabriel Matias',
    'Jhomnefer Barba',
    'Jose Dario',
    'Josue Vaca',
    'Juan Pablo',
    'Lucas Tellez',
    'Renzo Ribera',
    'Samuel Felipe',
    'Santiago Hinojosa',
    'Tadeo Zenteno',
    'Xavi Lionel'
];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para normalizar texto (quitar acentos y diacríticos)
function normalizeText(text) {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function asignarCanchas() {
    console.log('🚀 Asignando canchas a los alumnos importados hoy...');

    const today = new Date().toISOString().split('T')[0];

    // 1. Obtener alumnos de hoy
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos')
        .eq('escuela_id', ESCUELA_ID)
        .gte('created_at', today);

    if (error) {
        console.error('❌ Error al obtener alumnos:', error.message);
        return;
    }

    if (!alumnos || alumnos.length === 0) {
        console.log('⚠️ No se encontraron alumnos de hoy.');
        return;
    }

    console.log(`📋 Procesando ${alumnos.length} alumnos...`);

    let countCancha1 = 0;
    let countCancha2 = 0;

    // Listas de IDs para update masivo
    const idsCancha1 = [];
    const idsCancha2 = [];

    // 2. Clasificar alumnos
    alumnos.forEach(alumno => {
        const nombreCompleto = `${alumno.nombres} ${alumno.apellidos}`;
        const normalizedName = normalizeText(nombreCompleto);

        // Verificar si coincide con alguna keyword del grupo 1
        let esGrupo1 = false;
        for (const keyword of GRUPO_1_KEYWORDS) {
            const normalizedKeyword = normalizeText(keyword);
            if (normalizedName.includes(normalizedKeyword)) {
                esGrupo1 = true;
                break;
            }
        }

        if (esGrupo1) {
            idsCancha1.push(alumno.id);
            console.log(`✅ [VM-1] ${nombreCompleto}`);
            countCancha1++;
        } else {
            idsCancha2.push(alumno.id);
            console.log(`🔵 [VM-2] ${nombreCompleto}`);
            countCancha2++;
        }
    });

    // 3. ejecutar Updates
    if (idsCancha1.length > 0) {
        const { error: err1 } = await supabase
            .from('alumnos')
            .update({ cancha_id: CANCHA_1_ID })
            .in('id', idsCancha1);

        if (err1) console.error('❌ Error actualizando Grupo 1:', err1.message);
        else console.log(`\n💾 Guardados ${idsCancha1.length} alumnos en Villa-Mercedes-1`);
    }

    if (idsCancha2.length > 0) {
        const { error: err2 } = await supabase
            .from('alumnos')
            .update({ cancha_id: CANCHA_2_ID })
            .in('id', idsCancha2);

        if (err2) console.error('❌ Error actualizando Grupo 2:', err2.message);
        else console.log(`💾 Guardados ${idsCancha2.length} alumnos en Villa-Mercedes-2`);
    }

    console.log('\n==========================================');
    console.log(`Total procesados: ${alumnos.length}`);
    console.log(`Villa-Mercedes-1: ${countCancha1} (Esperados: 17)`);
    console.log(`Villa-Mercedes-2: ${countCancha2} (Esperados: 16)`);
    console.log('==========================================');
}

asignarCanchas();
