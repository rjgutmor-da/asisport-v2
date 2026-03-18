
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchool() {
    const { data: schools, error } = await supabase.from('escuelas').select('id, nombre');
    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }
    console.log('Current schools:', JSON.stringify(schools, null, 2));
}

checkSchool();
