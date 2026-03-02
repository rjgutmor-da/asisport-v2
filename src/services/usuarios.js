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

export const createUserDirectly = async (userData) => {
    // 1. Obtener contexto del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const escuelaId = await obtenerEscuelaId();

    // 2. Cliente secundario para no cerrar la sesión actual
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 3. Crear usuario en Auth de Supabase
    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
    });

    if (authError) {
        throw new Error('Error al crear usuario en Supabase: ' + authError.message);
    }

    if (!authData.user) {
        throw new Error('No se devolvió un usuario tras el registro.');
    }

    // 4. Upsert en la tabla 'usuarios' (por si un trigger ya lo creó)
    const newUserData = {
        id: authData.user.id,
        email: userData.email.trim(),
        nombres: userData.nombres.trim(),
        apellidos: userData.apellidos.trim(),
        rol: userData.rol,
        sucursal_id: userData.sucursal_id || null,
        escuela_id: escuelaId,
        activo: true
    };

    const { error: dbError } = await supabase
        .from('usuarios')
        .upsert(newUserData);

    if (dbError) {
        throw new Error('El usuario se creó pero hubo un error al guardar sus datos de perfil: ' + dbError.message);
    }

    return true;
};
