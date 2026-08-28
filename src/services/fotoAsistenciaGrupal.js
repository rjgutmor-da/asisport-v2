import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';
import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen para foto grupal de asistencia.
 * Target: máximo 300 KB, resolución máxima 1280px.
 * Usa dos pases de compresión si es necesario.
 * @param {File} file - Archivo de imagen original
 * @returns {Promise<File>} Archivo comprimido en formato JPEG
 */
export const comprimirFotoGrupal = async (file) => {
    const TARGET_BYTES = 300 * 1024; // 300 KB

    // Si ya es menor a 300 KB, solo redimensionar si excede 1280px
    if (file.size <= TARGET_BYTES) {
        const opciones = {
            maxSizeMB: 0.29,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
            fileType: 'image/jpeg',
        };
        const comprimido = await imageCompression(file, opciones);
        return new File([comprimido], `foto_grupal_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });
    }

    // Primer pase: ~280 KB, 1280px máximo
    const opcionesPase1 = {
        maxSizeMB: 0.28,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/jpeg',
    };

    let archivoComprimido = await imageCompression(file, opcionesPase1);

    // Segundo pase si aún supera los 300 KB
    if (archivoComprimido.size > TARGET_BYTES) {
        const opcionesPase2 = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
            fileType: 'image/jpeg',
        };
        archivoComprimido = await imageCompression(archivoComprimido, opcionesPase2);
    }

    return new File([archivoComprimido], `foto_grupal_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
};

/**
 * Sube una foto grupal de asistencia a Supabase Storage y guarda la referencia en BD.
 * @param {File} file - Archivo de imagen (será comprimido automáticamente)
 * @param {Object} metadata - Datos asociados a la foto
 * @param {string} metadata.fecha - Fecha de la asistencia (YYYY-MM-DD)
 * @param {string|null} metadata.canchaId - ID de la cancha/grupo
 * @param {string|null} metadata.horarioId - ID del horario
 * @returns {Promise<string>} URL pública de la foto subida
 */
export const subirFotoAsistenciaGrupal = async (file, { fecha, canchaId, horarioId }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada.');

    const escuelaId = await obtenerEscuelaId();

    // 0. Consultar si ya existe una foto para este grupo, horario y fecha
    const fotoExistente = await obtenerFotoAsistenciaGrupal(fecha, canchaId, horarioId);

    // 1. Comprimir la foto
    const fotoComprimida = await comprimirFotoGrupal(file);
    console.log(`📸 Foto grupal comprimida: ${(fotoComprimida.size / 1024).toFixed(1)} KB`);

    // 2. Generar ruta única en el bucket
    const timestamp = Date.now();
    const aleatorio = Math.random().toString(36).substring(2, 8);
    const rutaArchivo = `${escuelaId}/${fecha}/${timestamp}_${aleatorio}.jpg`;

    // 3. Subir al bucket 'fotos-asistencias'
    const { error: errorSubida } = await supabase.storage
        .from('fotos-asistencias')
        .upload(rutaArchivo, fotoComprimida, {
            cacheControl: '86400',
            upsert: false,
        });

    if (errorSubida) {
        console.error('[Error] Fallo al subir foto grupal:', errorSubida);
        throw new Error('Error al subir la foto grupal: ' + errorSubida.message);
    }

    // 4. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('fotos-asistencias')
        .getPublicUrl(rutaArchivo);

    if (fotoExistente) {
        // 5a. Actualizar referencia en la tabla
        const { error: errorUpdate } = await supabase
            .from('fotos_asistencia_grupal')
            .update({
                foto_url: publicUrl,
            })
            .eq('id', fotoExistente.id);

        if (errorUpdate) {
            console.error('[Error] Fallo al actualizar referencia de foto grupal:', errorUpdate);
            // Intentar limpiar el archivo subido para no dejar basura
            await supabase.storage.from('fotos-asistencias').remove([rutaArchivo]);
            throw new Error('Error al actualizar el registro de la foto grupal: ' + errorUpdate.message);
        }

        // 6a. Eliminar el archivo antiguo de Storage para evitar basura
        const rutaVieja = fotoExistente.foto_url.split('/public/fotos-asistencias/')[1];
        if (rutaVieja) {
            const { error: errorRemove } = await supabase.storage
                .from('fotos-asistencias')
                .remove([rutaVieja]);
            if (errorRemove) {
                console.warn('[Advertencia] No se pudo eliminar la foto antigua del Storage:', errorRemove);
            } else {
                console.log('🗑️ Foto antigua eliminada de Storage con éxito:', rutaVieja);
            }
        }
    } else {
        // 5b. Guardar nueva referencia en la tabla
        const { error: errorInsert } = await supabase
            .from('fotos_asistencia_grupal')
            .insert({
                escuela_id: escuelaId,
                fecha,
                cancha_id: canchaId || null,
                horario_id: horarioId || null,
                entrenador_id: user.id,
                foto_url: publicUrl,
            });

        if (errorInsert) {
            console.error('[Error] Fallo al guardar referencia de foto grupal:', errorInsert);
            // Intentar limpiar el archivo subido para no dejar basura
            await supabase.storage.from('fotos-asistencias').remove([rutaArchivo]);
            throw new Error('Error al registrar la foto grupal: ' + errorInsert.message);
        }
    }

    return publicUrl;
};

/**
 * Consulta si ya existe una foto grupal para una fecha/cancha/horario específicos.
 * Útil para mostrar la foto existente si el entrenador vuelve a la página.
 * @param {string} fecha - Fecha (YYYY-MM-DD)
 * @param {string|null} canchaId - ID de la cancha
 * @param {string|null} horarioId - ID del horario
 * @returns {Promise<Object|null>} Registro de foto o null
 */
export const obtenerFotoAsistenciaGrupal = async (fecha, canchaId, horarioId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const escuelaId = await obtenerEscuelaId();

    let query = supabase
        .from('fotos_asistencia_grupal')
        .select('id, foto_url, created_at')
        .eq('escuela_id', escuelaId)
        .eq('fecha', fecha)
        .eq('entrenador_id', user.id);

    if (canchaId) query = query.eq('cancha_id', canchaId);
    if (horarioId) query = query.eq('horario_id', horarioId);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
        console.error('[Error] Fallo al consultar foto grupal:', error);
        return null;
    }

    return data;
};
