import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

/**
 * Obtener información de la escuela actual
 * Solo SuperAdministrador puede acceder
 */
export const getEscuelaActual = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    const { data, error } = await supabase
        .from('escuelas')
        .select('*')
        .eq('id', escuelaId)
        .single();

    if (error) throw new Error('Error al obtener datos de la escuela: ' + error.message);
    return data;
};

/**
 * Obtener estadísticas generales de la escuela
 */
export const getEstadisticasEscuela = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Alumnos activos
    const { count: alumnosCount } = await supabase
        .from('alumnos')
        .select('id', { count: 'exact', head: true })
        .eq('escuela_id', escuelaId)
        .eq('archivado', false);

    // Usuarios activos
    const { count: usuariosCount } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('escuela_id', escuelaId)
        .eq('activo', true);

    // Entrenadores activos
    const { count: entrenadoresCount } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('escuela_id', escuelaId)
        .eq('rol', 'Entrenador')
        .eq('activo', true);

    return {
        alumnosActivos: alumnosCount || 0,
        usuariosActivos: usuariosCount || 0,
        entrenadoresActivos: entrenadoresCount || 0
    };
};

/**
 * Invitar usuario por email
 * Solo SuperAdministrador puede ejecutar
 * El usuario invitado se vincula automáticamente a la escuela
 */
export const inviteUserByEmail = async (email, rol) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('El email no tiene un formato válido.');
    }

    // Validar que no exista el email en la escuela
    const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .eq('escuela_id', escuelaId)
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        throw new Error('Este email ya está registrado en la escuela.');
    }

    // Nota: La invitación por email requiere configuración en Supabase
    // y acceso al Admin API. Por ahora, esto es un placeholder para
    // documentar el flujo. En producción, esto debería ser manejado
    // por una Edge Function con permisos de admin.

    // Por ahora, creamos el usuario directamente (MVP simplificado)
    // En producción, usar supabase.auth.admin.inviteUserByEmail()

    throw new Error('La funcionalidad de invitación por email requiere configuración adicional en Supabase. Por favor, crea usuarios manualmente desde Authentication > Users en el dashboard de Supabase.');

    // Implementación futura con Edge Function:
    /*
    const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
            email,
            rol,
            escuela_id: escuelaId
        }
    });

    if (error) throw new Error('Error al enviar invitación: ' + error.message);
    return data;
    */
};
