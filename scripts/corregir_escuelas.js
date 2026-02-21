import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const KEEP_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC
const DELETE_IDS = [
    '6cdb132c-b00f-44e9-89d2-21c3b3d31379', // Planeta FC (old)
    'd74241c2-d599-4f8a-ad28-0f806f9c2264'  // Planeta FC (old)
];

const TABLES_TO_UPDATE = ['alumnos', 'canchas', 'horarios', 'profiles'];

async function corregirEscuelas() {
    console.log(`🚀 Iniciando unificación de escuelas...`);
    console.log(`✅ Keeping ID: ${KEEP_ID}`);
    console.log(`❌ Deleting IDs: ${DELETE_IDS.join(', ')}`);

    for (const deleteId of DELETE_IDS) {
        console.log(`\n--- Procesando ID a borrar: ${deleteId} ---`);

        // 1. Reasignar datos en tablas relacionadas
        for (const table of TABLES_TO_UPDATE) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .update({ escuela_id: KEEP_ID })
                    .eq('escuela_id', deleteId)
                    .select();

                if (error) {
                    // Ignoramos error si es porque la columna no existe, pero lo logueamos
                    if (error.code === '42703') { // Undefined column
                        console.log(`   ℹ️ La tabla '${table}' no tiene columna 'escuela_id'. Saltando.`);
                    } else {
                        console.error(`   ⚠️ Error actualizando tabla '${table}': ${error.message}`);
                    }
                } else {
                    console.log(`   ✨ Registros actualizados en '${table}': ${data.length}`);
                }
            } catch (err) {
                console.error(`   ⚠️ Excepción en tabla '${table}':`, err);
            }
        }

        // 2. Eliminar la escuela antigua
        console.log(`   🗑️ Eliminando escuela ${deleteId}...`);
        const { error: delError } = await supabase
            .from('escuelas')
            .delete()
            .eq('id', deleteId);

        if (delError) {
            console.error(`   ❌ Error al eliminar escuela: ${delError.message}`);
            console.log(`      (Posiblemente aún quedan registros vinculados que no pudimos migrar)`);
        } else {
            console.log(`   ✅ Escuela eliminada correctamente.`);
        }
    }

    console.log('\n🏁 Proceso finalizado.');
}

corregirEscuelas();
