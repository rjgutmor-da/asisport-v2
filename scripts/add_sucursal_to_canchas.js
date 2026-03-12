/**
 * Script: add_sucursal_to_canchas.js
 * 
 * Verifica si la tabla 'canchas' tiene la columna 'sucursal_id'.
 * Si no existe, muestra el SQL necesario para agregarla.
 * 
 * Ejecutar con: node scripts/add_sucursal_to_canchas.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarYAgregarColumna() {
    console.log('🔍 Verificando columnas de la tabla canchas...\n');

    // Leer una fila para inspeccionar las columnas disponibles
    const { data, error } = await supabase
        .from('canchas')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error al leer la tabla canchas:', error.message);
        return;
    }

    const columnas = data && data.length > 0 ? Object.keys(data[0]) : [];
    console.log('📋 Columnas actuales en "canchas":', columnas.join(', '));

    if (columnas.includes('sucursal_id')) {
        console.log('\n✅ La columna "sucursal_id" YA EXISTE en la tabla canchas.');
        console.log('   No es necesario realizar ningún cambio en la base de datos.');
    } else {
        console.log('\n⚠️  La columna "sucursal_id" NO EXISTE todavía.');
        console.log('\n📝 Ejecuta el siguiente SQL en el Editor SQL de Supabase para agregarla:\n');
        console.log('---------------------------------------------------------------------');
        console.log(`
-- Agregar columna sucursal_id a la tabla canchas
ALTER TABLE public.canchas
ADD COLUMN sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL;

-- (Opcional) Crear índice para mejorar rendimiento en búsquedas por sucursal
CREATE INDEX IF NOT EXISTS idx_canchas_sucursal_id ON public.canchas(sucursal_id);
        `);
        console.log('---------------------------------------------------------------------');
        console.log('\n💡 Pasos:');
        console.log('   1. Ve a https://supabase.com/dashboard');
        console.log('   2. Selecciona tu proyecto');
        console.log('   3. Ve a "SQL Editor"');
        console.log('   4. Pega y ejecuta el SQL de arriba');
        console.log('   5. Vuelve a ejecutar este script para confirmar que se agregó correctamente.');
    }
}

verificarYAgregarColumna();
