
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDemo() {
    console.log('🚀 Iniciando configuración de la Escuela Demo: Estrellas de América...');

    try {
        // 1. Verificar si existe la escuela
        let { data: escuela, error: eCheckError } = await supabase
            .from('escuelas')
            .select('*')
            .eq('nombre', 'Estrellas de América')
            .maybeSingle();

        if (!escuela) {
            const { data: newEscuela, error: eInsertError } = await supabase
                .from('escuelas')
                .insert({ nombre: 'Estrellas de América', activa: true })
                .select()
                .single();
            if (eInsertError) throw eInsertError;
            escuela = newEscuela;
        }
        console.log(`✅ Escuela: ${escuela.nombre} (ID: ${escuela.id})`);

        // 2. Sucursal
        let { data: sucursal } = await supabase.from('sucursales').select('*').eq('nombre', 'Sede Panamericana').eq('escuela_id', escuela.id).maybeSingle();
        if (!sucursal) {
            const { data: sNew, error: sErr } = await supabase.from('sucursales').insert({ nombre: 'Sede Panamericana', escuela_id: escuela.id }).select().single();
            if (sErr) throw sErr;
            sucursal = sNew;
        }
        console.log(`✅ Sucursal: ${sucursal.nombre} (ID: ${sucursal.id})`);

        // 3. Cancha
        let { data: cancha } = await supabase.from('canchas').select('*').eq('nombre', 'Estadio Continental').eq('escuela_id', escuela.id).maybeSingle();
        if (!cancha) {
            const { data: cNew, error: cErr } = await supabase.from('canchas').insert({ nombre: 'Estadio Continental', escuela_id: escuela.id, sucursal_id: sucursal.id }).select().single();
            if (cErr) throw cErr;
            cancha = cNew;
        }
        console.log(`✅ Cancha: ${cancha.nombre} (ID: ${cancha.id})`);

        // 4. Horario
        let { data: horario } = await supabase.from('horarios').select('*').eq('hora', '10:00').eq('escuela_id', escuela.id).maybeSingle();
        if (!horario) {
            const { data: hNew, error: hErr } = await supabase.from('horarios').insert({ hora: '10:00', escuela_id: escuela.id }).select().single();
            if (hErr) throw hErr;
            horario = hNew;
        }
        console.log(`✅ Horario: ${horario.hora} (ID: ${horario.id})`);

        // 5. Usuario Demo
        const email = 'demo@asisport.com';
        let userId;
        
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let existingAuth = users.find(u => u.email === email);

        if (existingAuth) {
            userId = existingAuth.id;
        } else {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: 'demoasisport',
                email_confirm: true,
                user_metadata: { role: 'Dueño' }
            });
            if (authError) throw authError;
            userId = authData.user.id;
        }

        const { error: dbUserError } = await supabase
            .from('usuarios')
            .upsert({
                id: userId,
                email,
                nombres: 'Director',
                apellidos: 'Demo',
                rol: 'Dueño',
                escuela_id: escuela.id,
                sucursal_id: sucursal.id,
                activo: true,
                telefono_whatsapp: '59174631123' // Usando el número del usuario por defecto
            });
        
        if (dbUserError) throw dbUserError;
        console.log(`✅ Usuario Demo listo: ${email}`);

        console.log('\n✨ Configuración base completada.');
        process.stdout.write(`RESULT_ID_START\n`);
        process.stdout.write(`ESCUELA_ID=${escuela.id}\n`);
        process.stdout.write(`SUCURSAL_ID=${sucursal.id}\n`);
        process.stdout.write(`CANCHA_ID=${cancha.id}\n`);
        process.stdout.write(`HORARIO_ID=${horario.id}\n`);
        process.stdout.write(`USER_ID=${userId}\n`);
        process.stdout.write(`RESULT_ID_END\n`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

setupDemo();
