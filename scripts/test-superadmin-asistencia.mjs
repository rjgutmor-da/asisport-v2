// Run: node scripts/test-superadmin-asistencia.mjs <directory containing @electric-sql/pglite>
// Uses synthetic data in an in-memory PostgreSQL. Never connects to production.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = createRequire(resolve(process.argv[2] || root, 'package.json'));
const { PGlite } = runtime('@electric-sql/pglite');
const { transform } = createRequire(resolve(root, 'package.json'))('esbuild');
const db = new PGlite();
const migrationName = '20260911180550_superadmin_asistencia_toda_escuela';
const migration = readFileSync(resolve(root, 'supabase/migrations', migrationName + '.sql'), 'utf8');
const rollback = readFileSync(resolve(root, 'supabase/rollbacks', migrationName + '_rollback.sql'), 'utf8');
const id = n => '00000000-0000-0000-0000-' + String(n).padStart(12, '0');
const q = n => "'" + id(n) + "'";
await db.exec(`
  CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  CREATE TABLE usuarios(id uuid PRIMARY KEY, escuela_id uuid, rol varchar, sucursal_id uuid,
    activo boolean DEFAULT true, nombres text DEFAULT 'Usuario', apellidos text DEFAULT 'Prueba');
  CREATE TABLE grupos(id uuid PRIMARY KEY,nombre text);
  CREATE TABLE horarios(id uuid PRIMARY KEY,hora text);
  CREATE TABLE alumnos(id uuid PRIMARY KEY,escuela_id uuid,nombres text,apellidos text,
    foto_url text,es_arquero boolean DEFAULT false,estado text DEFAULT 'Pendiente',
    cancha_id uuid,horario_id uuid,fecha_nacimiento date,archivado boolean DEFAULT false,
    profesor_asignado_id uuid,sucursal_id uuid,grupo_gestion_id uuid);
  CREATE TABLE alumnos_entrenadores(alumno_id uuid,entrenador_id uuid);
  CREATE TABLE asistencias_normales(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id uuid REFERENCES alumnos(id),fecha date,estado text,
    entrenador_id uuid REFERENCES usuarios(id),grupo_gestion_id uuid,
    UNIQUE(alumno_id,fecha),CHECK(estado IN ('Presente','Ausente','Licencia')));
  INSERT INTO usuarios(id,escuela_id,rol,sucursal_id) VALUES
    (${q(1)},${q(100)},'SuperAdministrador',null),
    (${q(2)},${q(100)},'Entrenador',${q(10)}),
    (${q(3)},${q(100)},'Administrador',${q(10)}),
    (${q(4)},${q(100)},'Asistente',${q(10)}),
    (${q(5)},${q(100)},'Entrenarqueros',${q(10)}),
    (${q(6)},${q(200)},'SuperAdministrador',null),
    (${q(7)},${q(300)},'SuperAdministrador',null);
  INSERT INTO grupos VALUES (${q(20)},'Grupo A'),(${q(21)},'Grupo B');
  INSERT INTO horarios VALUES (${q(30)},'16:00'),(${q(31)},'18:00');
  INSERT INTO alumnos(id,escuela_id,nombres,apellidos,cancha_id,horario_id,profesor_asignado_id,sucursal_id,es_arquero,grupo_gestion_id)
  VALUES
    (${q(101)},${q(100)},'Propio','A',${q(20)},${q(30)},${q(1)},${q(10)},false,${q(50)}),
    (${q(102)},${q(100)},'Otro entrenador','B',${q(20)},${q(30)},${q(2)},${q(10)},true,${q(50)}),
    (${q(103)},${q(100)},'Sin entrenador','C',${q(21)},${q(31)},null,${q(11)},false,${q(51)}),
    (${q(104)},${q(100)},'Asignacion adicional','D',${q(21)},${q(31)},null,${q(11)},true,${q(51)}),
    (${q(105)},${q(100)},'Administrador','E',${q(20)},${q(30)},${q(3)},${q(10)},false,${q(50)}),
    (${q(106)},${q(100)},'Asistente','F',${q(20)},${q(30)},${q(4)},${q(10)},false,${q(50)}),
    (${q(201)},${q(200)},'Otra escuela','G',${q(20)},${q(30)},${q(6)},null,false,${q(50)});
  INSERT INTO alumnos_entrenadores VALUES (${q(104)},${q(2)});
  INSERT INTO alumnos(id,escuela_id,nombres,apellidos,archivado,estado)
    VALUES (${q(107)},${q(100)},'Archivado','H',true,'Pendiente'),
           (${q(108)},${q(100)},'Eliminado','I',false,'ELIMINADO SISTEMA');
  INSERT INTO asistencias_normales(alumno_id,fecha,estado,entrenador_id) VALUES
    (${q(102)},CURRENT_DATE,'Presente',${q(2)}),
    (${q(104)},CURRENT_DATE,'Licencia',${q(1)}),
    (${q(107)},CURRENT_DATE,'Presente',${q(2)}),
    (${q(201)},CURRENT_DATE,'Presente',${q(6)});
  -- Minimal RLS fixture: prove invocation runs under authenticated, with tenant isolation.
  -- Role-specific candidate restrictions are exercised in the real RPC, compared to rollback.
  CREATE FUNCTION public.fixture_school() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = public AS $$ SELECT escuela_id FROM usuarios WHERE id=auth.uid() $$;
  ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
  CREATE POLICY fixture_alumnos ON alumnos TO authenticated
    USING (escuela_id=public.fixture_school()) WITH CHECK (escuela_id=public.fixture_school());
  ALTER TABLE asistencias_normales ENABLE ROW LEVEL SECURITY;
  CREATE POLICY fixture_asistencias ON asistencias_normales TO authenticated
    USING (EXISTS(SELECT 1 FROM alumnos a WHERE a.id=alumno_id))
    WITH CHECK (EXISTS(SELECT 1 FROM alumnos a WHERE a.id=alumno_id));
  CREATE FUNCTION fixture_contexto() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP='UPDATE' THEN
        IF NEW.entrenador_id IS DISTINCT FROM OLD.entrenador_id
           OR NEW.grupo_gestion_id IS DISTINCT FROM OLD.grupo_gestion_id THEN
          RAISE EXCEPTION 'Autor y grupo inmutables';
        END IF;
      ELSE
        SELECT grupo_gestion_id INTO NEW.grupo_gestion_id FROM alumnos WHERE id=NEW.alumno_id;
      END IF;
      IF NEW.fecha>CURRENT_DATE THEN RAISE EXCEPTION 'Fecha futura'; END IF;
      RETURN NEW;
    END $$;
  CREATE TRIGGER fixture_contexto BEFORE INSERT OR UPDATE ON asistencias_normales
    FOR EACH ROW EXECUTE FUNCTION fixture_contexto();
  GRANT USAGE ON SCHEMA public,auth TO authenticated;
  GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
`);
let actor = 1;
async function login(n) {
  actor=n;
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n ? id(n) : '']);
  await db.exec('SET ROLE authenticated');
}
async function rpc(coach=null,group=null,hour=null) {
  return (await db.query(
    'SELECT public.rpc_cargar_asistencia_asisport(CURRENT_DATE,$1,$2,$3) result',
    [group && id(group),hour && id(hour),coach && id(coach)])).rows[0].result;
}
const ids = result => result.candidatos.map(a=>a.id).sort();
await db.exec(rollback);
const cases=[];
for(const user of [2,3,4,5]) {
  await login(user);
  for(const coach of [null,2,6])
    for(const group of [null,20,21])
      cases.push({user,coach,group,before:await rpc(coach,group)});
}
await login(1);
const beforeSuper = await rpc();
assert.deepEqual(ids(beforeSuper),[id(101)]);
await db.exec('RESET ROLE');
await db.exec(migration);
for(const c of cases) {
  await login(c.user);
  assert.deepEqual(await rpc(c.coach,c.group),c.before,'Role regression: '+JSON.stringify(c));
}
await login(1);
assert.deepEqual(ids(await rpc()),[101,102,103,104,105,106].map(id));
assert.equal((await rpc()).estado_envio.cantidad,2,'Exclude archived/foreign attendance');
assert.deepEqual(ids(await rpc(2)),[102,104].map(id));
assert.equal((await rpc(2)).estado_envio.cantidad,2,'Include attendance recorded by another author');
assert.deepEqual(ids(await rpc(null,21,31)),[103,104].map(id));
assert.equal((await rpc(null,21,30)).candidatos.length,0);
assert.equal((await rpc(null,21,30)).estado_envio.existe,false);
assert.equal((await rpc(6)).candidatos.length,0,'Foreign trainer');
assert.equal((await rpc(null,999)).candidatos.length,0,'Unknown group');
assert(!((await rpc()).asistencias_existentes.some(a=>a.alumno_id===id(201))));
await login(6);
assert.deepEqual(ids(await rpc()),[id(201)]);
await login(7);
assert.deepEqual(ids(await rpc()),[]);
assert.deepEqual((await rpc()).estado_envio,{existe:false,cantidad:0});
await login(null);
await assert.rejects(()=>rpc(),/Sesión no autenticada/);
await db.exec('RESET ROLE');
await db.exec('UPDATE usuarios SET activo=false WHERE id='+q(7));
await login(7);
await assert.rejects(()=>rpc(),/Usuario inactivo/);
await db.exec('RESET ROLE');
const privileges=(await db.query(`SELECT
  has_function_privilege('anon','public.rpc_cargar_asistencia_asisport(date,uuid,uuid,uuid)','EXECUTE') anon,
  has_function_privilege('authenticated','public.rpc_cargar_asistencia_asisport(date,uuid,uuid,uuid)','EXECUTE') authenticated,
  prosecdef FROM pg_proc WHERE oid='public.rpc_cargar_asistencia_asisport(date,uuid,uuid,uuid)'::regprocedure`)).rows[0];
assert.deepEqual(privileges,{anon:false,authenticated:true,prosecdef:false});

// Execute the real save service against PostgreSQL through a small PostgREST adapter.
function from(table) {
  let operation='select', fields='*', values, single=false;
  const filters=[];
  const builder={
    select(f){fields=f;return builder;},eq(k,v){filters.push([k,[v]]);return builder;},
    in(k,v){filters.push([k,v]);return builder;},single(){single=true;return builder;},
    update(v){operation='update';values=v;return builder;},
    insert(v){operation='insert';values=v;return builder;},
    then(ok,bad){return (async()=>{
      try {
        const params=[]; const bind=v=>{params.push(v);return '$'+params.length;};
        let sql;
        if(operation==='insert') {
          const keys=Object.keys(values[0]);
          sql='INSERT INTO '+table+' ('+keys.join(',')+') VALUES '+
            values.map(row=>'('+keys.map(k=>bind(row[k])).join(',')+')').join(',');
        } else {
          sql=operation==='select'?'SELECT '+fields+' FROM '+table:
            'UPDATE '+table+' SET '+Object.entries(values).map(([k,v])=>k+'='+bind(v)).join(',');
          if(filters.length) sql+=' WHERE '+filters.map(([k,vs])=>k+' IN ('+vs.map(bind).join(',')+')').join(' AND ');
        }
        const rows=(await db.query(sql,params)).rows;
        return {data:single?rows[0]:rows,error:null};
      }catch(error){return {data:null,error};}
    })().then(ok,bad);}
  };
  return builder;
}
const roles=await transform(readFileSync(resolve(root,'src/config/roles.ts'),'utf8'),{loader:'ts',format:'esm'});
const roleModule=await import('data:text/javascript;base64,'+Buffer.from(roles.code).toString('base64'));
globalThis.__attendanceFixture={
  supabase:{from,auth:{getUser:async()=>({data:{user:{id:id(actor)}}})}},
  can:roleModule.can,getDataScope:roleModule.getDataScope
};
const source=readFileSync(resolve(root,'src/services/asistencias.js'),'utf8').replace(/^import .*;\r?\n/gm,'');
const {registrarAsistenciasPorLote}=await import('data:text/javascript;base64,'+
  Buffer.from('const {supabase,can,getDataScope}=globalThis.__attendanceFixture;\n'+source).toString('base64'));
await login(1);
const date=(await db.query('SELECT CURRENT_DATE::text date')).rows[0].date;
assert.equal((await registrarAsistenciasPorLote([{alumnoId:id(103),estado:'Presente'}],date)).exitosos,1);
let stored=(await db.query('SELECT * FROM asistencias_normales WHERE alumno_id=$1',[id(103)])).rows[0];
assert.equal(stored.entrenador_id,id(1));
assert.equal(stored.grupo_gestion_id,id(51));
assert.equal((await registrarAsistenciasPorLote([{alumnoId:id(102),estado:'Licencia'}],date)).exitosos,1);
stored=(await db.query('SELECT * FROM asistencias_normales WHERE alumno_id=$1',[id(102)])).rows[0];
assert.equal(stored.entrenador_id,id(2),'Correction preserves original author');
assert.equal(stored.estado,'Licencia');
assert.equal((await db.query('SELECT count(*)::int n FROM asistencias_normales WHERE alumno_id=$1',[id(102)])).rows[0].n,1);
await assert.rejects(()=>db.query(
  'INSERT INTO asistencias_normales(alumno_id,fecha,estado,entrenador_id) VALUES($1,CURRENT_DATE,$2,$3)',
  [id(102),'Presente',id(1)]),/unique/);
const originalError = console.error;
try {
  console.error = () => {}; // Expected rejection; avoid logging the data-URL module source.
  await assert.rejects(()=>registrarAsistenciasPorLote([{alumnoId:id(101),estado:'Presente'}],'2099-01-01'),/fechas futuras/);
} finally {
  console.error = originalError;
}
await db.exec('RESET ROLE');
await db.exec(rollback);
await login(1);
assert.deepEqual(ids(await rpc()),ids(beforeSuper),'Rollback restores previous candidate scope');
await db.exec('RESET ROLE');
await db.exec(migration);
await login(1);
assert.equal((await rpc()).candidatos.length,6,'Migration can be reapplied');
await db.close();
console.log('PASS: 36 comparisons across other roles; superadmin scope/filters/tenant isolation; authenticated/anon; save/correction/author/uniqueness; rollback/reapply.');
