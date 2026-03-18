
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
    DELETE FROM asistencias_normales WHERE entrenador_id = '5bc0896a-9a9d-4135-b835-f552fa92abfa';
    DELETE FROM alumnos_entrenadores WHERE entrenador_id = '5bc0896a-9a9d-4135-b835-f552fa92abfa';
    DELETE FROM alumnos WHERE escuela_id = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';

    -- Restaurar triggers
    SET LOCAL session_replication_role = 'origin';

    -- 2. Insertar Alumnos del Backup

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Lionel', 'Messi', '1987-06-24', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762932159_messi.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Julian', 'Alvarez', '2000-01-31', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762933117_julian_alvarez.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Marcelo', 'Martins', '1987-06-18', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762934397_martins.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Roberto', 'Fernandez', '1999-07-12', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Neymar', 'Jr', '1992-02-05', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762934987_neymar.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Vinicius', 'Jr', '2000-07-12', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762935581_vinicius.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Rodrygo', 'Goes', '2001-01-09', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Arturo', 'Vidal', '1987-05-22', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762936217_arturo_vidal.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Ben', 'Brereton', '1999-04-18', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Luis', 'Diaz', '1997-01-13', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762936735_luis_diaz.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Radamel', 'Falcao', '1986-02-10', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762937292_radamel_falcao.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Moises', 'Caicedo', '2001-11-02', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762937803_caicedo.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Piero', 'Hincapie', '2002-01-09', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Miguel', 'Almiron', '1994-02-10', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762938265_almiron.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Gustavo', 'Gomez', '1993-05-06', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Julio', 'Enciso', '2004-01-23', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Paolo', 'Guerrero', '1984-01-01', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762938718_guerrero.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Gianluca', 'Lapadula', '1990-02-07', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Luis', 'Advincula', '1990-03-02', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Luis', 'Suarez', '1987-01-24', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762939882_suarez.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Darwin', 'Nuñez', '1999-06-24', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762940454_darwin_nunez.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Salomon', 'Rondon', '1989-09-16', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762940946_rondon.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Tomas', 'Rincon', '1988-01-13', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', NULL, 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Angel', 'Di Maria', '1988-02-14', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762941490_dimaria.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Alexis', 'Sanchez', '1988-12-19', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762942029_alexis.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Federico', 'Valverde', '1998-07-22', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762943137_valverde.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Carlos', 'Lampe', '1987-03-17', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762943716_lampe.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('James', 'Rodriguez', '1991-07-12', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762944251_james.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Enner', 'Valencia', '1989-11-04', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762944751_valencia.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, foto_url, nombre_padre, telefono_padre, whatsapp_preferido, estado, created_by, archivado, profesor_asignado_id)
    VALUES ('Yeferson', 'Soteldo', '1997-06-30', '07d945a7-99ba-4e7d-ba9c-258e7ee27659', '99f11454-8d15-4888-8a18-0e7fa0436892', 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76', '10768921-cab5-4cd5-88f0-6e968d084969', 'https://uqrmmotcbnyazmadzfvd.supabase.co/storage/v1/object/public/avatars/fotos_alumnos/demo_1773762945298_soteldo.png', 'Representante', '59174631123', 'padre', 'Aprobado', '5bc0896a-9a9d-4135-b835-f552fa92abfa', false, '5bc0896a-9a9d-4135-b835-f552fa92abfa')
    RETURNING id INTO temp_alumno_id;

    INSERT INTO alumnos_entrenadores (alumno_id, entrenador_id) VALUES (temp_alumno_id, '5bc0896a-9a9d-4135-b835-f552fa92abfa');

    -- 3. Generar Historial del mes actual (hasta ayer, para dejar hoy libre)
    FOR dia IN 1..(EXTRACT(DAY FROM CURRENT_DATE)::int - 1) LOOP
        fecha_str := DATE_TRUNC('month', CURRENT_DATE) + (dia - 1) * INTERVAL '1 day';
        
        FOR alumno_record IN (SELECT id, nombres FROM alumnos WHERE escuela_id = '07d945a7-99ba-4e7d-ba9c-258e7ee27659') LOOP
            rand_val := random();
            
            IF alumno_record.nombres = 'Lionel' THEN
                estado_val := CASE WHEN rand_val > 0.05 THEN 'Presente' ELSE 'Licencia' END;
            ELSIF alumno_record.nombres = 'Neymar' THEN
                estado_val := CASE WHEN rand_val < 0.6 THEN 'Ausente' WHEN rand_val < 0.8 THEN 'Licencia' ELSE 'Presente' END;
            ELSE
                estado_val := CASE WHEN rand_val < 0.75 THEN 'Presente' WHEN rand_val < 0.9 THEN 'Licencia' ELSE 'Ausente' END;
            END IF;

            INSERT INTO asistencias_normales (alumno_id, fecha, estado, entrenador_id)
            VALUES (alumno_record.id, fecha_str, estado_val, '5bc0896a-9a9d-4135-b835-f552fa92abfa');
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Programar o actualizar el cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('reset-demo-diario', '0 4 * * *', 'SELECT reset_demo_school()');

-- Probar ahora
SELECT reset_demo_school();
