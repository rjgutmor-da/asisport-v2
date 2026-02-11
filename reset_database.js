/**
 * Script para resetear completamente la base de datos
 * ADVERTENCIA: Este script eliminará TODOS los datos
 * 
 * Ejecuta las siguientes acciones:
 * 1. Elimina todos los datos de las tablas públicas (orden inverso dependencias)
 * 2. Elimina todos los usuarios de Auth
 * 3. Crea usuarios de prueba
 * 4. Crea datos maestros (canchas, horarios)
 * 5. Crea datos transaccionales (alumnos)
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

// Usuarios de prueba a crear
const usuariosPrueba = [
    {
        email: 'superadmin@asisport.com',
        password: 'Super123!',
        nombres: 'Super',
        apellidos: 'Administrador',
        telefono: '+56912345678',
        rol: 'SuperAdministrador'
    },
    {
        email: 'admin@asisport.com',
        password: 'Admin123!',
        nombres: 'Juan',
        apellidos: 'Pérez',
        telefono: '+56912345679',
        rol: 'Administrador'
    },
    {
        email: 'entrenador@asisport.com',
        password: 'Entrena123!',
        nombres: 'Carlos',
        apellidos: 'González',
        telefono: '+56912345680',
        rol: 'Entrenador'
    }
];

async function resetDatabase() {
    console.log('🗑️  RESETEO COMPLETO DE BASE DE DATOS');
    console.log('═══════════════════════════════════════');
    console.log('⚠️  ADVERTENCIA: Se eliminarán TODOS los datos');
    console.log('═══════════════════════════════════════');
    console.log('');

    try {
        // ========================================
        // PASO 1: ELIMINAR DATOS DE TABLAS
        // ========================================
        console.log('📝 Paso 1: Limpiando tablas públicas...');

        // Lista de tablas a limpiar (orden inverso dependencias)
        const tablasALimpiar = [
            'asistencias_normales',
            'asistencias_arqueros',
            'convocatorias_alumnos',
            'convocatorias',
            'alumnos_entrenadores',
            'alumnos',
            'usuarios',
            'canchas',
            'horarios'
        ];

        for (const tabla of tablasALimpiar) {
            // Intentar borrar, ignorando error si tabla no existe o está vacía
            // Usamos .neq 'id', 'invalid' para borrar todos
            const { error: deleteError } = await supabase
                .from(tabla)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (deleteError) {
                // Ignorar errores de "relation does not exist" si la tabla no existe
                if (!deleteError.message.includes('relation') && !deleteError.message.includes('does not exist')) {
                    console.log(`   ⚠️  Error al limpiar tabla ${tabla}: ${deleteError.message}`);
                }
            } else {
                console.log(`   ✅ Tabla ${tabla} limpiada`);
            }
        }
        console.log('');

        // ========================================
        // PASO 2: ELIMINAR TODOS LOS USUARIOS DE AUTH
        // ========================================
        console.log('📝 Paso 2: Eliminando usuarios de Auth...');

        let hasMoreUsers = true;
        while (hasMoreUsers) {
            const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
                console.log(`   ⚠️  No se pudieron listar usuarios de Auth: ${listError.message}`);
                hasMoreUsers = false;
            } else {
                const users = authUsers.users || [];
                if (users.length === 0) {
                    hasMoreUsers = false;
                } else {
                    for (const user of users) {
                        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                        if (deleteError) {
                            console.log(`   ❌ Error al eliminar ${user.email}: ${deleteError.message}`);
                        } else {
                            console.log(`   ✅ Eliminado Auth: ${user.email}`);
                        }
                    }
                }
            }
        }
        console.log('');

        // ========================================
        // PASO 3: CREAR DATOS MAESTROS (Canchas, Horarios)
        // ========================================
        console.log('📝 Paso 3: Creando datos maestros...');

        // Crear Cancha
        const { data: canchaData, error: canchaError } = await supabase
            .from('canchas')
            .insert({
                nombre: 'Cancha Principal',
                escuela_id: escuelaId,
                activo: true
            })
            .select()
            .single();

        if (canchaError) {
            console.log(`   ❌ Error creando cancha: ${canchaError.message}`);
            return; // Detener si falla algo crítico
        }
        console.log(`   ✅ Cancha creada: ${canchaData.nombre}`);

        // Crear Horario
        const { data: horarioData, error: horarioError } = await supabase
            .from('horarios')
            .insert({
                hora: '18:00', // Formato de string, ajustar si es time
                escuela_id: escuelaId,
                activo: true
            })
            .select()
            .single();

        if (horarioError) {
            console.log(`   ❌ Error creando horario: ${horarioError.message}`);
            // Intentar con formato HH:mm:ss si falla
        } else {
            console.log(`   ✅ Horario creado: ${horarioData.hora}`);
        }

        console.log('');

        // ========================================
        // PASO 4: CREAR USUARIOS DE PRUEBA
        // ========================================
        console.log('📝 Paso 4: Creando usuarios de prueba...');
        console.log('');

        const usuariosCreados = [];

        for (const usuario of usuariosPrueba) {
            console.log(`   👤 Creando: ${usuario.email}`);

            // Crear en Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: usuario.email,
                password: usuario.password,
                email_confirm: true,
                user_metadata: {
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos
                }
            });

            if (authError) {
                console.log(`      ❌ Error en Auth: ${authError.message}`);
                continue;
            }

            // Crear en tabla usuarios
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .insert({
                    id: authData.user.id,
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    telefono_whatsapp: usuario.telefono,
                    rol: usuario.rol,
                    escuela_id: escuelaId,
                    activo: true
                })
                .select()
                .single();

            if (userError) {
                console.log(`      ❌ Error en tabla usuarios: ${userError.message}`);
                continue;
            }

            console.log(`      ✅ Creado exitosamente`);
            usuariosCreados.push({
                ...usuario,
                id: authData.user.id
            });
        }
        console.log('');

        // ========================================
        // PASO 5: CREAR ALUMNOS DE PRUEBA
        // ========================================
        console.log('📝 Paso 5: Creando alumnos de prueba...');
        console.log('');

        const alumnosPrueba = [
            {
                nombres: 'Pedro',
                apellidos: 'Martínez',
                fecha_nacimiento: '2010-05-15',
                nombre_padre: 'Roberto Martínez',
                telefono_padre: '+56987654321',
                nombre_madre: 'María Silva',
                telefono_madre: '+56987654322',
                direccion: 'Calle Falsa 123',
                estado: 'Activo', // Probar con Mayúscula
                cancha_id: canchaData.id,
                horario_id: horarioData?.id
            },
            {
                nombres: 'Ana',
                apellidos: 'López',
                fecha_nacimiento: '2011-08-20',
                nombre_padre: 'Luis López',
                telefono_padre: '+56987654323',
                nombre_madre: 'Carmen Rojas',
                telefono_madre: '+56987654324',
                direccion: 'Avenida Siempre Viva 742',
                estado: 'Activo',
                cancha_id: canchaData.id,
                horario_id: horarioData?.id
            },
            {
                nombres: 'Diego',
                apellidos: 'Fernández',
                fecha_nacimiento: '2012-03-10',
                nombre_padre: 'Jorge Fernández',
                telefono_padre: '+56987654325',
                nombre_madre: 'Patricia Muñoz',
                telefono_madre: '+56987654326',
                direccion: 'Pasaje Los Aromos 456',
                estado: 'Activo',
                cancha_id: canchaData.id,
                horario_id: horarioData?.id
            }
        ];

        for (const alumno of alumnosPrueba) {
            const { data: alumnoData, error: alumnoError } = await supabase
                .from('alumnos')
                .insert({
                    ...alumno,
                    escuela_id: escuelaId,
                    es_arquero: false,
                    archivado: false
                })
                .select()
                .single();

            if (alumnoError) {
                console.log(`   ❌ Error al crear alumno ${alumno.nombres}: ${alumnoError.message}`);
                // Si falla check constraint, intentar con minúscula
                if (alumnoError.message.includes('check constraint')) {
                    console.log('   Retrying with lowercase estado...');
                    const { error: retryError } = await supabase
                        .from('alumnos')
                        .insert({
                            ...alumno,
                            estado: 'activo',
                            escuela_id: escuelaId,
                            es_arquero: false,
                            archivado: false
                        });
                    if (!retryError) console.log('   ✅ Retry success!');
                    else console.log(`   ❌ Retry failed: ${retryError.message}`);
                }
            } else {
                console.log(`   ✅ Alumno creado: ${alumno.nombres} ${alumno.apellidos}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('🎉 ¡RESETEO COMPLETADO EXITOSAMENTE!');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('📋 USUARIOS CREADOS:');
        usuariosCreados.forEach((user, index) => {
            console.log(`${index + 1}. ${user.rol} (${user.email})`);
            console.log(`   Pass: ${user.password}`);
        });
        console.log('');
        console.log('🌐 Accede a la aplicación en: http://localhost:5174/login');

    } catch (error) {
        console.error('❌ Error fatal:', error);
    }
}

// Ejecutar
resetDatabase();
