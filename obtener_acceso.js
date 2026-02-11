/**
 * Script para obtener acceso a la aplicación
 * Busca un usuario existente y actualiza su contraseña
 */

import { createClient } from '@supabase/supabase-js';

// Variables de configuración
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';

// Crear cliente de Supabase con privilegios de administrador
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Cliente normal para consultas
const supabase = createClient(supabaseUrl, anonKey);

async function obtenerAcceso() {
    console.log('🔑 Obteniendo acceso a la aplicación...');
    console.log('');

    try {
        // Paso 1: Buscar usuarios en la base de datos
        console.log('📝 Buscando usuarios en la base de datos...');
        const { data: usuarios, error: listError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('activo', true)
            .limit(5);

        if (listError) {
            console.error('❌ Error al buscar usuarios:', listError.message);
            return;
        }

        if (!usuarios || usuarios.length === 0) {
            console.log('❌ No hay usuarios activos en la base de datos');
            console.log('');
            console.log('💡 Necesitas crear un usuario primero desde Supabase Dashboard:');
            console.log('   1. Ve a https://supabase.com/dashboard');
            console.log('   2. Selecciona tu proyecto');
            console.log('   3. Ve a Authentication > Users');
            console.log('   4. Crea un nuevo usuario');
            console.log('   5. Luego agrega el registro en la tabla usuarios');
            return;
        }

        console.log(`✅ Encontrados ${usuarios.length} usuario(s) activo(s)`);
        console.log('');

        // Mostrar usuarios
        console.log('👥 Usuarios disponibles:');
        usuarios.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} - ${user.nombres} ${user.apellidos} (${user.rol})`);
        });
        console.log('');

        // Tomar el primer usuario
        const usuario = usuarios[0];
        const nuevaPassword = 'Acceso123!';

        console.log(`📝 Configurando acceso para: ${usuario.email}`);
        console.log('');

        // Paso 2: Actualizar la contraseña del usuario
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            usuario.id,
            {
                password: nuevaPassword,
                email_confirm: true
            }
        );

        if (updateError) {
            console.error('❌ Error al actualizar contraseña:', updateError.message);
            return;
        }

        console.log('✅ Contraseña actualizada exitosamente');
        console.log('');
        console.log('🎉 ¡Acceso configurado!');
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('📋 CREDENCIALES DE ACCESO');
        console.log('═══════════════════════════════════════');
        console.log(`   Email:      ${usuario.email}`);
        console.log(`   Contraseña: ${nuevaPassword}`);
        console.log(`   Rol:        ${usuario.rol}`);
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('🌐 Accede en: http://localhost:5174/login');
        console.log('');

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        console.log('');
        console.log('Stack trace:');
        console.log(error.stack);
    }
}

// Ejecutar
obtenerAcceso();
