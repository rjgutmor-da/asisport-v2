import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listarHorarios() {
    console.log('🔍 Listando todos los horarios disponibles...');

    // Primero intentemos sin filtrar por escuela, por si acaso
    const { data: todos, error: errTodos } = await supabase
        .from('horarios')
        .select('*');

    if (errTodos) {
        console.error('❌ Error general:', errTodos.message);
        return;
    }

    if (!todos || todos.length === 0) {
        console.log('⚠️ No hay NINGÚN horario en la tabla "horarios".');
        return;
    }

    console.log(`✅ Total horarios encontrados: ${todos.length}`);
    todos.forEach(h => {
        console.log(`🆔 ID: ${h.id} -> ⏰ Hora: ${h.hora} (Escuela: ${h.escuela_id})`);
    });
}

listarHorarios();
