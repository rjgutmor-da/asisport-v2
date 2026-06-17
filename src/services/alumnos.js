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

    // Obtener usuario actual (Entrenador o Admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Obtener sucursal_id del usuario actual
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single();

    // 2. Validación de duplicados (Carnet de Identidad)
    if (alumnoData.carnet_identidad) {
        const { data: existing, error: checkError } = await supabase
            .from('alumnos')
            .select('id, nombres, apellidos')
            .eq('carnet_identidad', alumnoData.carnet_identidad)
            .eq('escuela_id', escuelaId)
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
            .upload(filePath, photoFile, {
                cacheControl: '86400',
                upsert: false
            });

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
        whatsapp_preferido: alumnoData.whatsapp_preferido || 'padre',
        telefono_deportista: formatPhone(alumnoData.telefono_deportista),
        colegio: alumnoData.colegio || null,
        direccion: alumnoData.direccion || null,
        sucursal_id: alumnoData.sucursal_id || userProfile?.sucursal_id || null,
        cancha_id: alumnoData.cancha_id,
        horario_id: alumnoData.horario_id,
        profesor_asignado_id: alumnoData.profesor_asignado_id || null, // ✅ Guardar profesor asignado
        es_arquero: alumnoData.es_arquero || false,
        foto_url: fotoUrl,
        estado: 'Activo',
        escuela_id: escuelaId,
        created_by: user.id,
        tipo: alumnoData.tipo || 'Formativo',
        mensualidad: alumnoData.mensualidad !== undefined ? alumnoData.mensualidad : null
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
    const { userId, userRole, canchaIds = [], horarioIds = [], subAnios = [], tipos = [] } = filtros;

    // Regla #1: Autenticación obligatoria
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Obtener perfil para sacar la sucursal
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single();

    // Query principal con JOINs usando la vista v_alumnos para tener el dato 'sub' precalculado
    let query = supabase
        .from('v_alumnos')
        .select(`
            id,
            nombres,
            apellidos,
            fecha_nacimiento,
            carnet_identidad,
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
            telefono_deportista,
            whatsapp_preferido,
            created_at,
            sub,
            asistencias_mes_actual,
            asistencias_mes_anterior,
            tipo,
            mensualidad,
            cancha:canchas(nombre),
            horario:horarios(hora)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    // Filtro de Sub (por categoría calculada en Supabase)
    if (subAnios.length > 0) {
        query = query.in('sub', subAnios);
    }

    // Filtro por sucursal (para Administradores y Entrenadores)
    if (userRole !== 'SuperAdministrador') {
        if (userProfile?.sucursal_id) {
            query = query.eq('sucursal_id', userProfile.sucursal_id);
        }
    }

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

    // Filtros multi-selección de tipo
    if (tipos.length === 1) {
        query = query.eq('tipo', tipos[0]);
    } else if (tipos.length > 1) {
        query = query.in('tipo', tipos);
    }

    // Ordenamiento
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar alumnos:', error);
        throw new Error('No pudimos cargar los datos. Intenta nuevamente.');
    }

    let resultado = data.map(alumno => {
        return {
            ...alumno,
            asistencias_count: alumno.asistencias_mes_actual || 0
        };
    });

    return resultado;
};

/**
 * Obtiene los alumnos con filtrado en el servidor y paginación.
 */
export const getAlumnosPaginados = async (filtros = {}) => {
    const { 
        userId, 
        userRole, 
        canchaIds = [], 
        horarioIds = [], 
        subAnios = [], 
        entrenadorIds = [],
        tipos = [],
        searchTerm = '',
        activeFilter = 'todos',
        page = 1,
        limit = 20
    } = filtros;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada.');

    const escuelaId = await obtenerEscuelaId();

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single();

    let query = supabase
        .from('v_alumnos')
        .select(`
            id, nombres, apellidos, fecha_nacimiento, carnet_identidad, foto_url,
            estado, es_arquero, profesor_asignado_id, cancha_id, horario_id,
            nombre_padre, telefono_padre, nombre_madre, telefono_madre,
            telefono_deportista, whatsapp_preferido, created_at, sub,
            asistencias_mes_actual, asistencias_mes_anterior, tipo, mensualidad,
            colegio, direccion, sucursal_id,
            cancha:canchas(nombre),
            horario:horarios(hora)
        `, { count: 'exact' })
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    // Filtros de búsqueda (Nombre o Teléfono)
    if (searchTerm.trim()) {
        const normalize = (str) => {
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
                .trim();
        };
        const search = `%${normalize(searchTerm)}%`;
        query = query.ilike('terminos_busqueda', search);
    }

    // Filtro por estado / completitud
    if (activeFilter === 'pendientes') {
        // Filtro dinámico: buscar alumnos con información incompleta
        // Se buscan alumnos donde algún campo obligatorio sea NULL o vacío.
        // Para representantes: es incompleto si AMBOS nombres están vacíos
        // o si AMBOS teléfonos están vacíos.
        query = query.or(
            'carnet_identidad.is.null,carnet_identidad.eq.,' +
            'colegio.is.null,colegio.eq.,' +
            'direccion.is.null,direccion.eq.,' +
            'foto_url.is.null,foto_url.eq.,' +
            'tipo.is.null,tipo.eq.,' +
            'mensualidad.is.null,' +
            'cancha_id.is.null,' +
            'horario_id.is.null,' +
            'profesor_asignado_id.is.null,' +
            'sucursal_id.is.null,' +
            'and(or(nombre_padre.is.null,nombre_padre.eq.),or(nombre_madre.is.null,nombre_madre.eq.)),' +
            'and(or(telefono_padre.is.null,telefono_padre.eq.),or(telefono_madre.is.null,telefono_madre.eq.))'
        );
    } else if (activeFilter === 'arqueros') {
        query = query.eq('es_arquero', true);
    }

    // Filtros de Maestros
    if (entrenadorIds.length > 0) query = query.in('profesor_asignado_id', entrenadorIds);
    if (subAnios.length > 0) query = query.in('sub', subAnios);
    if (canchaIds.length > 0) query = query.in('cancha_id', canchaIds);
    if (horarioIds.length > 0) query = query.in('horario_id', horarioIds);
    if (tipos.length > 0) query = query.in('tipo', tipos);

    // Restricciones de Rol
    if (userRole === 'Entrenador' && userId) query = query.eq('profesor_asignado_id', userId);
    if (userRole === 'Entrenarqueros') query = query.eq('es_arquero', true);
    if (userRole !== 'SuperAdministrador' && userProfile?.sucursal_id) {
        query = query.eq('sucursal_id', userProfile.sucursal_id);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        alumnos: data.map(a => ({ ...a, asistencias_count: a.asistencias_mes_actual || 0 })),
        totalCount: count || 0
    };
};

/**
 * Obtiene solo los campos necesarios para calcular los "Smart Filters" (facets)
 * de forma eficiente sin descargar toda la data.
 */
export const getAlumnosFacets = async (filtros = {}) => {
    const { userId, userRole } = filtros;
    const escuelaId = await obtenerEscuelaId();

    let query = supabase
        .from('v_alumnos')
        .select('id, nombres, apellidos, profesor_asignado_id, sub, horario_id, cancha_id, estado, es_arquero, tipo, carnet_identidad, colegio, direccion, foto_url, mensualidad, nombre_padre, nombre_madre, telefono_padre, telefono_madre, sucursal_id')
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (userRole === 'Entrenador' && userId) query = query.eq('profesor_asignado_id', userId);
    if (userRole === 'Entrenarqueros') query = query.eq('es_arquero', true);

    const { data, error } = await query;
    if (error) throw error;
    return data;
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

// La función aprobarAlumno fue eliminada.
// El estado de completitud ahora se calcula dinámicamente
// según los campos faltantes del alumno (ver alumnoCompletitud.js).

/**
 * Obtener alumnos archivados
 * Regla #16: Entrenadores ven solo sus alumnos archivados
 *            Admin/SuperAdmin ven todos los archivados de la escuela
 */
export const getAlumnosArchivados = async (userRol, userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single();

    let query = supabase
        .from('alumnos')
        .select(`
            id,
            nombres,
            apellidos,
            fecha_nacimiento,
            carnet_identidad,
            foto_url,
            estado,
            es_arquero,
            cancha_id,
            horario_id,
            nombre_padre,
            telefono_padre,
            nombre_madre,
            telefono_madre,
            whatsapp_preferido,
            created_at,
            cancha:canchas(nombre),
            horario:horarios(hora),
            asistencias_normales(count),
            asistencias_arqueros(count)
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', true)
        .neq('estado', 'ELIMINADO SISTEMA');

    if (userRol !== 'SuperAdministrador') {
        if (userProfile?.sucursal_id) {
            query = query.eq('sucursal_id', userProfile.sucursal_id);
        }
    }

    query = query.order('nombres', { ascending: true }).order('apellidos', { ascending: true });

    // Si es entrenador, solo ve sus alumnos archivados
    if (userRol === 'Entrenador') {
        query = query.eq('profesor_asignado_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar alumnos archivados:', error);
        throw new Error('No pudimos cargar los alumnos archivados.');
    }

    // Calcular totales de asistencias usando count (sin descargar IDs completos)
    return data.map(alumno => {
        const countN = alumno.asistencias_normales?.[0]?.count || 0;
        const countA = alumno.asistencias_arqueros?.[0]?.count || 0;
        return {
            ...alumno,
            asistencias_count: countN + countA
        };
    });
};

/**
 * Verifica si existen alumnos con la misma fecha de nacimiento y similitud en nombres/apellidos
 * @param {string} nombres - Nombres del nuevo alumno
 * @param {string} apellidos - Apellidos del nuevo alumno
 * @param {string} fechaNacimiento - Fecha de nacimiento (YYYY-MM-DD)
 * @returns {Promise<Array>} - Lista de posibles duplicados encontrados
 */
export const checkPosiblesDuplicados = async (nombres, apellidos, fechaNacimiento) => {
    try {
        const escuelaId = await obtenerEscuelaId();

        // 1. Buscar todos los alumnos activos en la escuela con la misma fecha de nacimiento
        const { data: posibles, error } = await supabase
            .from('alumnos')
            .select('id, nombres, apellidos, fecha_nacimiento')
            .eq('escuela_id', escuelaId)
            .eq('fecha_nacimiento', fechaNacimiento)
            .neq('estado', 'ELIMINADO SISTEMA');

        if (error) throw error;
        if (!posibles || posibles.length === 0) return [];

        // 2. Normalizar el texto ingresado
        const normalize = (str) => {
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
                .trim();
        };

        const inputNormalizado = normalize(`${nombres} ${apellidos}`);
        const palabrasInput = inputNormalizado.split(/\s+/).filter(p => p.length > 2); // Solo palabras de +2 letras

        // 3. Filtrar aquellos que tengan coincidencia de palabras
        const duplicadosEncontrados = posibles.filter(alumno => {
            const alumnoNormalizado = normalize(`${alumno.nombres} ${alumno.apellidos}`);
            const palabrasAlumno = alumnoNormalizado.split(/\s+/);

            // Verifica si alguna palabra significativa del input está en el nombre del alumno existente
            return palabrasInput.some(palabra => palabrasAlumno.includes(palabra));
        });

        return duplicadosEncontrados;
    } catch (error) {
        console.error("Error al buscar posibles duplicados:", error);
        return []; // En caso de error, permitimos continuar sin bloquear
    }
};

