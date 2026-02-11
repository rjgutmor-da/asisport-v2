/**
 * Script para dar acceso a la aplicación
 * Actualiza la contraseña de un usuario existente y confirma su email
 */

import { createClient } from '@supabase/supabase-js';

// Variables de configuración
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

// Crear cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function darAcceso() {
    console.log('🔐 Configurando acceso a la aplicación...');
    console.log('');

    try {
        // 1. Listar todos los usuarios para encontrar uno
        console.log('📝 Paso 1: Buscando usuarios en la base de datos...');
        const { data: usuarios, error: listError } = await supabase
            .from('usuarios')
            .select('*')
            .limit(10);

        if (listError) {
            console.error('❌ Error al listar usuarios:', listError.message);
            return;
        }

        if (!usuarios || usuarios.length === 0) {
            console.log('⚠️  No hay usuarios en la base de datos');
            console.log('   Necesitas crear un usuario primero');
            return;
        }

        console.log(`✅ Encontrados ${usuarios.length} usuario(s)`);
        console.log('');

        // Mostrar usuarios disponibles
        console.log('👥 Usuarios disponibles:');
        usuarios.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.rol}) - ${user.activo ? 'Activo' : 'Inactivo'}`);
        });
        console.log('');

        // Tomar el primer usuario
        const usuario = usuarios[0];
        console.log(`📝 Paso 2: Actualizando contraseña para ${usuario.email}...`);

        // Nueva contraseña
        const nuevaPassword = 'Admin123!';

        // 2. Actualizar la contraseña del usuario
        const { data: authData, error: updateError } = await supabase.auth.admin.updateUserById(
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
        console.log('📋 Credenciales de acceso:');
        console.log(`   Email: ${usuario.email}`);
        console.log(`   Contraseña: ${nuevaPassword}`);
        console.log(`   Rol: ${usuario.rol}`);
        console.log('');
        console.log('🌐 Accede a la aplicación en: http://localhost:5174/login');
        console.log('');

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
    }
}

// Ejecutar la función
darAcceso();
