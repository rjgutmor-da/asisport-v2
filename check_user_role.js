
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uqrmmotcbnyazmadzfvd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('email, rol')
            .ilike('email', 'rjgutmor%');

        if (error) throw error;
        console.log('Usuarios encontrados:', data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkUser();
