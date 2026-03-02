import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

/**
 * Obtiene las sucursales vinculadas a la escuela actual.
 * Ideal para cargar filtros r├ípidos o listar en el panel de administraci├│n.
 */
export const getSucursales = async () => {
    const escuelaId = await obtenerEscuelaId();
    const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .eq('escuela_id', escuelaId)
        .order('nombre', { ascending: true });

    if (error) throw new Error('Error al obtener sucursales: ' + error.message);
    return data;
};

/**
 * Obtiene la informaci├│n de una sucursal en espec├¡fico.
 */
export const getSucursalById = async (sucursalId) => {
    const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .eq('id', sucursalId)
        .single();

    if (error) throw new Error('Error al obtener la sucursal: ' + error.message);
    return data;
}

/**
 * Crea una nueva sucursal para la escuela actual.
 * (Solo Due├▒o o SuperAdmin deber├¡a hacer esto).
 */
export const createSucursal = async (nombre, direccion = null) => {
    const escuelaId = await obtenerEscuelaId();
    const { data, error } = await supabase
        .from('sucursales')
        .insert([{
            nombre,
            direccion,
            escuela_id: escuelaId
        }])
        .select()
        .single();

    if (error) throw new Error('Error al crear la sucursal: ' + error.message);
    return data;
};

/**
 * Actualiza la informaci├│n de una sucursal existente.
 */
export const updateSucursal = async (sucursalId, updates) => {
    const { data, error } = await supabase
        .from('sucursales')
        .update(updates)
        .eq('id', sucursalId)
        .select()
        .single();

    if (error) throw new Error('Error al actualizar la sucursal: ' + error.message);
    return data;
};

/**
 * Elimina una sucursal. Considerar advertencias en UI porque puede
 * dejar alumnos/usuarios hu├®rfanos o desencadenar borrados en cascada (seg├║n dise├▒o SQL actual
 * pone ON DELETE SET NULL en usuarios y alumnos, lo cual es seguro).
 */
export const deleteSucursal = async (sucursalId) => {
    const { error } = await supabase
        .from('sucursales')
        .delete()
        .eq('id', sucursalId);

    if (error) throw new Error('Error al eliminar la sucursal: ' + error.message);
    return true;
};
