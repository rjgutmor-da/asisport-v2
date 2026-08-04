/**
 * Script: Limpieza de usuarios fantasma
 * 
 * Detecta usuarios que existen en Supabase Auth pero NO tienen
 * registro en la tabla `usuarios`. Estos usuarios pueden autenticarse
 * pero verán la pantalla "Sin Escuela Asignada".
 * 
 * Modos:
 *   --listar   → Solo muestra los fantasmas (por defecto)
 *   --eliminar → Elimina los fantasmas de Auth
 * 
 * Uso:
 *   node scripts/limpiar_usuarios_fantasma.js
 *   node scripts/limpiar_usuarios_fantasma.js --eliminar
 */

import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

const modoEliminar = process.argv.includes('--eliminar');

async function limpiarFantasmas() {
    console.log('🔍 Buscando usuarios fantasma...');
    console.log('');

    try {
        // 1. Obtener todos los usuarios de Auth
        const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Error al listar usuarios de Auth:', authError.message);
            console.log('   Esto puede ocurrir si Supabase tiene problemas temporales.');
            console.log('   Intenta de nuevo en unos minutos.');
            return;
        }

        const authUsers = authResponse.users || [];
        console.log(`📊 Usuarios en Auth: ${authUsers.length}`);

        // 2. Obtener todos los IDs de la tabla usuarios
        const { data: dbUsers, error: dbError } = await supabase
            .from('usuarios')
            .select('id, email');

        if (dbError) {
            console.error('❌ Error al consultar tabla usuarios:', dbError.message);
            return;
        }

        console.log(`📊 Usuarios en tabla 'usuarios': ${dbUsers.length}`);
        console.log('');

        // 3. Encontrar fantasmas (en Auth pero no en tabla)
        const dbUserIds = new Set(dbUsers.map(u => u.id));
        const fantasmas = authUsers.filter(u => !dbUserIds.has(u.id));

        if (fantasmas.length === 0) {
            console.log('✅ No hay usuarios fantasma. Todo está sincronizado.');
            return;
        }

        console.log(`⚠️  Encontrados ${fantasmas.length} usuario(s) fantasma:`);
        console.log('');

        fantasmas.forEach((user, i) => {
            console.log(`   ${i + 1}. ${user.email}`);
            console.log(`      ID: ${user.id}`);
            console.log(`      Creado: ${user.created_at}`);
            console.log(`      Último login: ${user.last_sign_in_at || 'Nunca'}`);
            console.log('');
        });

        // 4. Eliminar si se solicitó
        if (modoEliminar) {
            console.log('🗑️  Eliminando usuarios fantasma de Auth...');
            console.log('');

            let eliminados = 0;
            let errores = 0;

            for (const fantasma of fantasmas) {
                const { error } = await supabase.auth.admin.deleteUser(fantasma.id);
                if (error) {
                    console.log(`   ❌ Error eliminando ${fantasma.email}: ${error.message}`);
                    errores++;
                } else {
                    console.log(`   ✅ Eliminado: ${fantasma.email}`);
                    eliminados++;
                }
            }

            console.log('');
            console.log(`📊 Resultado: ${eliminados} eliminados, ${errores} errores`);
        } else {
            console.log('ℹ️  Para eliminarlos, ejecuta:');
            console.log('   node scripts/limpiar_usuarios_fantasma.js --eliminar');
        }

    } catch (err) {
        console.error('❌ Error inesperado:', err.message);
    }
}

limpiarFantasmas();
