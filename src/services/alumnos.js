import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

// Validar foto (máx 200 KB)
export const validatePhoto = (file) => {
    return new Promise((resolve) => {
        if (!file) {
            resolve({ valid: true });
            return;
        }

        const MAX_SIZE = 200 * 1024; // 200 KB
        if (file.size > MAX_SIZE) {
            resolve({ valid: false, error: 'La foto es demasiado pesada. Máximo 200 KB.' });
            return;
        }

        resolve({ valid: true });
    });
};

// Regla #8: Validación de Representante Legal
const validateRepresentante = (data) => {
    const padreCompleto = data.nombre_padre && data.telefono_padre;
    const madreCompleta = data.nombre_madre && data.telefono_madre;

    if (!padreCompleto && !madreCompleta) {
        return 'Debe registrar al menos un representante legal completo (Padre o Madre con nombre y teléfono).';
    }
    return null;
};

export const createAlumno = async (alumnoData, photoFile) => {
    // 1. Validaciones previas
    if (!alumnoData.nombres || !alumnoData.apellidos || !alumnoData.fecha_nacimiento) {
        throw new Error('Faltan campos obligatorios: Nombres, Apellidos o Fecha de Nacimiento.');
    }

    // Validar representante legal
    const repError = validateRepresentante(alumnoData);
    if (repError) throw new Error(repError);

    // Obtener usuario actual (Entrenador)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // 2. Validación de duplicados (Carnet de Identidad)
    if (alumnoData.carnet_identidad) {
        const { data: existing, error: checkError } = await supabase
            .from('alumnos')
            .select('id, nombres, apellidos')
            .eq('carnet_identidad', alumnoData.carnet_identidad)
            .eq('escuela_id', escuelaId)
            .is('archivado', false)
            .maybeSingle();

        if (checkError) console.error('Error al verificar duplicados:', checkError);

        if (existing) {
            throw new Error(`El carnet ${alumnoData.carnet_identidad} ya está registrado para el alumno: ${existing.nombres} ${existing.apellidos}.`);
        }
    }

    let fotoUrl = null;

    // 3. Subir foto si existe
    if (photoFile) {
        const fileExt = 'jpg'; // Siempre convertimos a jpg en el componente
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `fotos_alumnos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, photoFile);

        if (uploadError) throw new Error('Error al subir la foto: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        fotoUrl = publicUrl;
    }

    // 4. Formatear teléfonos (Regla de oro: asegurar internacional para WhatsApp)
    const formatPhone = (phone) => {
        if (!phone) return null;
        const clean = phone.replace(/\D/g, '');
        return clean.length === 8 ? `591${clean}` : clean;
    };

    const newAlumno = {
        nombres: alumnoData.nombres,
        apellidos: alumnoData.apellidos,
        fecha_nacimiento: alumnoData.fecha_nacimiento,
        carnet_identidad: alumnoData.carnet_identidad || null,
        nombre_padre: alumnoData.nombre_padre || null,
        telefono_padre: formatPhone(alumnoData.telefono_padre),
        nombre_madre: alumnoData.nombre_madre || null,
        telefono_madre: formatPhone(alumnoData.telefono_madre),
        telefono_deportista: formatPhone(alumnoData.telefono_deportista),
        colegio: alumnoData.colegio || null,
        direccion: alumnoData.direccion || null,
        cancha_id: alumnoData.cancha_id,
        horario_id: alumnoData.horario_id,
        profesor_asignado_id: alumnoData.profesor_asignado_id, // ✅ Guardar profesor asignado
        es_arquero: alumnoData.es_arquero || false,
        foto_url: fotoUrl,
        estado: 'Pendiente',
        escuela_id: escuelaId,
        created_by: user.id
    };

    const { data: alumno, error: insertError } = await supabase
        .from('alumnos')
        .insert([newAlumno])
        .select()
        .single();

    if (insertError) throw new Error('Error al guardar alumno: ' + insertError.message);

    // 5. Asignar Entrenador
    if (alumno && alumnoData.profesor_asignado_id) {
        const { error: assignError } = await supabase
            .from('alumnos_entrenadores')
            .insert([{
                alumno_id: alumno.id,
                entrenador_id: alumnoData.profesor_asignado_id // ✅ Usar el profesor asignado, no el creador
            }]);

        if (assignError) {
            console.error('Error al asignar entrenador:', assignError);
        }
    }

    return alumno;
};

/**
 * Obtiene los alumnos activos de la escuela, filtrados según el rol del usuario.
 * 
 * - Entrenador: solo ve alumnos asignados a él (via profesor_asignado_id)
 * - Entrenarqueros: solo ve alumnos marcados como arqueros
 * - Admin/Dueño/SuperAdmin: ve todos los alumnos de la escuela
 * 
 * Acepta filtros opcionales de canchas, horarios y subs (multi-selección).
 * 
 * @param {Object} filtros - Filtros opcionales
 * @param {string} filtros.userId - ID del usuario actual
 * @param {string} filtros.userRole - Rol del usuario ('Entrenador', 'Administrador', etc.)
 * @param {Array<string>} filtros.canchaIds - Filtrar por una o más canchas
 * @param {Array<string>} filtros.horarioIds - Filtrar por uno o más horarios
 * @param {Array<number>} filtros.subAnios - Filtrar por uno o más años (sub = año de nacimiento)
 */
export const getAlumnos = async (filtros = {}) => {
    const { userId, userRole, canchaIds = [], horarioIds = [], subAnios = [] } = filtros;

    // Regla #1: Autenticación obligatoria
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Query principal con JOINs (sin descargar arrays completos de asistencias)
    let query = supabase
        .from('alumnos')
        .select(`
            id,
            nombres,
            apellidos,
            fecha_nacimiento,
            foto_url,
            estado,
            es_arquero,
            profesor_asignado_id,
            cancha_id,
            horario_id,
            nombre_padre,
            telefono_padre,
            nombre_madre,
            telefono_madre,
            created_at,
            cancha:canchas(nombre),
            horario:horarios(hora),
            asistencias_normales(id, fecha, estado),
            asistencias_arqueros(id, fecha, estado)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    // Filtro por rol: Entrenador solo ve sus alumnos asignados
    if (userRole === 'Entrenador' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    }

    // Filtro por rol: Entrenarqueros solo ve arqueros
    if (userRole === 'Entrenarqueros') {
        query = query.eq('es_arquero', true);
    }

    // Filtros multi-selección de cancha desde el servidor
    if (canchaIds.length === 1) {
        query = query.eq('cancha_id', canchaIds[0]);
    } else if (canchaIds.length > 1) {
        query = query.in('cancha_id', canchaIds);
    }

    // Filtros multi-selección de horario desde el servidor
    if (horarioIds.length === 1) {
        query = query.eq('horario_id', horarioIds[0]);
    } else if (horarioIds.length > 1) {
        query = query.in('horario_id', horarioIds);
    }

    // Ordenamiento
    query = query.order('apellidos', { ascending: true });

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar alumnos:', error);
        throw new Error('No pudimos cargar los datos. Intenta nuevamente.');
    }

    // Calcular totales de asistencias del mes actual y aplicar filtro de sub
    const hoy = new Date();
    const anoActual = hoy.getFullYear();
    const mesActualStr = `${anoActual}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    let resultado = data.map(alumno => {
        const asisN = (alumno.asistencias_normales || []).filter(a =>
            a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
        ).length;
        const asisA = (alumno.asistencias_arqueros || []).filter(a =>
            a.fecha?.startsWith(mesActualStr) && (a.estado === 'Presente' || a.estado === 'Licencia')
        ).length;

        return {
            ...alumno,
            asistencias_count: asisN + asisA
        };
    });

    // Filtro de Sub (por año de nacimiento)
    if (subAnios.length > 0) {
        resultado = resultado.filter(alumno => {
            const anioNac = new Date(alumno.fecha_nacimiento).getUTCFullYear();
            const sub = anoActual - anioNac;
            return subAnios.includes(sub);
        });
    }

    return resultado;
};

// ============================================================================
// Archivo y Restauración de Alumnos
// ============================================================================

/**
 * Archivar un alumno (soft delete)
 * Regla #16: Datos históricos se preservan
 * Solo Admin/SuperAdmin pueden archivar
 */
export const archivarAlumno = async (alumnoId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const { data, error } = await supabase
        .from('alumnos')
        .update({ archivado: true })
        .eq('id', alumnoId)
        .select()
        .single();

    if (error) throw new Error('Error al archivar alumno: ' + error.message);
    return data;
};

/**
 * Restaurar un alumno archivado
 * Regla #16: Vuelve con el mismo estado que tenía antes
 */
export const restaurarAlumno = async (alumnoId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const { data, error } = await supabase
        .from('alumnos')
        .update({ archivado: false })
        .eq('id', alumnoId)
        .select()
        .single();

    if (error) throw new Error('Error al restaurar alumno: ' + error.message);
    return data;
};

/**
 * Aprobar un alumno
 * Regla: Cambia el estado de 'Pendiente' a 'Aprobado'
 * Solo Admin/SuperAdmin deberían realizar esta acción
 */
export const aprobarAlumno = async (alumnoId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const { data, error } = await supabase
        .from('alumnos')
        .update({ estado: 'Aprobado' })
        .eq('id', alumnoId)
        .select()
        .single();

    if (error) throw new Error('Error al aprobar alumno: ' + error.message);
    return data;
};

/**
 * Obtener alumnos archivados
 * Regla #16: Entrenadores ven solo sus alumnos archivados
 *            Admin/SuperAdmin ven todos los archivados de la escuela
 */
export const getAlumnosArchivados = async (userRol, userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    let query = supabase
        .from('alumnos')
        .select(`
            id,
            nombres,
            apellidos,
            fecha_nacimiento,
            foto_url,
            estado,
            es_arquero,
            cancha_id,
            horario_id,
            nombre_padre,
            telefono_padre,
            nombre_madre,
            telefono_madre,
            created_at,
            cancha:canchas(nombre),
            horario:horarios(hora),
            asistencias_normales(id),
            asistencias_arqueros(id)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', true)
        .neq('estado', 'ELIMINADO SISTEMA')
        .order('apellidos', { ascending: true });

    // Si es entrenador, solo ve sus alumnos archivados
    if (userRol === 'Entrenador') {
        query = query.eq('profesor_asignado_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar alumnos archivados:', error);
        throw new Error('No pudimos cargar los alumnos archivados.');
    }

    // Calcular totales de asistencias
    return data.map(alumno => ({
        ...alumno,
        asistencias_count: (alumno.asistencias_normales?.length || 0) +
            (alumno.asistencias_arqueros?.length || 0)
    }));
};

