
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ==========================================
// CONFIGURACIÓN
// ==========================================
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE'; // REEMPLAZAR CON TU SERVICE KEY SI CAMBIA
const ESCUELA_ID = 'TU_UUID_DE_ESCUELA_PLANETA_FC'; // <--- PEGAR AQUI EL UUID DE LA ESCUELA PLANETA FC
const CSV_FILE = 'alumnos.csv'; // Nombre del archivo a importar

// IDs por defecto (Opcional: Si quieres asignar todos a una cancha/horario inicial)
// Dejar en null si prefieres que queden sin asignar
const DEFAULT_CANCHA_ID = null;
const DEFAULT_HORARIO_ID = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function importarAlumnos() {
    console.log('🚀 Iniciando importación de alumnos...');

    // 1. Leer archivo CSV
    const filePath = path.join(process.cwd(), CSV_FILE);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ No se encontró el archivo: ${CSV_FILE}`);
        console.log('   Por favor guarda tu Excel como CSV en la raíz del proyecto.');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Asumimos que la primera línea es header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    console.log(`📊 Encontradas ${dataLines.length} filas para procesar.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Procesar cada línea
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const values = line.split(',').map(v => v.trim());

        // Mapeo simple basado en posición (Ajustar según tu CSV)
        // Ejemplo CSV: Nombres, Apellidos, FechaNacimiento, Carnet, Padre, TelefonoPadre
        // Limpieza de teléfono para el CSV
        const rawPhone = values[5] || null;
        let finalPhone = rawPhone;
        if (rawPhone) {
            const clean = rawPhone.replace(/\D/g, '');
            if (clean.length === 8) {
                finalPhone = `591${clean}`;
            } else {
                finalPhone = clean;
            }
        }

        const alumno = {
            nombres: values[0],
            apellidos: values[1],
            fecha_nacimiento: values[2], // Formato YYYY-MM-DD
            carnet_identidad: values[3] || null,
            nombre_padre: values[4] || null,
            telefono_padre: finalPhone,

            // Campos fijos
            escuela_id: ESCUELA_ID,
            cancha_id: DEFAULT_CANCHA_ID,
            horario_id: DEFAULT_HORARIO_ID,
            estado: 'Pendiente',
            archivado: false
        };

        // Validaciones básicas
        if (!alumno.nombres || !alumno.apellidos || !alumno.fecha_nacimiento) {
            console.warn(`⚠️  Fila ${i + 2}: Saltando por datos incompletos (${line})`);
            errorCount++;
            continue;
        }

        try {
            const { error } = await supabase.from('alumnos').insert([alumno]);

            if (error) {
                console.error(`❌ Error fila ${i + 2}: ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ Importado: ${alumno.nombres} ${alumno.apellidos}`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Error inesperado fila ${i + 2}:`, err);
            errorCount++;
        }
    }

    console.log('\n==========================================');
    console.log('🏁 Importación finalizada');
    console.log(`✅ Éxitos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('==========================================');
}

importarAlumnos();
