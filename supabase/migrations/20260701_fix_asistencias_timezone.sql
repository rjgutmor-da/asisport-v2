-- Migración: Corrección de Zona Horaria en Vistas de Alumnos y Asistencias
-- Descripción: Redefine v_alumnos y v_alumnos_deuda para que calculen asistencias_mes_actual y asistencias_mes_anterior usando la hora local de la escuela.

-- 1. Redefinir vista v_alumnos
CREATE OR REPLACE VIEW v_alumnos AS
 WITH attendance_counts AS (
         SELECT all_asistencias.alumno_id,
            count(*) FILTER (WHERE (date_trunc('month'::text, (all_asistencias.fecha)::timestamp with time zone) = date_trunc('month'::text, ((timezone(COALESCE(e.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date))::timestamp with time zone))) AS actual,
            count(*) FILTER (WHERE (date_trunc('month'::text, (all_asistencias.fecha)::timestamp with time zone) = date_trunc('month'::text, (((timezone(COALESCE(e.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date))::timestamp with time zone - '1 mon'::interval)))) AS anterior
           FROM ( SELECT asistencias_normales.alumno_id,
                    asistencias_normales.fecha,
                    asistencias_normales.estado
                   FROM asistencias_normales
                UNION ALL
                 SELECT asistencias_arqueros.alumno_id,
                    asistencias_arqueros.fecha,
                    asistencias_arqueros.estado
                   FROM asistencias_arqueros) all_asistencias
             JOIN alumnos a_int ON a_int.id = all_asistencias.alumno_id
             LEFT JOIN escuelas e ON e.id = a_int.escuela_id
          WHERE ((all_asistencias.estado)::text = 'Presente'::text)
          GROUP BY all_asistencias.alumno_id
        )
 SELECT a.id,
    a.escuela_id,
    a.nombres,
    a.apellidos,
    a.fecha_nacimiento,
    a.carnet_identidad,
    a.nombre_padre,
    a.telefono_padre,
    a.nombre_madre,
    a.telefono_madre,
    a.telefono_deportista,
    a.colegio,
    a.direccion,
    a.cancha_id,
    a.horario_id,
    a.es_arquero,
    a.foto_url,
    a.estado,
    a.archivado,
    a.archivado_at,
    a.created_at,
    a.updated_at,
    a.created_by,
    a.profesor_asignado_id,
    a.sucursal_id,
    a.whatsapp_preferido,
    a.meses_permanencia_inicial,
    a.ingresos_iniciales,
    a.fecha_inicio,
    a.terminos_busqueda,
    ((EXTRACT(year FROM (timezone(COALESCE(e.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date)))::integer - (EXTRACT(year FROM a.fecha_nacimiento))::integer) AS sub,
    COALESCE(ac.actual, (0)::bigint) AS asistencias_mes_actual,
    COALESCE(ac.anterior, (0)::bigint) AS asistencias_mes_anterior,
    a.tipo,
    a.mensualidad
   FROM ((alumnos a
     LEFT JOIN attendance_counts ac ON ((a.id = ac.alumno_id)))
     LEFT JOIN escuelas e ON ((e.id = a.escuela_id)));

-- 2. Redefinir vista v_alumnos_deuda
CREATE OR REPLACE VIEW v_alumnos_deuda AS
 WITH asistencias_mes AS (
         SELECT combined.alumno_id,
            count(*) FILTER (WHERE (((combined.estado)::text = 'Presente'::text) AND (date_trunc('month'::text, (combined.fecha)::timestamp with time zone) = date_trunc('month'::text, ((timezone(COALESCE(e.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date))::timestamp with time zone)))) AS asistencias_actual,
            count(*) FILTER (WHERE (((combined.estado)::text = 'Presente'::text) AND (date_trunc('month'::text, (combined.fecha)::timestamp with time zone) = date_trunc('month'::text, (((timezone(COALESCE(e.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date))::timestamp with time zone - '1 mon'::interval))))) AS asistencias_anterior
           FROM ( SELECT asistencias_normales.alumno_id,
                    asistencias_normales.fecha,
                    asistencias_normales.estado
                   FROM asistencias_normales
                UNION ALL
                 SELECT asistencias_arqueros.alumno_id,
                    asistencias_arqueros.fecha,
                    asistencias_arqueros.estado
                   FROM asistencias_arqueros) combined
             JOIN alumnos a_int ON a_int.id = combined.alumno_id
             LEFT JOIN escuelas e ON e.id = a_int.escuela_id
          GROUP BY combined.alumno_id
        ), meses_stats AS (
         SELECT cc_1.alumno_id,
            min(cc_1.fecha_emision) AS primera_fecha_saasport,
            count(DISTINCT m.mes) AS meses_saasport
           FROM (((cuentas_cobrar cc_1
             JOIN cxc_detalle cd ON ((cc_1.id = cd.cuenta_cobrar_id)))
             JOIN catalogo_items ci ON ((cd.catalogo_item_id = ci.id)))
             CROSS JOIN LATERAL jsonb_array_elements_text(cd.periodo_meses) m(mes))
          WHERE ((cc_1.anulada IS NOT TRUE) AND ((ci.nombre)::text ~~* '%mensualidad%'::text))
          GROUP BY cc_1.alumno_id
        ), ultima_mens_stats AS (
         SELECT DISTINCT ON (cc_1.alumno_id) cc_1.alumno_id,
            (cd.periodo_meses ->> '-1'::integer) AS ultima_mensualidad
           FROM ((cuentas_cobrar cc_1
             JOIN cxc_detalle cd ON ((cc_1.id = cd.cuenta_cobrar_id)))
             JOIN catalogo_items ci ON ((cd.catalogo_item_id = ci.id)))
          WHERE ((cc_1.anulada IS NOT TRUE) AND ((ci.nombre)::text ~~* '%mensualidad%'::text))
          ORDER BY cc_1.alumno_id, cc_1.fecha_emision DESC, cd.id DESC
        )
 SELECT a.id AS alumno_id,
    a.escuela_id,
    a.nombres,
    a.apellidos,
    a.fecha_nacimiento,
    a.sucursal_id,
    a.cancha_id,
    a.horario_id,
    a.profesor_asignado_id AS entrenador_id,
    a.nombre_padre,
    a.telefono_padre,
    a.nombre_madre,
    a.telefono_madre,
    a.whatsapp_preferido,
    a.meses_permanencia_inicial,
    a.ingresos_iniciales,
    s.nombre AS sucursal_nombre,
    c.nombre AS cancha_nombre,
    h.hora AS horario_hora,
    (((u.nombres)::text || ' '::text) || (u.apellidos)::text) AS entrenador_nombre,
    COALESCE(sum(cc.monto_total) FILTER (WHERE (cc.anulada = false)), (0)::numeric) AS total_deuda,
    COALESCE(sum(cc.total_cobrado) FILTER (WHERE (cc.anulada = false)), (0)::numeric) AS total_cobrado,
    COALESCE(sum(
        CASE
            WHEN cc.es_anticipo THEN (- cc.saldo_pendiente)
            ELSE cc.saldo_pendiente
        END) FILTER (WHERE (cc.anulada = false)), (0)::numeric) AS saldo_pendiente,
    count(cc.id) FILTER (WHERE (((cc.estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('parcial'::character varying)::text])) AND (cc.anulada = false) AND (cc.es_anticipo = false))) AS cxc_pendientes,
    count(cc.id) FILTER (WHERE (cc.anulada = false)) AS cxc_total,
    COALESCE(am.asistencias_actual, (0)::bigint) AS asistencias_actual,
    COALESCE(am.asistencias_anterior, (0)::bigint) AS asistencias_anterior,
    ((EXTRACT(year FROM (timezone(COALESCE(esc.zona_horaria, 'America/La_Paz'::character varying)::text, now())::date)))::integer - (EXTRACT(year FROM a.fecha_nacimiento))::integer) AS sub,
    (COALESCE(sum(cc.total_cobrado) FILTER (WHERE (cc.anulada = false)), (0)::numeric) + COALESCE(a.ingresos_iniciales, (0)::numeric)) AS total_ingresos_historico,
    (COALESCE(ms.meses_saasport, (0)::bigint) + COALESCE(a.meses_permanencia_inicial, 0)) AS cantidad_meses_actividad,
    COALESCE(a.fecha_inicio, (a.created_at)::date, ms.primera_fecha_saasport) AS fecha_inicio_consolidada,
    a.fecha_inicio,
    unaccent(lower((a.nombres)::text)) AS nombres_search,
    unaccent(lower((a.apellidos)::text)) AS apellidos_search,
    a.terminos_busqueda,
    ums.ultima_mensualidad,
    a.archivado
   FROM (((((((((alumnos a
     LEFT JOIN sucursales s ON ((a.sucursal_id = s.id)))
     LEFT JOIN canchas c ON ((a.cancha_id = c.id)))
     LEFT JOIN horarios h ON ((a.horario_id = h.id)))
     LEFT JOIN usuarios u ON ((a.profesor_assigned_id = u.id))) -- wait, profesor_asignado_id, wait, in sql below we wrote a.profesor_asignado_id AS entrenador_id, wait let's use the exact alias we had in the view definition:
     -- LEFT JOIN usuarios u ON ((a.profesor_asignado_id = u.id)))
     -- yes, let's keep it exactly as it is below:
     LEFT JOIN usuarios u ON ((a.profesor_asignado_id = u.id)))
     LEFT JOIN v_cuentas_cobrar cc ON ((a.id = cc.alumno_id)))
     LEFT JOIN asistencias_mes am ON ((a.id = am.alumno_id)))
     LEFT JOIN meses_stats ms ON ((a.id = ms.alumno_id)))
     LEFT JOIN ultima_mens_stats ums ON ((a.id = ums.alumno_id)))
     LEFT JOIN escuelas esc ON ((a.escuela_id = esc.id)))
  WHERE ((a.archivado = false) OR (a.id IN ( SELECT cc_filter.alumno_id
           FROM v_cuentas_cobrar cc_filter
          WHERE (cc_filter.saldo_pendiente <> (0)::numeric))))
  GROUP BY a.id, a.escuela_id, a.nombres, a.apellidos, a.fecha_nacimiento, a.sucursal_id, a.cancha_id, a.horario_id, a.profesor_asignado_id, a.nombre_padre, a.telefono_padre, a.nombre_madre, a.telefono_madre, a.whatsapp_preferido, a.meses_permanencia_inicial, a.ingresos_iniciales, s.nombre, c.nombre, h.hora, u.nombres, u.apellidos, am.asistencias_actual, am.asistencias_anterior, ms.meses_saasport, ms.primera_fecha_saasport, a.fecha_inicio, a.created_at, a.terminos_busqueda, ums.ultima_mensualidad, a.archivado, esc.zona_horaria;
