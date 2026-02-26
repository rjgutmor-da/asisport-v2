import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26';
const PROFESOR_ID = '1259d0e6-8fa4-48ba-b262-4427c7b971c4';
const CANCHA_ID = '0336a91f-a3c7-4ca2-b01c-043f21bf8f03';
const HORARIO_ID = '832bf94e-fe52-449b-b5bd-271aa50e1b29';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const alumnosData = [
    { nombres: 'Aaron', apellidos: 'Lopez Villarroel', fecha_nacimiento: '2013-06-17', telefono_padre: '72182305', telefono_madre: '' },
    { nombres: 'Andy', apellidos: 'Herrera Lino', fecha_nacimiento: '2012-11-20', telefono_padre: '71036873', telefono_madre: '75633030' },
    { nombres: 'Angel Gadiel', apellidos: 'Saucedo Balcazar', fecha_nacimiento: '2013-10-18', telefono_padre: '72184195', telefono_madre: '' },
    { nombres: 'Augusto', apellidos: 'Salinas Virreira', fecha_nacimiento: '2013-04-17', telefono_padre: '72140715', telefono_madre: '' },
    { nombres: 'Bruno Santiago', apellidos: 'Reynat Vargas', fecha_nacimiento: '2013-09-06', telefono_padre: '61362026', telefono_madre: '' },
    { nombres: 'Carlos Andres', apellidos: 'Argandoña Peña', fecha_nacimiento: '2013-03-15', telefono_padre: '75645280', telefono_madre: '72649257' },
    { nombres: 'Delfo Dhajuan', apellidos: 'Castro Álvarez', fecha_nacimiento: '2013-01-03', telefono_padre: '60857524', telefono_madre: '' },
    { nombres: 'Esteban', apellidos: 'Menacho Soto', fecha_nacimiento: '2013-03-04', telefono_padre: '75563610', telefono_madre: '78017717' },
    { nombres: 'Ezequiel', apellidos: 'Saldias García', fecha_nacimiento: '2013-11-12', telefono_padre: '70443969', telefono_madre: '' },
    { nombres: 'Fabricio', apellidos: 'Justiniano Herrera', fecha_nacimiento: '2013-09-30', telefono_padre: '60028986', telefono_madre: '' },
    { nombres: 'Franco Eduardo', apellidos: 'Rivas Azero', fecha_nacimiento: '2013-07-10', telefono_padre: '71321001', telefono_madre: '' },
    { nombres: 'Franco Eduardo', apellidos: 'Vargas Cabrera', fecha_nacimiento: '2013-07-15', telefono_padre: '76670907', telefono_madre: '' },
    { nombres: 'Gadiel', apellidos: 'Rivero Centella', fecha_nacimiento: '2013-03-13', telefono_padre: '60017017', telefono_madre: '' },
    { nombres: 'Joaquin Emiliano', apellidos: 'Tapia Terceros', fecha_nacimiento: '2013-09-02', telefono_padre: '76614044', telefono_madre: '75011426' },
    { nombres: 'Jose Ibrahim', apellidos: 'Senzano Calderon', fecha_nacimiento: '2013-12-27', telefono_padre: '78547417', telefono_madre: '' },
    { nombres: 'Mariano Osinaga', apellidos: 'Ortiz', fecha_nacimiento: '2013-09-09', telefono_padre: '70843539', telefono_madre: '' },
    { nombres: 'Mario Fernando', apellidos: 'Pereira Saavedra', fecha_nacimiento: '2013-08-30', telefono_padre: '76695866', telefono_madre: '' },
    { nombres: 'Octavio', apellidos: 'Ribera Terrazas', fecha_nacimiento: '2013-12-19', telefono_padre: '75014011', telefono_madre: '70885856' },
    { nombres: 'Pedro Daniel', apellidos: 'Otterburg Román', fecha_nacimiento: '2013-07-30', telefono_padre: '77349556', telefono_madre: '' },
    { nombres: 'Santiago Jhossiel', apellidos: 'Rivero Cespedes', fecha_nacimiento: '2013-06-18', telefono_padre: '76671688', telefono_madre: '78145488' },
    { nombres: 'Thiago', apellidos: 'Justiniano Sulzer', fecha_nacimiento: '2013-03-21', telefono_padre: '70840688', telefono_madre: '78020001' },
    { nombres: 'Said', apellidos: 'Zeballos Alvarez', fecha_nacimiento: '2013-10-25', telefono_padre: '77834047', telefono_madre: '' },
];

async function importarAlumnos() {
    console.log(`🚀 Iniciando importación de ${alumnosData.length} alumnos...`);

    const inserts = alumnosData.map(a => ({
        nombres: a.nombres,
        apellidos: a.apellidos,
        fecha_nacimiento: a.fecha_nacimiento,
        telefono_padre: a.telefono_padre || null,
        telefono_madre: a.telefono_madre || null,
        nombre_padre: a.telefono_padre ? 'Papa' : null,
        nombre_madre: a.telefono_madre ? 'Mama' : null,
        escuela_id: ESCUELA_ID,
        profesor_asignado_id: PROFESOR_ID,
        cancha_id: CANCHA_ID,
        horario_id: HORARIO_ID,
        estado: 'Aprobado',
        archivado: false
    }));

    const { data: createdAlumns, error: insertError } = await supabase
        .from('alumnos')
        .insert(inserts)
        .select('id');

    if (insertError) {
        console.error('❌ Error al insertar alumnos:', insertError.message);
        return;
    }

    console.log(`✅ ${createdAlumns.length} alumnos creados.`);

    // Crear relaciones en alumnos_entrenadores
    const rels = createdAlumns.map(a => ({
        alumno_id: a.id,
        entrenador_id: PROFESOR_ID
    }));

    const { error: relError } = await supabase
        .from('alumnos_entrenadores')
        .insert(rels);

    if (relError) {
        console.error('❌ Error al crear relaciones con entrenador:', relError.message);
    } else {
        console.log('✨ Relaciones con profesor creadas exitosamente.');
    }
}

importarAlumnos();
