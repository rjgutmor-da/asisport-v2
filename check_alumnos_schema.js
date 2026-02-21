
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAlumnosColumns() {
    const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching alumno:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns for alumnos:', Object.keys(data[0]));
    } else {
        console.log('No data in alumnos table, trying to get columns via another way...');
        // Fallback or just list possible columns from code
    }
}

checkAlumnosColumns();
