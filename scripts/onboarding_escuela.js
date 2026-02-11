/**
 * Script: Onboarding de nueva escuela
 * 
 * Crea automáticamente:
 *   1. Una nueva escuela en la tabla `escuelas`
 *   2. Un usuario administrador en Auth
 *   3. El registro del admin en la tabla `usuarios` vinculado a la escuela
 * 
 * Uso:
 *   node scripts/onboarding_escuela.js
 * 
 * Configurar las variables al inicio del script antes de ejecutar.
 */

import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════
// CONFIGURACIÓN — Editar estos valores antes de ejecutar
// ══════════════════════════════════════════════════

const NUEVA_ESCUELA = {
    nombre: 'Escuela Ejemplo',
    direccion: 'Av. Principal 123',
    telefono: '+56911111111',
    email_contacto: 'contacto@ejemplo.com'
};

const ADMIN_ESCUELA = {
    email: 'admin@ejemplo.com',
    password: 'Admin123!',
    nombres: 'Admin',
    apellidos: 'Ejemplo',
    telefono_whatsapp: '+56911111111'
};

// ══════════════════════════════════════════════════
// NO EDITAR DEBAJO DE ESTA LÍNEA
// ══════════════════════════════════════════════════

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function onboarding() {
    console.log('🚀 Iniciando onboarding de nueva escuela...');
    console.log('');

    try {
        // ── Paso 1: Crear la escuela ──
        console.log('📝 Paso 1: Creando escuela...');

        const { data: escuela, error: escuelaError } = await supabase
            .from('escuelas')
            .insert({
                nombre: NUEVA_ESCUELA.nombre,
                direccion: NUEVA_ESCUELA.direccion,
                telefono: NUEVA_ESCUELA.telefono,
                email_contacto: NUEVA_ESCUELA.email_contacto,
                activa: true
            })
            .select()
            .single();

        if (escuelaError) {
            console.error('❌ Error al crear escuela:', escuelaError.message);
            return;
        }

        console.log(`✅ Escuela creada: "${escuela.nombre}"`);
        console.log(`   ID: ${escuela.id}`);
        console.log('');

        // ── Paso 2: Crear usuario en Auth ──
        console.log('📝 Paso 2: Creando usuario administrador en Auth...');

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: ADMIN_ESCUELA.email,
            password: ADMIN_ESCUELA.password,
            email_confirm: true
        });

        if (authError) {
            console.error('❌ Error al crear usuario en Auth:', authError.message);
            console.log('   ⚠️  La escuela fue creada pero el admin no. Limpia manualmente.');
            return;
        }

        const userId = authData.user.id;
        console.log(`✅ Usuario creado en Auth: ${userId}`);
        console.log('');

        // ── Paso 3: Crear registro en tabla usuarios ──
        console.log('📝 Paso 3: Vinculando admin con la escuela...');

        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .insert({
                id: userId,
                email: ADMIN_ESCUELA.email,
                nombres: ADMIN_ESCUELA.nombres,
                apellidos: ADMIN_ESCUELA.apellidos,
                telefono_whatsapp: ADMIN_ESCUELA.telefono_whatsapp,
                rol: 'Administrador',
                escuela_id: escuela.id,
                activo: true
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Error al crear registro en tabla usuarios:', userError.message);
            console.log('   ⚠️  El usuario Auth fue creado pero no vinculado. Limpia manualmente.');
            return;
        }

        console.log('✅ Admin vinculado a la escuela');
        console.log('');

        // ── Resumen ──
        console.log('═══════════════════════════════════════════════');
        console.log('🎉 ¡ONBOARDING COMPLETADO!');
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('📋 Escuela:');
        console.log(`   Nombre:  ${escuela.nombre}`);
        console.log(`   ID:      ${escuela.id}`);
        console.log('');
        console.log('👤 Administrador:');
        console.log(`   Email:      ${ADMIN_ESCUELA.email}`);
        console.log(`   Contraseña: ${ADMIN_ESCUELA.password}`);
        console.log(`   Rol:        Administrador`);
        console.log('');
        console.log('🌐 El admin ya puede acceder en: http://localhost:5173/login');
        console.log('═══════════════════════════════════════════════');

    } catch (err) {
        console.error('❌ Error inesperado:', err.message);
        console.log('Stack:', err.stack);
    }
}

onboarding();
