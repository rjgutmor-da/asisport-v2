/**
 * Script para crear un usuario de prueba con acceso a la aplicación
 * Este script crea un usuario y lo registra en la tabla usuarios
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

async function crearUsuarioAcceso() {
    console.log('🔐 Creando usuario de acceso...');
    console.log('');

    // Datos del usuario
    const email = 'admin@asisport.com';
    const password = 'Admin123!';
    const nombre = 'Administrador';
    const apellido = 'Sistema';

    try {
        // 1. Crear usuario en Auth
        console.log('📝 Paso 1: Creando usuario en Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                nombre: nombre,
                apellido: apellido
            }
        });

        if (authError) {
            console.error('❌ Error al crear usuario en Auth:', authError.message);
            return;
        }

        console.log('✅ Usuario creado en Auth');
        console.log(`   ID: ${authData.user.id}`);
        console.log('');

        // 2. Crear registro en la tabla usuarios
        console.log('📝 Paso 2: Creando registro en tabla usuarios...');
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .insert({
                id: authData.user.id,
                email: email,
                nombres: nombre,
                apellidos: apellido,
                telefono_whatsapp: '+1234567890',
                rol: 'superadmin',
                escuela_id: escuelaId,
                activo: true
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Error al crear usuario en tabla:', userError.message);
            console.log('');
            console.log('⚠️  El usuario se creó en Auth pero no en la tabla usuarios');
            console.log('   Puedes intentar crearlo manualmente o el usuario ya existe');
            return;
        }

        console.log('✅ Usuario creado en tabla usuarios');
        console.log('');
        console.log('🎉 ¡Usuario creado exitosamente!');
        console.log('');
        console.log('📋 Credenciales de acceso:');
        console.log(`   Email: ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log(`   Rol: ${userData.rol}`);
        console.log('');
        console.log('🌐 Accede a la aplicación en: http://localhost:5174/login');

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
    }
}

// Ejecutar la función
crearUsuarioAcceso();
