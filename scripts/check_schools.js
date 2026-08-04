
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';
import fs from 'fs';
import path from 'path';

const supabase = obtenerClienteSupabaseAdmin();

async function checkSchool() {
    const { data: schools, error } = await supabase.from('escuelas').select('id, nombre');
    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }
    console.log('Current schools:', JSON.stringify(schools, null, 2));
}

checkSchool();
