import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getMasters() {
    const { data: horarios } = await supabase.from('horarios').select('id, hora').eq('escuela_id', ESCUELA_ID);
    const { data: canchas } = await supabase.from('canchas').select('id, nombre').eq('escuela_id', ESCUELA_ID);
    console.log('--- HORARIOS ---');
    console.log(horarios);
    console.log('--- CANCHAS ---');
    console.log(canchas);
}

getMasters();
