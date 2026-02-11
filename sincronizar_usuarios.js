/**
 * Script para sincronizar usuarios de Auth con la tabla usuarios
 * Busca usuarios en Auth y los crea en la tabla usuarios si no existen
 */

import { createClient } from '@supabase/supabase-js';

// Variables de configuración
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

// Crear cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function sincronizarUsuarios() {
    console.log('🔄 Sincronizando usuarios de Auth con tabla usuarios...');
    console.log('');

    try {
        // Paso 1: Listar usuarios en Auth
        console.log('📝 Buscando usuarios en Supabase Auth...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Error al listar usuarios de Auth:', authError.message);
            return;
        }

        const users = authUsers.users || [];
        console.log(`✅ Encontrados ${users.length} usuario(s) en Auth`);
        console.log('');

        if (users.length === 0) {
            console.log('⚠️  No hay usuarios en Auth');
            console.log('');
            console.log('💡 Creando un usuario de prueba...');

            const email = 'admin@asisport.com';
            const password = 'Admin123!';

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true
            });

            if (createError) {
                console.error('❌ Error al crear usuario:', createError.message);
                return;
            }

            users.push(newUser.user);
            console.log(`✅ Usuario creado: ${email}`);
            console.log('');
        }

        // Paso 2: Para cada usuario en Auth, verificar si existe en la tabla usuarios
        for (const authUser of users) {
            console.log(`👤 Procesando: ${authUser.email}`);

            // Verificar si existe en la tabla
            const { data: existingUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (existingUser) {
                console.log(`   ✅ Ya existe en tabla usuarios`);
            } else {
                console.log(`   📝 Creando en tabla usuarios...`);

                // Crear el usuario en la tabla
                const { data: newUserData, error: insertError } = await supabase
                    .from('usuarios')
                    .insert({
                        id: authUser.id,
                        email: authUser.email,
                        nombres: 'Usuario',
                        apellidos: 'Sistema',
                        telefono_whatsapp: '+1234567890',
                        rol: 'Administrador',
                        escuela_id: escuelaId,
                        activo: true
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.log(`   ❌ Error: ${insertError.message}`);
                } else {
                    console.log(`   ✅ Creado exitosamente`);
                }
            }
            console.log('');
        }

        // Paso 3: Mostrar resumen y credenciales
        const { data: finalUsers } = await supabase
            .from('usuarios')
            .select('*')
            .eq('activo', true);

        if (finalUsers && finalUsers.length > 0) {
            console.log('🎉 ¡Sincronización completada!');
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('📋 USUARIOS DISPONIBLES');
            console.log('═══════════════════════════════════════');

            finalUsers.forEach((user, index) => {
                console.log(`${index + 1}. Email: ${user.email}`);
                console.log(`   Nombre: ${user.nombres} ${user.apellidos}`);
                console.log(`   Rol: ${user.rol}`);
                console.log('');
            });

            console.log('═══════════════════════════════════════');
            console.log('');
            console.log('💡 Para acceder, usa el email de cualquier usuario');
            console.log('   y la contraseña que configuraste en Auth');
            console.log('');
            console.log('🌐 Accede en: http://localhost:5174/login');
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        console.log('');
        console.log('Stack trace:');
        console.log(error.stack);
    }
}

// Ejecutar
sincronizarUsuarios();
