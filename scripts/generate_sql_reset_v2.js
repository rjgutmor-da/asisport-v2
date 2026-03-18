
import fs from 'fs';

const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
const SUCURSAL_ID = '99f11454-8d15-4888-8a18-0e7fa0436892';
const CANCHA_ID = 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76';
const HORARIO_ID = '10768921-cab5-4cd5-88f0-6e968d084969';
const ENTRENADOR_ID = '5bc0896a-9a9d-4135-b835-f552fa92abfa';

const backup = JSON.parse(fs.readFileSync('c:/Users/Public/Documents/AsiSportv2/scripts/alumnos_backup.json', 'utf8'));

let sql = `
-- ==========================================
-- SCRIPT DE RESET AUTOMÁTICO V2 (FIX TRIGGERS)
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
    -- Desactivar triggers temporalmente para evitar el error de "Último Entrenador"
    SET LOCAL session_replication_role = 'replica';

    -- 1. Limpiar datos actuales del demo
    DELETE FROM asistencias_normales WHERE entrenador_id = '${ENTRENADOR_ID}';
    DELETE FROM alumnos_entrenadores WHERE entrenador_id = '${ENTRENADOR_ID}';
    DELETE FROM alumnos WHERE escuela_id = '${ESCUELA_ID}';

    -- Restaurar triggers
    SET LOCAL session_replication_role = 'origin';

    -- 2. Insertar Alumnos del Backup
`;

backup.forEach(a => {
    sql += `
    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('${a.nombres}', '${a.apellidos}', '${a.fecha_nacimiento}', '${ESCUELA_ID}', '${SUCURSAL_ID}', '${CANCHA_ID}', '${HORARIO_ID}', ${a.foto_url ? `'${a.foto_url}'` : 'NULL'}, 'Representante', '59174631123', 'padre', 'Aprobado', '${ENTRENADOR_ID}', false, '${ENTRENADOR_ID}')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '${ENTRENADOR_ID}');
`;
});

// Calcular el día anterior al reset (para no pre-llenar hoy)
// El cron corre a las 4am, así que 'hoy' cuando corre el cron es el día del reset.
// El historial debe ir desde el 1 hasta (CURRENT_DATE - 1) para dejar libre el día actual.
sql += `
    -- 3. Generar Historial del mes actual (hasta ayer, para dejar hoy libre)
    FOR dia IN 1..(EXTRACT(DAY FROM CURRENT_DATE)::int - 1) LOOP
        fecha_str := DATE_TRUNC('month', CURRENT_DATE) + (dia - 1) * INTERVAL '1 day';
        
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

-- Programar o actualizar el cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('reset-demo-diario', '0 4 * * *', 'SELECT reset_demo_school()');

-- Probar ahora
SELECT reset_demo_school();
`;

fs.writeFileSync('c:/Users/Public/Documents/AsiSportv2/scripts/SUPABASE_RESET_CONFIG.sql', sql);
console.log('✅ SQL Script V2 generado con éxito.');
