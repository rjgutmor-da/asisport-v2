import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listarHorarios() {
    console.log('🔍 Buscando horarios para la escuela...');

    const { data: horarios, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('escuela_id', ESCUELA_ID);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.table(horarios);
}

listarHorarios();
