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

    // Validar campos requeridos antes de llamar a la API
    if (!userData.email?.trim()) throw new Error('El correo electrónico es obligatorio.');
    if (!userData.password || userData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    if (!userData.nombres?.trim()) throw new Error('El nombre es obligatorio.');
    if (!userData.apellidos?.trim()) throw new Error('Los apellidos son obligatorios.');

    // 2. Cliente secundario para no cerrar la sesión actual
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 3. Crear usuario en Auth de Supabase
    const emailLimpio = userData.email.trim().toLowerCase();
    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: emailLimpio,
        password: userData.password,
    });

    if (authError) {
        // Traducir errores comunes al español
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
            throw new Error(`El correo ${emailLimpio} ya está registrado en el sistema.`);
        }
        if (authError.message.includes('invalid email')) {
            throw new Error('El formato del correo electrónico no es válido.');
        }
        if (authError.message.includes('Password')) {
            throw new Error('La contraseña no cumple los requisitos mínimos (al menos 6 caracteres).');
        }
        throw new Error('Error al crear la cuenta: ' + authError.message);
    }

    if (!authData.user) {
        // Supabase a veces devuelve sin user si el email ya existe pero no está confirmado
        throw new Error(`El correo ${emailLimpio} ya existe en el sistema. Si el usuario no ha confirmado su correo, puede reenviar el correo de confirmación.`);
    }

    const authUserId = authData.user.id;

    // 4. Guardar el perfil en la tabla 'usuarios'
    const newUserData = {
        id: authUserId,
        email: emailLimpio,
        nombres: userData.nombres.trim(),
        apellidos: userData.apellidos.trim(),
        rol: userData.rol,
        sucursal_id: userData.sucursal_id || null,
        escuela_id: escuelaId,
        activo: true
    };

    const { error: dbError } = await supabase
        .from('usuarios')
        .upsert(newUserData, { onConflict: 'id' });

    if (dbError) {
        // Si falla el perfil, el usuario de auth ya fue creado. Informar claramente.
        console.error('Error al guardar perfil, el usuario de Auth fue creado con ID:', authUserId);
        throw new Error(
            'La cuenta se creó pero no se pudo guardar el perfil. ' +
            'Contacte al administrador o intente desde "Recuperar contraseña". ' +
            'Detalle técnico: ' + dbError.message
        );
    }

    return { id: authUserId, email: emailLimpio };
};
