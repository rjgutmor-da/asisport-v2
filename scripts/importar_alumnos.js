import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// ==========================================
// CONFIGURACIÓN
// ==========================================
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID_POR_DEFECTO = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // <--- Se usará si no se especifica (PLANETA FC)
const EXCEL_FILE = 'alumnos.xlsx';

// Identificadores por defecto
const DEFAULT_CANCHA_ID = null;
const DEFAULT_HORARIO_ID = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Función auxiliar para parsear fechas de Excel
function parseExcelDate(excelDate) {
    if (!excelDate) return null;

    // Si es un número (formato serial de Excel)
    if (typeof excelDate === 'number') {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Si es string
    if (typeof excelDate === 'string') {
        const trimmed = excelDate.trim();
        // Intentar formato DD/MM/YYYY
        if (trimmed.includes('/')) {
            const parts = trimmed.split('/');
            if (parts.length === 3) {
                // Asumimos DD/MM/YYYY
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        // Intentar devolver tal cual si parece YYYY-MM-DD
        return trimmed;
    }
    return null;
}

function cleanPhone(phone) {
    if (!phone) return null;
    const clean = phone.toString().replace(/\D/g, '');
    return clean.length === 8 ? `591${clean}` : clean;
}

// Normalizador de headers para flexibilidad
function normalizeHeader(header) {
    return header?.toString().toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '') || '';
}

async function importarAlumnos() {
    console.log('🚀 Iniciando importación de alumnos desde Excel...');

    // 1. Leer archivo Excel
    const filePath = path.join(process.cwd(), EXCEL_FILE);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ No se encontró el archivo: ${EXCEL_FILE}`);
        console.log('   Asegúrate de tener "alumnos.xlsx" en la raíz del proyecto.');
        return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a JSON crudo (array de arrays para detectar headers manualmente o array de objetos)
    // Usamos sheet_to_json por defecto (asume primera fila como header)
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
        console.warn('⚠️  El archivo Excel parece estar vacío o solo tiene encabezados.');
        return;
    }

    console.log(`📊 Encontradas ${rawData.length} filas para procesar.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Procesar cada fila
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];

        // Mapeo flexible de columnas basado en nombres de propiedades
        const keys = Object.keys(row);
        const getValue = (targetNames) => {
            const key = keys.find(k => targetNames.includes(normalizeHeader(k)));
            return key ? row[key] : null;
        };

        const nombres = getValue(['nombres', 'nombre', 'name']);
        const apellidos = getValue(['apellidos', 'apellido', 'lastname']);
        const rawFecha = getValue(['fecha nacimiento', 'fecha nac', 'nacimiento', 'fecha']);
        const carnet = getValue(['carnet', 'ci', 'cedula', 'dni']);

        // Padre
        const rawPhonePadre = getValue(['telefono padre', 'celular padre', 'tel padre', 'cel padre']);
        const nombrePadre = getValue(['nombre padre', 'padre', 'tutor', 'apoderado']);

        // Madre (NUEVO)
        const rawPhoneMadre = getValue(['telefono madre', 'celular madre', 'tel madre', 'cel madre', 'telefono mama']);
        const nombreMadre = getValue(['nombre madre', 'madre', 'mama']);

        const rawEscuelaId = getValue(['escuela id', 'id escuela', 'escuela']) || ESCUELA_ID_POR_DEFECTO;
        const rawProfesorId = getValue(['profesor id', 'id profesor', 'profesor', 'entrenador']);

        // Limpieza y validación
        const fechaNac = parseExcelDate(rawFecha);
        const telPadre = cleanPhone(rawPhonePadre);
        const telMadre = cleanPhone(rawPhoneMadre);

        // Validaciones básicas de campos obligatorios
        if (!nombres || !apellidos || !fechaNac) {
            console.warn(`⚠️  Fila ${i + 2}: Saltada por datos incompletos.`);
            if (!nombres) console.warn('   -> Falta Nombres');
            if (!apellidos) console.warn('   -> Falta Apellidos');
            if (!fechaNac) console.warn(`   -> Fecha inválida o faltante (Valor original: ${rawFecha})`);
            errorCount++;
            continue;
        }

        // Validación de Representante Legal (Regla de Negocio)
        const tienePadre = nombrePadre && telPadre;
        const tieneMadre = nombreMadre && telMadre;

        if (!tienePadre && !tieneMadre) {
            console.warn(`⚠️  Fila ${i + 2}: INCOMPLETA - ${nombres} ${apellidos}`);
            console.warn('   -> Falta representante legal completo.');
            console.warn('   -> Debes incluir "Nombre Padre" Y "Telefono Padre" O "Nombre Madre" Y "Telefono Madre".');
            errorCount++;
            continue;
        }

        const alumno = {
            nombres: nombres.toString().trim(),
            apellidos: apellidos.toString().trim(),
            fecha_nacimiento: fechaNac,
            carnet_identidad: carnet ? carnet.toString().trim() : null,

            nombre_padre: nombrePadre ? nombrePadre.toString().trim() : null,
            telefono_padre: telPadre,

            nombre_madre: nombreMadre ? nombreMadre.toString().trim() : null,
            telefono_madre: telMadre,

            // Campos de sistema
            escuela_id: rawEscuelaId,
            cancha_id: DEFAULT_CANCHA_ID,
            horario_id: DEFAULT_HORARIO_ID,
            profesor_asignado_id: rawProfesorId,
            estado: 'Pendiente',
            archivado: false
        };

        try {
            // 3. Insertar Alumno
            const { data: insertedAlumno, error } = await supabase
                .from('alumnos')
                .insert([alumno])
                .select()
                .single();

            if (error) {
                console.error(`❌ Error fila ${i + 2}: ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ Importado: ${insertedAlumno.nombres} ${insertedAlumno.apellidos}`);
                successCount++;

                // 4. Crear relación en 'alumnos_entrenadores' si hay profesor asignado
                if (rawProfesorId && insertedAlumno) {
                    const { error: relError } = await supabase
                        .from('alumnos_entrenadores')
                        .insert([{
                            alumno_id: insertedAlumno.id,
                            entrenador_id: rawProfesorId
                        }]);

                    if (relError) {
                        console.error(`   ⚠️ No se pudo asignar entrenador: ${relError.message}`);
                    } else {
                        console.log(`   -> Entrenador asignado.`);
                    }
                }
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
    console.log('NOTA: Si tuviste errores de "representante legal", asegúrate de llenar nombre Y teléfono del padre o de la madre.');
}

importarAlumnos();
```
