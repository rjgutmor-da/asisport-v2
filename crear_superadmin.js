
/**
 * Script simplificado para crear un superadministrador
 * Usa el cliente de Supabase para crear usuario en Auth y en la tabla usuarios
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

async function crearSuperadmin() {
    console.log('🚀 Creando superadministrador...');
    console.log('');

    // Credenciales del superadmin
    const email = 'super@asisport.com';
    const password = 'Super123!';

    try {
        // Paso 1: Intentar crear el usuario en Auth
        console.log('📝 Creando usuario en Supabase Auth...');

        let userId;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (authError) {
            // Si el usuario ya existe, intentar obtenerlo
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                console.log('⚠️  El usuario ya existe en Auth, buscándolo...');

                // Buscar el usuario por email
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existing = users.find(u => u.email === email);

                if (!existing) {
                    console.error('❌ No se pudo encontrar el usuario existente en la lista.');
                    return;
                }

                userId = existing.id;
                console.log(`✅ Usuario encontrado: ${userId}`);

                // Actualizar password por si acaso
                await supabase.auth.admin.updateUserById(userId, { password: password });
                console.log('✅ Password sincronizado');

            } else {
                console.error('❌ Error al crear usuario:', authError.message);
                return;
            }
        } else {
            userId = authData.user.id;
            console.log(`✅ Usuario creado en Auth: ${userId}`);
        }

        console.log('');

        // Paso 2: Crear o actualizar en la tabla usuarios
        console.log('📝 Creando registro en tabla usuarios...');

        // Upsert para asegurar que se cree o actualice
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .upsert({
                id: userId,
                email: email,
                nombres: 'Super',
                apellidos: 'Administrador',
                telefono_whatsapp: '+1234567890',
                rol: 'SuperAdministrador',
                escuela_id: escuelaId,
                activo: true
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Error al crear en tabla usuarios:', userError.message);
            console.log('   Detalle:', userError.details);
            return;
        }

        console.log('✅ Usuario sincronizado en tabla usuarios');

        console.log('');
        console.log('🎉 ¡Superadministrador listo!');
        console.log(`   Email:      ${email}`);
        console.log(`   Contraseña: ${password}`);

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
    }
}

crearSuperadmin();
