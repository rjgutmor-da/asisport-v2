import { supabase } from '../lib/supabaseClient';

/**
 * Grupos de la gestión activa visibles para el usuario actual. La autorización
 * se resuelve dentro del RPC; el cliente nunca infiere ni asigna profesores.
 */
export const getGruposGestionActivos = async () => {
    const { data, error } = await supabase.rpc('rpc_grupos_gestion_activos');
    if (error) throw new Error(error.message || 'No se pudieron cargar los grupos activos.');
    return data || [];
};

export const registrarAlumnoEnGrupo = async (alumno, grupoGestionId) => {
    const { data, error } = await supabase.rpc('rpc_registrar_alumno_en_grupo', {
        p_alumno: alumno,
        p_grupo_gestion_id: grupoGestionId,
    });
    if (error) throw new Error(error.message || 'No se pudo registrar el alumno.');
    return data;
};

export const trasladarAlumnoAGrupo = async (alumnoId, grupoGestionId, motivo = 'traslado') => {
    const { data, error } = await supabase.rpc('rpc_trasladar_alumno', {
        p_alumno_id: alumnoId,
        p_grupo_destino_id: grupoGestionId,
        p_motivo: motivo,
    });
    if (error) throw new Error(error.message || 'No se pudo trasladar el alumno.');
    return data;
};

export const registrarAsistenciasEnGrupo = async (fecha, grupoGestionId, asistencias) => {
    const { data, error } = await supabase.rpc('rpc_registrar_asistencias_lote', {
        p_fecha: fecha,
        p_grupo_gestion_id: grupoGestionId,
        p_asistencias: asistencias,
    });
    if (error) throw new Error(error.message || 'No se pudo registrar la asistencia.');
    return data;
};
