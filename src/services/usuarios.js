import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

export const getUsuarios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const escuelaId = await obtenerEscuelaId();

    // Obtener perfil extra para saber rol y sucursal
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('rol, sucursal_id')
        .eq('id', user.id)
        .single();

    let query = supabase
        .from('usuarios')
        .select('*')
        .eq('escuela_id', escuelaId);

    // Filtrar por sucursal si es Administrador o Entrenador
    if (userProfile && userProfile.rol !== 'Dueño' && userProfile.rol !== 'SuperAdministrador') {
        if (userProfile.sucursal_id) {
            query = query.eq('sucursal_id', userProfile.sucursal_id);
        }
    }

    const { data, error } = await query.order('nombres', { ascending: true });

    if (error) throw error;
    return data;
};

export const updateUserRole = async (userId, newRole) => {
    // Validar que el rol sea válido
    const validRoles = ['Dueño', 'Administrador', 'Entrenador', 'Entrenarqueros'];
    if (!validRoles.includes(newRole)) {
        throw new Error('Rol no válido');
    }

    // Regla de negocio: El rol 'Dueño' debería ser único (o manejado con cuidado)
    // Pero aquí solo actualizamos.

    const { data, error } = await supabase
        .from('usuarios')
        .update({ rol: newRole })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const toggleUserStatus = async (userId, currentStatus) => {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ activo: !currentStatus })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateUserSucursal = async (userId, sucursalId) => {
    // Si sucursalId es vacío, seteamos null
    const newValue = sucursalId ? sucursalId : null;
    const { data, error } = await supabase
        .from('usuarios')
        .update({ sucursal_id: newValue })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
