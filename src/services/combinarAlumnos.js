import { supabase } from '../lib/supabaseClient';

/**
 * Servicio para combinar (fusionar) dos alumnos duplicados.
 *
 * Lógica de fusión:
 *  - El alumno DESTINO tiene prioridad: sus datos no se sobreescriben.
 *  - Del alumno ORIGEN solo se toman los campos que estén vacíos en el destino.
 *  - Las asistencias del origen se migran al destino SOLO donde el destino
 *    no tenga registro para esa fecha (el destino tiene prevalencia).
 *  - Las asistencias del origen que coincidan en fecha con el destino se eliminan.
 *  - Las relaciones con entrenadores se unifican (sin duplicar).
 *  - Se intenta eliminar el alumno origen de la BD; si no es posible
 *    (por constraints), se marca con estado 'Eliminado' y se archiva.
 *
 * @param {string} destinoId - ID del alumno que conservaremos (prioridad)
 * @param {string} origenId - ID del alumno que se fusionará y eliminará/archivará
 * @returns {Object} Alumno destino actualizado
 */
export const combinarAlumnos = async (destinoId, origenId) => {
    if (!destinoId || !origenId) {
        throw new Error('Debes seleccionar ambos alumnos para combinar.');
    }
    if (destinoId === origenId) {
        throw new Error('No puedes combinar un alumno consigo mismo.');
    }

    // 1. Verificar sesión activa
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada. Inicia sesión nuevamente.');

    // 2. Obtener datos completos de ambos alumnos
    const { data: destino, error: errDestino } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', destinoId)
        .single();

    if (errDestino) throw new Error('Error al obtener alumno destino: ' + errDestino.message);

    const { data: origen, error: errOrigen } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', origenId)
        .single();

    if (errOrigen) throw new Error('Error al obtener alumno origen: ' + errOrigen.message);

    // 3. Fusionar datos: el destino tiene prioridad, solo rellenamos campos vacíos
    const camposTexto = [
        'nombres', 'apellidos', 'fecha_nacimiento', 'carnet_identidad',
        'nombre_padre', 'telefono_padre', 'nombre_madre', 'telefono_madre',
        'telefono_deportista', 'colegio', 'direccion', 'foto_url'
    ];

    const datosActualizados = {};
    for (const campo of camposTexto) {
        // Si el destino no tiene valor pero el origen sí, tomamos el del origen
        if (!destino[campo] && origen[campo]) {
            datosActualizados[campo] = origen[campo];
        }
    }

    // Campos especiales: cancha_id, horario_id, profesor_asignado_id
    // Solo rellenar si el destino no los tiene
    if (!destino.cancha_id && origen.cancha_id) {
        datosActualizados.cancha_id = origen.cancha_id;
    }
    if (!destino.horario_id && origen.horario_id) {
        datosActualizados.horario_id = origen.horario_id;
    }
    if (!destino.profesor_asignado_id && origen.profesor_asignado_id) {
        datosActualizados.profesor_asignado_id = origen.profesor_asignado_id;
    }

    // Si el origen es arquero y el destino no, marcar como arquero
    if (origen.es_arquero && !destino.es_arquero) {
        datosActualizados.es_arquero = true;
    }

    // 4. Actualizar los datos del alumno destino (solo los campos que cambian)
    if (Object.keys(datosActualizados).length > 0) {
        const { error: updateError } = await supabase
            .from('alumnos')
            .update(datosActualizados)
            .eq('id', destinoId);

        if (updateError) {
            throw new Error('Error al actualizar datos del alumno destino: ' + updateError.message);
        }
    }

    // 5. Migrar asistencias normales del origen al destino (solo donde el destino NO tiene registro)
    // Obtener todas las asistencias de ambos alumnos
    const { data: asistenciasOrigen } = await supabase
        .from('asistencias_normales')
        .select('id, fecha')
        .eq('alumno_id', origenId);

    const { data: asistenciasDestino } = await supabase
        .from('asistencias_normales')
        .select('id, fecha')
        .eq('alumno_id', destinoId);

    // Crear set de fechas que ya tiene el destino
    const fechasDestinoSet = new Set((asistenciasDestino || []).map(a => a.fecha));

    // Filtrar asistencias del origen que se pueden migrar (fechas que NO están en el destino)
    const asistenciasMigrables = (asistenciasOrigen || []).filter(a => !fechasDestinoSet.has(a.fecha));
    const asistenciasDescartables = (asistenciasOrigen || []).filter(a => fechasDestinoSet.has(a.fecha));

    // Migrar las asistencias que no generan conflicto
    if (asistenciasMigrables.length > 0) {
        const idsMigrables = asistenciasMigrables.map(a => a.id);
        const { error: errMigrar } = await supabase
            .from('asistencias_normales')
            .update({ alumno_id: destinoId })
            .in('id', idsMigrables);

        if (errMigrar) {
            console.error('Error al migrar asistencias normales:', errMigrar);
        }
    }

    // Eliminar las asistencias del origen que ya existen en el destino (el destino tiene prevalencia)
    if (asistenciasDescartables.length > 0) {
        const idsDescartables = asistenciasDescartables.map(a => a.id);
        const { error: errEliminar } = await supabase
            .from('asistencias_normales')
            .delete()
            .in('id', idsDescartables);

        if (errEliminar) {
            console.error('Error al eliminar asistencias duplicadas del origen:', errEliminar);
        }
    }

    // 6. Migrar asistencias de arqueros del origen al destino (misma lógica)
    const { data: asistArqOrigen } = await supabase
        .from('asistencias_arqueros')
        .select('id, fecha')
        .eq('alumno_id', origenId);

    const { data: asistArqDestino } = await supabase
        .from('asistencias_arqueros')
        .select('id, fecha')
        .eq('alumno_id', destinoId);

    const fechasArqDestinoSet = new Set((asistArqDestino || []).map(a => a.fecha));
    const arqMigrables = (asistArqOrigen || []).filter(a => !fechasArqDestinoSet.has(a.fecha));
    const arqDescartables = (asistArqOrigen || []).filter(a => fechasArqDestinoSet.has(a.fecha));

    if (arqMigrables.length > 0) {
        const { error: errMigrarArq } = await supabase
            .from('asistencias_arqueros')
            .update({ alumno_id: destinoId })
            .in('id', arqMigrables.map(a => a.id));

        if (errMigrarArq) {
            console.error('Error al migrar asistencias de arqueros:', errMigrarArq);
        }
    }

    if (arqDescartables.length > 0) {
        const { error: errEliminarArq } = await supabase
            .from('asistencias_arqueros')
            .delete()
            .in('id', arqDescartables.map(a => a.id));

        if (errEliminarArq) {
            console.error('Error al eliminar asistencias de arqueros duplicadas:', errEliminarArq);
        }
    }

    // 7. Migrar relaciones con entrenadores (evitando duplicados)
    // Obtener entrenadores actuales del destino
    const { data: entrenadoresDestino } = await supabase
        .from('alumnos_entrenadores')
        .select('entrenador_id')
        .eq('alumno_id', destinoId);

    const idsDestinoSet = new Set((entrenadoresDestino || []).map(e => e.entrenador_id));

    // Obtener entrenadores del origen
    const { data: entrenadoresOrigen } = await supabase
        .from('alumnos_entrenadores')
        .select('entrenador_id')
        .eq('alumno_id', origenId);

    // Solo agregar los que no estén ya en el destino
    const nuevosEntrenadores = (entrenadoresOrigen || [])
        .filter(e => !idsDestinoSet.has(e.entrenador_id))
        .map(e => ({
            alumno_id: destinoId,
            entrenador_id: e.entrenador_id
        }));

    if (nuevosEntrenadores.length > 0) {
        const { error: errInsertEnt } = await supabase
            .from('alumnos_entrenadores')
            .insert(nuevosEntrenadores);

        if (errInsertEnt) {
            console.error('Error al migrar entrenadores:', errInsertEnt);
        }
    }

    // 8. Eliminar relaciones de entrenadores del origen (ya migradas)
    await supabase
        .from('alumnos_entrenadores')
        .delete()
        .eq('alumno_id', origenId);

    // 9. Archivar el alumno origen directamente (más seguro que intentar eliminar)
    const { error: errArchivar } = await supabase
        .from('alumnos')
        .update({ archivado: true, estado: 'Fusionado' })
        .eq('id', origenId);

    if (errArchivar) {
        throw new Error('Error al archivar alumno duplicado: ' + errArchivar.message);
    }

    // 10. Retornar los datos actualizados del alumno destino
    const { data: resultado, error: errResultado } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', destinoId)
        .single();

    if (errResultado) {
        throw new Error('Error al obtener resultado final: ' + errResultado.message);
    }

    return resultado;
};
