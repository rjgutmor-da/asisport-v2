const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

// Clientes
const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const supabaseA = createClient(supabaseUrl, anonKey);

async function testMultiTenancy() {
    console.log('🛡️ Iniciando Auditoría de Seguridad B2B - Test RLS Multi-Tenancy 🛡️\n');
    const logs = [];

    try {
        // [Fase 1] Preparación (Setup con privilegios Admin)
        console.log('[Setup] Preparando entorno de prueba usando Service Role...');

        // 1.1 Identificamos 2 usuarios pertenecientes a escuelas DIFERENTES
        const { data: users, error: uErr } = await supabaseAdmin
            .from('usuarios')
            .select('*')
            .eq('activo', true)
            .limit(10);

        if (uErr) throw uErr;

        // Identificar escuelas únicas buscando en los usuarios
        const escuelasSet = new Set(users.filter(u => u.escuela_id).map(u => u.escuela_id));
        let escuelasArr = Array.from(escuelasSet);

        // Auto-inyectar data si no hay 2 escuelas para testear (Simular B2B)
        if (escuelasArr.length < 2) {
            console.log('⚠️ Detectada solo 1 escuela. Generando [Escuela B Ficticia] para test de RLS...');

            // 1. Crear Escuela B
            const { data: escB, error: errEsc } = await supabaseAdmin
                .from('escuelas')
                .insert({ nombre: 'Academia Rival FC B2B Test' })
                .select()
                .single();
            if (errEsc) throw errEsc;

            // 2. Crear Alumno en Escuela B
            const { data: alB, error: errAlB } = await supabaseAdmin
                .from('alumnos')
                .insert({
                    escuela_id: escB.id,
                    nombres: 'Hacker',
                    apellidos: 'B2B',
                    fecha_nacimiento: '2010-01-01',
                    nombre_padre: 'Test Padre B2B',
                    telefono_padre: '12345678',
                    estado: 'Aprobado',
                    archivado: false
                })
                .select()
                .single();
            if (errAlB) throw errAlB;

            // 3. Crear Asistencia en Escuela B
            await supabaseAdmin.from('asistencias_normales').insert({
                alumno_id: alB.id,
                fecha: new Date().toISOString().split('T')[0],
                estado: 'Presente'
            });

            // Auto-inyectar falso usuario B sin Auth (solo db mock) para que no crashee
            users.push({
                email: 'hacker@b2brival.test',
                escuela_id: escB.id
            });

            // 4. Leer de nuevo las escuelas con datos artificiales agregados
            escuelasArr.push(escB.id);
        }

        const escuelaA = escuelasArr[0];
        const escuelaB = escuelasArr[1];

        const userA = users.find(u => u.escuela_id === escuelaA);
        const userB = users.find(u => u.escuela_id === escuelaB);

        console.log(`✅ Escuelas detectadas: \nA: ${escuelaA} \nB: ${escuelaB}`);
        console.log(`✅ Usuarios a usar: \n[User A] -> ${userA.email} (Escuela A)\n[User B] -> ${userB.email} (Escuela B)\n`);

        // 1.2 Extraer IDs de la Escuela B como "Tarjetas de Ataque"
        const { data: alumnosB } = await supabaseAdmin
            .from('alumnos')
            .select('id, nombres')
            .eq('escuela_id', escuelaB)
            .limit(1);
        const objetivoAlumnoB = alumnosB?.[0]?.id;

        const { data: asistenciasB } = await supabaseAdmin
            .from('asistencias_normales')
            .select('id, alumno_id')
            .in('alumno_id', [objetivoAlumnoB])
            .limit(1);
        const objetivoAsistenciaB = asistenciasB?.[0]?.id;

        console.log(`🎯 Target IDOR Alumno de Escuela B: ${objetivoAlumnoB || 'N/A'}`);
        console.log(`🎯 Target IDOR Asistencia de Escuela B: ${objetivoAsistenciaB || 'N/A'}\n`);


        // [Fase 2] Simulación Cliente Escuela A
        console.log('----------------------------------------------------');
        console.log('Iniciando Test como Cliente A (Atacante Multi-Tenancy)');
        console.log('----------------------------------------------------\n');

        // Simular Logeo de User A
        const TEMP_PASS = 'P@ssword123B2B!';
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userA.id, { password: TEMP_PASS });
        if (updErr) throw new Error(`Fallo actualizando pwd de A: ${updErr.message}`);

        const { error: signInErr } = await supabaseA.auth.signInWithPassword({
            email: userA.email,
            password: TEMP_PASS
        });
        if (signInErr) throw new Error(`Fallo Auth de A: ${signInErr.message}`);
        console.log(`✅ Sesión iniciada como [User A]...\n`);

        // TEST 1: Fuga de lista maestra
        console.log('[Test 1] Listar todos los alumnos (¿Trae alumnos de B?)');
        const { data: alumnosLeaked, error: t1Err } = await supabaseA
            .from('alumnos')
            .select('id, nombres, escuela_id')
            .eq('escuela_id', escuelaB);

        if (t1Err) throw t1Err;
        if (alumnosLeaked && alumnosLeaked.length > 0) {
            logs.push('❌ TEST 1 FALLÓ (ALTA SEVERIDAD): User A puede listar alumnos de Escuela B.');
        } else {
            logs.push('✅ TEST 1 PASÓ: User A NO puede listar alumnos de Escuela B.');
        }


        // TEST 2: Fuga cruzada de Asistencias (El endpoint que vimos)
        console.log('[Test 2] Rango generico en Asistencias (¿Cursa Escuela B?)');
        const { data: asistenciasLeaked, error: t2Err } = await supabaseA
            .from('asistencias_normales')
            .select('*, alumnos!inner(escuela_id)')
            .eq('alumnos.escuela_id', escuelaB);

        if (t2Err) throw t2Err;
        if (asistenciasLeaked && asistenciasLeaked.length > 0) {
            logs.push('❌ TEST 2 FALLÓ (CRÍTICO): User A puede hacer GET de Asistencias donde Alumno pertenece a Escuela B.');
        } else {
            logs.push('✅ TEST 2 PASÓ: User A NO puede consultar las asistencias del inquilino B.');
        }


        // TEST 3: El Ataque IDOR (Insecure Direct Object Reference)
        console.log('[Test 3] IDOR: Petición directa a ID de Alumno B');
        if (objetivoAlumnoB) {
            const { data: idor1, error: t3Err } = await supabaseA
                .from('alumnos')
                .select('*')
                .eq('id', objetivoAlumnoB)
                .single();

            // Supabase devuelve error JWT o "PGRST116 (No rows found)" si el RLS bloquea.
            if (idor1) {
                logs.push('❌ TEST 3 FALLÓ (CRÍTICO IDOR): User A logró acceso directo al registro Alumno B pidiendo su UUID.');
            } else {
                logs.push(`✅ TEST 3 PASÓ: Petición directa bloqueada por Supabase (RLS reacciona con ${t3Err?.code || 'RowNotFound'}).`);
            }
        } else {
            logs.push('⚠️ TEST 3 Omitido: No hay alumnos en Escuela B para probar IDOR.');
        }

        // LIMPIEZA
        console.log('\n[Cleanup] Limpiando datos de prueba...');
        if (objetivoAlumnoB && escuelasArr.length > 1) {
            await supabaseAdmin.from('asistencias_normales').delete().eq('alumno_id', objetivoAlumnoB);
            await supabaseAdmin.from('alumnos').delete().eq('id', objetivoAlumnoB);
            await supabaseAdmin.from('escuelas').delete().eq('id', escuelaB);
        }

        console.log('\n====================================');
        console.log('📋 REPORTE DE AISLAMIENTO (RLS)');
        console.log('====================================');
        logs.forEach(msg => console.log(msg));
        console.log('====================================\n');

    } catch (err) {
        console.error('💥 Error inesperado en el test:', err.message);
    }
}

testMultiTenancy();
