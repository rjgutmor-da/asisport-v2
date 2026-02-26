import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activarHorario() {
    console.log('🚀 Activando y corrigiendo horario 17:30...');

    const { data, error } = await supabase
        .from('horarios')
        .update({
            hora: '17:30',
            activo: true
        })
        .eq('id', '202251a7-88dd-4f64-b469-3750a49c271d');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Horario 17:30 activado correctamente.');
    }
}

activarHorario();
