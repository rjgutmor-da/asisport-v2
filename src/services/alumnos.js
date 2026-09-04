import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import { getDataScope } from '../config/roles';

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
            .limit(1);

        if (checkError) console.error('Error al verificar duplicados:', checkError);

        if (existing?.[0]) {
            throw new Error(`El carnet ${alumnoData.carnet_identidad} ya está registrado para el alumno: ${existing[0].nombres} ${existing[0].apellidos}.`);
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
        profesor_asignado_id: alumnoData.profesor_asignado_id || null,
        es_arquero: alumnoData.es_arquero || false,
        foto_url: fotoUrl,
        estado: 'Pendiente',
        escuela_id: escuelaId,
        created_by: user.id,
        tipo: alumnoData.tipo || 'Formativo',
        mensualidad: alumnoData.mensualidad !== undefined ? alumnoData.mensualidad : null,
        observaciones: alumnoData.observaciones || null
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
                entrenador_id: alumnoData.profesor_asignado_id
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
 * @param {{userId?: string, userRole?: string, canchaIds?: string[], horarioIds?: string[], subAnios?: number[], tipos?: string[]}} [filtros] - Filtros opcionales.
 */
export const getAlumnos = async (filtros = {}) => {
    const { userId, userRole, canchaIds = [], horarioIds = [], subAnios = [], tipos = [] } = filtros;
    const dataScope = getDataScope(userRole);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');

    const escuelaId = await obtenerEscuelaId();

    // Obtener perfil para sacar la sucursal
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single();

    // Query principal usando la vista v_alumnos para tener datos precalculados
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
            cancha_nombre,
            horario_hora
        `)
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    // Filtro de Sub (por categoría calculada en Supabase)
    if (subAnios.length > 0) {
        query = query.in('sub', subAnios);
    }

    // Filtro por sucursal (para roles con alcance de sucursal o arqueros)
    if (dataScope === 'branch' || dataScope === 'goalkeepers') {
        if (userProfile?.sucursal_id) {
            query = query.eq('sucursal_id', userProfile.sucursal_id);
        }
    }

    // Filtro por rol: Entrenador solo ve sus alumnos asignados
    if (dataScope === 'assigned_students' && userId) {
        query = query.eq('profesor_asignado_id', userId);
    }

    // Filtro por rol: Entrenarqueros solo ve arqueros
    if (dataScope === 'goalkeepers') {
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

    // Últimos inscritos primero. Los registros históricos sin fecha quedan al final.
    query = query
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar alumnos:', error);
        throw new Error('No pudimos cargar los datos. Intenta nuevamente.');
    }

    let resultado = data.map(alumno => {
        return {
            ...alumno,
            cancha: { nombre: alumno.cancha_nombre || '' },
            horario: { hora: alumno.horario_hora || '' },
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
            cancha_nombre,
            horario_hora
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
    const dataScope = getDataScope(userRole);
    if (dataScope === 'assigned_students' && userId) query = query.eq('profesor_asignado_id', userId);
    if (dataScope === 'goalkeepers') query = query.eq('es_arquero', true);
    if ((dataScope === 'branch' || dataScope === 'goalkeepers') && userProfile?.sucursal_id) {
        query = query.eq('sucursal_id', userProfile.sucursal_id);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    // Últimos inscritos primero. Los registros históricos sin fecha quedan al final.
    query = query
        .range(from, to)
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        alumnos: data.map(a => ({ 
            ...a, 
            cancha: { nombre: a.cancha_nombre || '' },
            horario: { hora: a.horario_hora || '' },
            asistencias_count: a.asistencias_mes_actual || 0 
        })),
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile } = user
        ? await supabase.from('usuarios').select('sucursal_id').eq('id', user.id).single()
        : { data: null };

    let query = supabase
        .from('v_alumnos')
        .select('id, nombres, apellidos, profesor_asignado_id, sub, horario_id, cancha_id, cancha_nombre, horario_hora, estado, es_arquero, tipo, carnet_identidad, colegio, direccion, foto_url, mensualidad, nombre_padre, nombre_madre, telefono_padre, telefono_madre, sucursal_id, terminos_busqueda')
        .eq('escuela_id', escuelaId)
        .eq('archivado', false)
        .neq('estado', 'ELIMINADO SISTEMA');

    const dataScope = getDataScope(userRole);
    if (dataScope === 'assigned_students' && userId) query = query.eq('profesor_asignado_id', userId);
    if (dataScope === 'goalkeepers') query = query.eq('es_arquero', true);
    if ((dataScope === 'branch' || dataScope === 'goalkeepers') && userProfile?.sucursal_id) query = query.eq('sucursal_id', userProfile.sucursal_id);

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
            cancha:grupos!alumnos_cancha_id_fkey1(nombre),
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
        const duplicadosEncontrados = posibles.map(alumno => {
            const alumnoNormalizado = normalize(`${alumno.nombres} ${alumno.apellidos}`);
            const palabrasAlumno = alumnoNormalizado.split(/\s+/);

            return {
                ...alumno,
                esCoincidenciaExacta: alumnoNormalizado === inputNormalizado,
                esCoincidenciaPosible: palabrasInput.some(palabra => palabrasAlumno.includes(palabra))
            };
        }).filter(alumno => alumno.esCoincidenciaPosible);

        return duplicadosEncontrados;
    } catch (error) {
        console.error("Error al buscar posibles duplicados:", error);
        return []; // En caso de error, permitimos continuar sin bloquear
    }
};

/**
 * Consulta la lista paginada de alumnos mediante la RPC optimizada rpc_listar_alumnos_asisport.
 *
 * @param {Object} [filtros={}] - Filtros de consulta.
 * @param {Array<string>} [filtros.canchaIds] - IDs de canchas/grupos.
 * @param {Array<string>} [filtros.horarioIds] - IDs de horarios.
 * @param {Array<string>} [filtros.entrenadorIds] - IDs de entrenadores.
 * @param {Array<number>} [filtros.subAnios] - Años/categorías Sub.
 * @param {Array<string>} [filtros.tipos] - Tipos formativos.
 * @param {string} [filtros.searchTerm] - Término de búsqueda (mínimo 2 caracteres).
 * @param {string} [filtros.activeFilter] - Estado: 'todos', 'activos', 'archivados', 'pendientes', 'arqueros'.
 * @param {number} [filtros.page=1] - Número de página.
 * @param {number} [filtros.limit=20] - Cantidad de registros por página.
 * @param {string|null} [filtros.sucursalId=null] - ID opcional de sucursal.
 * @param {Object} [options={}] - Opciones de la petición.
 * @param {AbortSignal} [options.signal] - Señal de cancelación de la petición.
 * @returns {Promise<{ items: Array, total_resultados: number, pagina: number, items_por_pagina: number, resumen: Object, facetas: Object }>}
 */
export const listarAlumnosAsisport = async (filtros = {}, options = {}) => {
    const payload = {
        pagina: filtros.page || 1,
        limite: filtros.limit || 30,
        estado_filtro: filtros.activeFilter || 'activos',
        termino_busqueda: filtros.searchTerm ? filtros.searchTerm.trim() : '',
        cancha_ids: filtros.canchaIds && filtros.canchaIds.length > 0 ? filtros.canchaIds : undefined,
        horario_ids: filtros.horarioIds && filtros.horarioIds.length > 0 ? filtros.horarioIds : undefined,
        entrenador_ids: filtros.entrenadorIds && filtros.entrenadorIds.length > 0 ? filtros.entrenadorIds : undefined,
        subs: filtros.subAnios && filtros.subAnios.length > 0 ? filtros.subAnios : undefined,
        tipos: filtros.tipos && filtros.tipos.length > 0 ? filtros.tipos : undefined,
        sucursal_id: filtros.sucursalId || undefined
    };

    let query = supabase.rpc('rpc_listar_alumnos_asisport', {
        p_filtros: payload
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al listar alumnos vía RPC:', error);
        throw new Error(error.message || 'Error al obtener el listado de alumnos.');
    }

    return data || {
        items: [],
        total_resultados: 0,
        pagina: payload.pagina,
        items_por_pagina: payload.limite,
        resumen: { total_activos: 0, total_pendientes: 0, total_archivados: 0, total_arqueros: 0 },
        facetas: { subs: [], tipos: [] }
    };
};

/**
 * Obtiene la matriz compacta de relaciones reales de la lista autorizada.
 * Se usa para que los filtros de entrenador, grupo, horario y categoría se
 * condicionen entre sí con el mismo universo que filtra la RPC principal.
 *
 * @param {Object} [filtros={}] - Contexto de la lista.
 * @param {string} [filtros.activeFilter='todos'] - Estado activo de la lista.
 * @param {Object} [options={}] - Opciones de la petición.
 * @param {AbortSignal} [options.signal] - Señal de cancelación.
 * @returns {Promise<Array<{entrenador_id: string|null, cancha_id: string|null, horario_id: string|null, sub: number|null}>>}
 */
export const obtenerOpcionesFiltrosAlumnosAsisport = async (filtros = {}, options = {}) => {
    let query = supabase.rpc('rpc_opciones_filtros_alumnos_asisport', {
        p_estado_filtro: filtros.activeFilter || 'todos'
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener opciones inteligentes de alumnos:', error);
        throw new Error(error.message || 'Error al obtener las opciones de filtros.');
    }

    return data || [];
};
/**
 * Sugerencias ultrarrápidas de hasta 10 alumnos para selectores compactos.
 *
 * @param {string} termino - Término de búsqueda (mínimo 2 caracteres).
 * @param {Object} [filtros={}] - Filtros contextuales adicionales.
 * @param {Object} [options={}] - Opciones de la petición.
 * @param {AbortSignal} [options.signal] - Señal de cancelación.
 * @returns {Promise<Array>} - Lista de hasta 10 coincidencias.
 */
export const sugerirAlumnosAsisport = async (termino, filtros = {}, options = {}) => {
    if (!termino || termino.trim().length < 2) {
        return [];
    }

    const payload = {
        cancha_ids: filtros.canchaIds && filtros.canchaIds.length > 0 ? filtros.canchaIds : undefined,
        horario_ids: filtros.horarioIds && filtros.horarioIds.length > 0 ? filtros.horarioIds : undefined,
        entrenador_ids: filtros.entrenadorIds && filtros.entrenadorIds.length > 0 ? filtros.entrenadorIds : undefined
    };

    let query = supabase.rpc('rpc_sugerir_alumnos_asisport', {
        p_termino: termino.trim(),
        p_limite: 10,
        p_filtros: payload
    });

    if (options.signal) {
        query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al sugerir alumnos vía RPC:', error);
        return [];
    }

    return data || [];
};

