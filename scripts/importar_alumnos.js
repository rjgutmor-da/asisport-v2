import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// ==========================================
// CONFIGURACIÓN
// ==========================================
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID_POR_DEFECTO = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC
const EXCEL_FILE = 'C:\\Users\\rjgut\\Documents\\Trabajadrs\\AlumnosCilindro262302.xlsx';

// Mapeos de nombres a IDs
const COACH_MAP = {
    'wilmar cardozo': '1df51cb2-e42a-4aa6-b0ea-66c3ee4ae52a',
    'alexis hipamo': '64607217-75e1-424d-8a88-2eba809022e9'
};

const CANCHA_MAP = {
    'cancha principal': 'ae934f1b-2352-46dc-99e0-311eb69c4466',
    'villa-mercedes-1': '0336a91f-a3c7-4ca2-b01c-043f21bf8f03',
    'villa-mercedes-2': '554a997b-1604-4a34-8ece-9576dceb8ff4',
    'cilindro-1': '0f6f4275-ffe7-4f02-bc58-bdf1b0a92cad',
    'cilindro-2': 'f860ae72-d4e0-44f5-835d-4be04fb1e744',
    'cilindro-3': 'c1d2f378-6697-4973-b8cb-bbfbb4dc0b46'
};

const HORARIO_MAP = {
    '15:30': '43688db4-dfeb-4991-84cb-2d5719f51423',
    '17:00': '832bf94e-fe52-449b-b5bd-271aa50e1b29',
    '18:30': '12536d53-38a6-4c87-b00a-49de789a9d25',
    '16:00': 'dc2ab864-4b81-4234-a00a-f5e5ac21187f',
    '17:17': '202251a7-88dd-4f64-b469-3750a49c271d'
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

function parseExcelDate(excelDate) {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    if (typeof excelDate === 'string') {
        const trimmed = excelDate.trim();
        if (trimmed.includes('-') && (trimmed.startsWith('19') || trimmed.startsWith('20'))) {
            return trimmed;
        }
        if (trimmed.includes('/')) {
            const parts = trimmed.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return trimmed;
    }
    return null;
}

function cleanPhone(phone) {
    if (!phone || phone === '0' || phone === 0) return null;
    const clean = phone.toString().replace(/\D/g, '');
    return clean.length === 8 ? `591${clean}` : (clean.length > 8 ? clean : null);
}

function normalizeHeader(header) {
    return header?.toString().toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '') || '';
}

async function importarAlumnos() {
    console.log('🚀 Iniciando importación personalizada de alumnos...');

    if (!fs.existsSync(EXCEL_FILE)) {
        console.error(`❌ No se encontró el archivo: ${EXCEL_FILE}`);
        return;
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
        console.warn('⚠️  El archivo Excel parece estar vacío.');
        return;
    }

    console.log(`📊 Encontradas ${rawData.length} filas para procesar.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const keys = Object.keys(row);
        const getValue = (targetNames) => {
            const key = keys.find(k => targetNames.includes(normalizeHeader(k)));
            return key ? row[key] : null;
        };

        const nombres = getValue(['nombres', 'nombre', 'name']);
        const apellidos = getValue(['apellidos', 'apellido', 'lastname']);
        const rawFecha = getValue(['nacimiento', 'fecha nacimiento', 'fecha nac', 'fecha']);
        const carnet = getValue(['carnet', 'ci', 'cedula', 'dni']);

        // Padres (flexible)
        let telPadre = cleanPhone(getValue(['papa', 'telefono padre', 'celular padre', 'tel padre', 'cel padre']));
        let nombrePadre = getValue(['nombre padre', 'padre', 'tutor', 'apoderado']);

        let telMadre = cleanPhone(getValue(['mama', 'telefono madre', 'celular madre', 'tel madre', 'cel madre', 'telefono mama']));
        let nombreMadre = getValue(['nombre madre', 'madre', 'mama']);

        // Lógica de nombres genéricos
        if (telPadre && !nombrePadre) nombrePadre = `Papa de ${nombres}`;
        if (telMadre && !nombreMadre) nombreMadre = `Mama de ${nombres}`;

        // Profesores, Canchas y Horarios
        const rawProfesor = getValue(['profesor', 'entrenador', 'profesor id']);
        const rawCancha = getValue(['cancha', 'cancha id']);
        const rawHorario = getValue(['horario', 'horario id']);

        // Mapeo de IDs
        const profesorId = COACH_MAP[normalizeHeader(rawProfesor)] || rawProfesor;
        const canchaId = CANCHA_MAP[normalizeHeader(rawCancha)] || null;

        // El horario puede venir como número de serie de Excel (0.7083...)
        let horarioString = rawHorario;
        if (typeof rawHorario === 'number') {
            const hours = Math.floor(rawHorario * 24);
            const minutes = Math.round((rawHorario * 24 - hours) * 60);
            horarioString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        const horarioId = HORARIO_MAP[horarioString] || null;

        const fechaNac = parseExcelDate(rawFecha);

        if (!nombres || !apellidos || !fechaNac) {
            console.warn(`⚠️  Fila ${i + 2}: Saltada por datos incompletos.`);
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
            escuela_id: ESCUELA_ID_POR_DEFECTO,
            cancha_id: canchaId,
            horario_id: horarioId,
            profesor_asignado_id: (typeof profesorId === 'string' && profesorId.length > 30) ? profesorId : null,
            estado: 'Pendiente',
            archivado: false
        };

        try {
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

                // Relación alumnos_entrenadores
                const validProfesorId = (typeof profesorId === 'string' && profesorId.length > 30) ? profesorId : null;
                if (validProfesorId && insertedAlumno) {
                    await supabase
                        .from('alumnos_entrenadores')
                        .insert([{
                            alumno_id: insertedAlumno.id,
                            entrenador_id: validProfesorId
                        }]);
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
}

importarAlumnos();
