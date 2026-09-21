import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const runtimeDirectory = process.argv[2];
if (!runtimeDirectory) {
    throw new Error('Indique la carpeta que contiene @electric-sql/pglite.');
}

const runtime = createRequire(path.resolve(runtimeDirectory, 'package.json'));
const { PGlite } = runtime('@electric-sql/pglite');
const db = new PGlite();

const migrationPath = path.resolve(
    'supabase/migrations/20260921151229_prevenir_duplicados_nombre_completo.sql'
);
const migration = await fs.readFile(migrationPath, 'utf8');
const correction = await fs.readFile(
    path.resolve('supabase/migrations/20260921151648_permitir_normalizacion_identidad_sin_bloqueo.sql'),
    'utf8'
);
const archivedCorrection = await fs.readFile(
    path.resolve('supabase/migrations/20260921152114_bloquear_cambio_identidad_archivados.sql'),
    'utf8'
);

const schoolA = '10000000-0000-0000-0000-000000000001';
const schoolB = '10000000-0000-0000-0000-000000000002';
const actorId = '20000000-0000-0000-0000-000000000001';

let checks = 0;
const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    checks += 1;
};

const expectDatabaseError = async (sql, expectedText) => {
    try {
        await db.exec(sql);
        throw new Error(`Se esperaba un rechazo que contuviera: ${expectedText}`);
    } catch (error) {
        assert(
            error.message.toLowerCase().includes(expectedText.toLowerCase()),
            `Error inesperado: ${error.message}`
        );
    }
};

await db.exec(`
  CREATE SCHEMA auth;
  CREATE SCHEMA private;
  CREATE ROLE anon;
  CREATE ROLE authenticated;

  CREATE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  CREATE TABLE public.usuarios (
    id uuid PRIMARY KEY,
    escuela_id uuid NOT NULL,
    activo boolean NOT NULL DEFAULT true
  );

  CREATE TABLE public.alumnos (
    id uuid PRIMARY KEY,
    escuela_id uuid NOT NULL,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    fecha_nacimiento date,
    carnet_identidad text,
    archivado boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    nombre_padre text
  );

  INSERT INTO public.usuarios (id, escuela_id) VALUES ('${actorId}', '${schoolA}');

  -- Duplicados históricos: la migración debe conservarlos.
  INSERT INTO public.alumnos (id, escuela_id, nombres, apellidos, archivado)
  VALUES
    ('30000000-0000-0000-0000-000000000001', '${schoolA}', 'HISTORICO', 'DUPLICADO', false),
    ('30000000-0000-0000-0000-000000000002', '${schoolA}', 'HISTORICO', 'DUPLICADO', false),
    ('30000000-0000-0000-0000-000000000003', '${schoolA}', 'HISTORICO', 'DUPLICADO', true);
`);

await db.exec(migration);
await db.exec(correction);
await db.exec(archivedCorrection);

const historical = await db.query(`
  SELECT count(*)::integer AS total
  FROM public.alumnos
  WHERE escuela_id = '${schoolA}'
    AND nombres = 'HISTORICO'
    AND apellidos = 'DUPLICADO'
`);
assert(historical.rows[0].total === 3, 'La migración alteró duplicados históricos.');

await db.exec(`
  UPDATE public.alumnos
  SET nombres = '  histórico ',
      apellidos = 'duplicado',
      nombre_padre = 'Contacto actualizado'
  WHERE id = '30000000-0000-0000-0000-000000000001'
`);
checks += 1;

await db.exec(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, fecha_nacimiento)
  VALUES
    ('40000000-0000-0000-0000-000000000001', '${schoolA}', 'CAMILA ROMANE', 'FERRUFINO MORALES', '2011-04-21')
`);

await expectDatabaseError(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, fecha_nacimiento)
  VALUES
    ('40000000-0000-0000-0000-000000000002', '${schoolA}', '  cámila   romane ', ' ferrufino   morales ', '2011-04-22')
`, 'Este alumno ya está registrado');

await db.exec(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, carnet_identidad)
  VALUES
    ('40000000-0000-0000-0000-000000000003', '${schoolA}', 'ALUMNO', 'CON CARNET', '12 34-AB')
`);

await expectDatabaseError(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, carnet_identidad)
  VALUES
    ('40000000-0000-0000-0000-000000000004', '${schoolA}', 'OTRA', 'PERSONA', '1234ab')
`, 'Este alumno ya está registrado');

await db.exec(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, fecha_nacimiento)
  VALUES
    ('40000000-0000-0000-0000-000000000005', '${schoolB}', 'CAMILA ROMANE', 'FERRUFINO MORALES', '2011-04-22'),
    ('40000000-0000-0000-0000-000000000006', '${schoolA}', 'MAITE LUANA', 'TORREZ ORTIZ', '2015-05-26')
`);
checks += 2;

await db.exec(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos, archivado)
  VALUES
    ('40000000-0000-0000-0000-000000000007', '${schoolA}', 'REGISTRO', 'ARCHIVADO', true)
`);

await expectDatabaseError(`
  INSERT INTO public.alumnos
    (id, escuela_id, nombres, apellidos)
  VALUES
    ('40000000-0000-0000-0000-000000000008', '${schoolA}', 'REGISTRO', 'ARCHIVADO')
`, 'registro archivado');

await expectDatabaseError(`
  UPDATE public.alumnos
  SET archivado = false
  WHERE id = '30000000-0000-0000-0000-000000000003'
`, 'Este alumno ya está registrado');

await expectDatabaseError(`
  UPDATE public.alumnos
  SET nombres = 'CAMILA ROMANE', apellidos = 'FERRUFINO MORALES'
  WHERE id = '40000000-0000-0000-0000-000000000006'
`, 'Este alumno ya está registrado');

await expectDatabaseError(`
  UPDATE public.alumnos
  SET nombres = 'CAMILA ROMANE', apellidos = 'FERRUFINO MORALES'
  WHERE id = '40000000-0000-0000-0000-000000000007'
`, 'Este alumno ya está registrado');

await db.exec(`SELECT set_config('request.jwt.claim.sub', '${actorId}', false)`);

const rpcDuplicate = await db.query(`
  SELECT public.rpc_verificar_alumno_duplicado(
    'camila romane',
    'ferrufino morales',
    NULL,
    NULL
  ) AS resultado
`);
assert(rpcDuplicate.rows[0].resultado.duplicado === true, 'La RPC no detectó el nombre duplicado.');
assert(rpcDuplicate.rows[0].resultado.motivo === 'nombre', 'La RPC devolvió un motivo incorrecto.');

const rpcArchived = await db.query(`
  SELECT public.rpc_verificar_alumno_duplicado(
    'registro',
    'archivado',
    NULL,
    NULL
  ) AS resultado
`);
assert(rpcArchived.rows[0].resultado.archivado === true, 'La RPC no informó el registro archivado.');

const rpcOwnRecord = await db.query(`
  SELECT public.rpc_verificar_alumno_duplicado(
    'ALUMNO',
    'CON CARNET',
    '12 34-AB',
    '40000000-0000-0000-0000-000000000003'
  ) AS resultado
`);
assert(rpcOwnRecord.rows[0].resultado.duplicado === false, 'La edición no excluyó al propio alumno.');

const triggerDefinition = await db.query(`
  SELECT pg_get_functiondef('private.validar_alumno_unico_misma_escuela()'::regprocedure) AS definition
`);
assert(
    triggerDefinition.rows[0].definition.includes('pg_advisory_xact_lock'),
    'El trigger no serializa las validaciones concurrentes.'
);

console.log(`OK: ${checks} verificaciones de duplicados superadas.`);
await db.close();
