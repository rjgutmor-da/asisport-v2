
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';
import fs from 'fs';

const supabase = obtenerClienteSupabaseAdmin();

async function exportForSQL() {
    const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
    
    // Obtener los alumnos con sus fotos actuales
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('nombres, apellidos, fecha_nacimiento, foto_url')
        .eq('escuela_id', ESCUELA_ID);

    if (error) {
        console.error(error);
        return;
    }

    fs.writeFileSync('c:/Users/Public/Documents/AsiSportv2/scripts/alumnos_backup.json', JSON.stringify(alumnos, null, 2));
    console.log(`✅ Backup de ${alumnos.length} alumnos listo para generar el SQL.`);
}

exportForSQL();
