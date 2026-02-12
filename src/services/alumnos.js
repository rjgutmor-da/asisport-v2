import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

// Validar foto (máx 100 KB)
export const validatePhoto = (file) => {
    return new Promise((resolve) => {
        if (!file) {
            resolve({ valid: true });
            return;
        }

        const MAX_SIZE = 100 * 1024; // 100 KB
        if (file.size > MAX_SIZE) {
            resolve({ valid: false, error: 'La foto es demasiado pesada. Máximo 100 KB.' });
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
 * Obtiene todos los alumnos activos de la escuela
 * Incluye JOIN con canchas, horarios
 * Cuenta asistencias y entrenadores
 * Regla #14: Entrenadores pueden ver todos los alumnos de su escuela (solo lectura)
 */
export const getAlumnos = async () => {
    // Regla #1: Autenticación obligatoria
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Query con JOINs y conteos
    const { data, error } = await supabase
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
            asistencias_normales(id),
            asistencias_arqueros(id),
            alumnos_entrenadores(entrenador_id)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .order('apellidos', { ascending: true });

    if (error) {
        console.error('Error al cargar alumnos:', error);
        throw new Error('No pudimos cargar los datos. Intenta nuevamente.');
    }

    // Calcular totales de asistencias y entrenadores
    return data.map(alumno => ({
        ...alumno,
        asistencias_count: (alumno.asistencias_normales?.length || 0) +
            (alumno.asistencias_arqueros?.length || 0),
        entrenadores_count: alumno.alumnos_entrenadores?.length || 0
    }));
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
            asistencias_arqueros(id),
            alumnos_entrenadores(entrenador_id)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', true)
        .order('apellidos', { ascending: true });

    // Si es entrenador, solo ve sus alumnos archivados
    if (userRol === 'Entrenador') {
        // Obtener los alumnos del entrenador usando la tabla de relación
        const { data: asignaciones, error: assignError } = await supabase
            .from('alumnos_entrenadores')
            .select('alumno_id')
            .eq('entrenador_id', userId);

        if (assignError) throw new Error('Error al verificar asignaciones');

        const alumnoIds = asignaciones.map(a => a.alumno_id);
        if (alumnoIds.length === 0) {
            return []; // No tiene alumnos archivados
        }

        query = query.in('id', alumnoIds);
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
            (alumno.asistencias_arqueros?.length || 0),
        entrenadores_count: alumno.alumnos_entrenadores?.length || 0
    }));
};

