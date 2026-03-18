
import fs from 'fs';

const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
const SUCURSAL_ID = '99f11454-8d15-4888-8a18-0e7fa0436892';
const CANCHA_ID = 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76';
const HORARIO_ID = '10768921-cab5-4cd5-88f0-6e968d084969';
const ENTRENADOR_ID = '5bc0896a-9a9d-4135-b835-f552fa92abfa';

const backup = JSON.parse(fs.readFileSync('c:/Users/Public/Documents/AsiSportv2/scripts/alumnos_backup.json', 'utf8'));

let sql = `
-- ==========================================
-- SCRIPT DE RESET AUTOMÁTICO ASI-SPORT DEMO
-- ==========================================

CREATE OR REPLACE FUNCTION reset_demo_school()
RETURNS void AS $$
DECLARE
    temp_alumno_id uuid;
    alumno_record record;
    dia int;
    fecha_str date;
    rand_val float;
    estado_val text;
BEGIN
    -- 1. Limpiar datos actuales del demo
    DELETE FROM asistencias_normales WHERE entrenador_id = '${ENTRENADOR_ID}';
    DELETE FROM alumnos_entrenadores WHERE entrenador_id = '${ENTRENADOR_ID}';
    DELETE FROM alumnos WHERE escuela_id = '${ESCUELA_ID}';

    -- 2. Asegurar que las bases existen (opcional pero seguro)
    -- Ya existen, así que procedemos a insertar alumnos.

`;

// Insertar Alumnos
backup.forEach(a => {
    sql += `
    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado)
    VALUES ('${a.nombres}', '${a.apellidos}', '${a.fecha_nacimiento}', '${ESCUELA_ID}', '${SUCURSAL_ID}', '${CANCHA_ID}', '${HORARIO_ID}', ${a.foto_url ? `'${a.foto_url}'` : 'NULL'}, 'Representante', '59174631123', 'padre', 'Aprobado', '${ENTRENADOR_ID}', false)
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '${ENTRENADOR_ID}');
`;
});

sql += `
    -- 3. Generar Historial de Marzo (del 1 al 17)
    FOR dia IN 1..17 LOOP
        fecha_str := TO_DATE('2026-03-' || LPAD(dia::text, 2, '0'), 'YYYY-MM-DD');
        
        FOR alumno_record IN (SELECT id, nombres FROM alumnos WHERE escuela_id = '${ESCUELA_ID}') LOOP
            rand_val := random();
            
            IF alumno_record.nombres = 'Lionel' THEN
                estado_val := CASE WHEN rand_val > 0.05 THEN 'Presente' ELSE 'Licencia' END;
            ELSIF alumno_record.nombres = 'Neymar' THEN
                estado_val := CASE WHEN rand_val < 0.6 THEN 'Ausente' WHEN rand_val < 0.8 THEN 'Licencia' ELSE 'Presente' END;
            ELSE
                estado_val := CASE WHEN rand_val < 0.75 THEN 'Presente' WHEN rand_val < 0.9 THEN 'Licencia' ELSE 'Ausente' END;
            END IF;

            INSERT INTO asistencias_normales (alumno_id, fecha, estado, entrenador_id)
            VALUES (alumno_record.id, fecha_str, estado_val, '${ENTRENADOR_ID}');
        END LOOP;
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Habilitar extensión pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar el reset diario a las 4 AM UTC
SELECT cron.schedule('reset-demo-diario', '0 4 * * *', 'SELECT reset_demo_school()');

-- Ejecutar una vez ahora para probar
SELECT reset_demo_school();
`;

fs.writeFileSync('c:/Users/Public/Documents/AsiSportv2/scripts/SUPABASE_RESET_CONFIG.sql', sql);
console.log('✅ SQL Script generado con éxito.');
