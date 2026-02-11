
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const testUsers = [
    { email: 'superadmin@asisport.com', password: 'Super123!', nombres: 'Super', apellidos: 'Administrador', rol: 'SuperAdministrador' },
    { email: 'admin@asisport.com', password: 'Admin123!', nombres: 'Juan', apellidos: 'Pérez', rol: 'Administrador' },
    { email: 'entrenador@asisport.com', password: 'Entrena123!', nombres: 'Carlos', apellidos: 'González', rol: 'Entrenador' }
];

async function runReset() {
    console.log('🚀 Iniciando Reseteo Final y Poblado de Datos...');

    // 1. Limpiar Tablas (Orden de dependencias)
    const tables = [
        'asistencias_normales', 'asistencias_arqueros', 'convocatorias_alumnos',
        'convocatorias', 'alumnos_entrenadores', 'alumnos', 'usuarios', 'canchas', 'horarios'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.log(`   ⚠️ Error limpiando ${table}: ${error.message}`);
        else console.log(`   ✅ Tabla ${table} limpia`);
    }

    // 2. Limpiar Auth
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    for (const user of authUsers) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`   ✅ Usuario Auth eliminado: ${user.email}`);
    }

    // 3. Crear Datos Maestros
    const { data: cancha } = await supabase.from('canchas').insert({ nombre: 'Cancha Principal', escuela_id: escuelaId, activo: true }).select().single();
    const { data: horario } = await supabase.from('horarios').insert({ hora: '18:00', escuela_id: escuelaId, activo: true }).select().single();
    console.log('   ✅ Datos maestros creados');

    // 4. Crear Usuarios
    for (const u of testUsers) {
        const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { nombres: u.nombres, apellidos: u.apellidos }
        });

        if (authErr) {
            console.log(`   ❌ Error creando Auth ${u.email}: ${authErr.message}`);
            continue;
        }

        const { error: dbErr } = await supabase.from('usuarios').insert({
            id: auth.user.id,
            email: u.email,
            nombres: u.nombres,
            apellidos: u.apellidos,
            rol: u.rol,
            escuela_id: escuelaId,
            activo: true,
            telefono_whatsapp: '+56900000000'
        });

        if (dbErr) console.log(`   ❌ Error en tabla usuarios para ${u.email}: ${dbErr.message}`);
        else console.log(`   ✅ Usuario creado: ${u.email}`);
    }

    // 5. Crear Alumnos
    const alumnos = [
        { nombres: 'Diego', apellidos: 'Fernández', fecha_nacimiento: '2012-03-10', nombre_padre: 'Jorge Fernández', telefono_padre: '+56987654325', estado: 'Aprobado' },
        { nombres: 'Ana', apellidos: 'López', fecha_nacimiento: '2011-08-20', nombre_madre: 'Carmen Rojas', telefono_madre: '+56987654324', estado: 'Pendiente' },
        { nombres: 'Pedro', apellidos: 'Martínez', fecha_nacimiento: '2010-05-15', nombre_padre: 'Roberto Martínez', telefono_padre: '+56987654321', estado: 'Aprobado' }
    ];

    for (const a of alumnos) {
        const { error } = await supabase.from('alumnos').insert({
            ...a,
            escuela_id: escuelaId,
            cancha_id: cancha.id,
            horario_id: horario.id,
            es_arquero: false,
            archivado: false
        });
        if (error) console.log(`   ❌ Error creando alumno ${a.nombres}: ${error.message}`);
        else console.log(`   ✅ Alumno creado: ${a.nombres}`);
    }

    console.log('\n✨ ¡Proceso completado con éxito!');
}

runReset();
