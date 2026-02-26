import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const ESCUELA_ID = '218ea007-49c4-4fa2-9e81-3b6663496f26'; // PLANETA FC
const PROFESOR_ID = '4540a17c-7f3d-474b-9c0f-ac638fc290d0'; // Marcelo Escalante
const HORARIO_1530 = '43688db4-dfeb-4991-84cb-2d5719f51423';

const CANCHA_MAP = {
    'Villa-Mercedes-1': '0336a91f-a3c7-4ca2-b01c-043f21bf8f03',
    'Villa-Mercedes-2': '554a997b-1604-4a34-8ece-9576dceb8ff4'
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const alumnosData = [
    { nombres: 'Adrian', apellidos: 'Becerra Quintanilla', nacimiento: '2015-01-10', papa: '75009120', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Alejandro', apellidos: 'Avila Romero', nacimiento: '2016-02-26', papa: '75007728', mama: '0', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Ali', apellidos: 'Moron Espinoza', nacimiento: '2017-04-17', papa: '76002959', mama: '77061320', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Ana Fabia', apellidos: 'Osinaga Ortiz', nacimiento: '2014-01-01', papa: '70843539', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Augusto', apellidos: 'Ribera Torrico', nacimiento: '2016-05-10', papa: '72185312', mama: '72191760', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Benjamin', apellidos: 'Roca Pereira', nacimiento: '2015-01-26', papa: '61587792', mama: '99559710', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Braulio Kaleb', apellidos: 'Prudencio', nacimiento: '2014-04-25', papa: '77165990', mama: '77021066', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Carlos Andres', apellidos: 'Claure Molina', nacimiento: '2015-04-24', papa: '75477210', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Daniel', apellidos: 'Escalante Sandoval', nacimiento: '2015-10-23', papa: '76129594', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'David Josue', apellidos: 'Andrade Sosa', nacimiento: '2016-10-13', papa: '74845358', mama: '0', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Franco', apellidos: 'Alvarez Eguez', nacimiento: '2015-10-31', papa: '75317117', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Iker', apellidos: 'Caso Castillo', nacimiento: '2015-11-03', papa: '78526303', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Iker Michael', apellidos: 'Cuellar Montaño', nacimiento: '2015-08-15', papa: '79488999', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Jaime', apellidos: 'Moreno Sanchez', nacimiento: '2015-07-25', papa: '75000422', mama: '76607036', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Jese Sneijder', apellidos: 'Dorado Vaca', nacimiento: '2015-01-28', papa: '70497965', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Joaquin Nabil', apellidos: 'Hollweg', nacimiento: '2015-02-28', papa: '78046663', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Jose Carlo', apellidos: 'Aguilera Antezana', nacimiento: '2015-07-03', papa: '78042702', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Juan Manuel', apellidos: 'Tapia Puerta', nacimiento: '2015-01-14', papa: '67089000', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Juan Matias', apellidos: 'Torrico Rueda', nacimiento: '2015-05-22', papa: '77035622', mama: '76681145', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Leandro', apellidos: 'Torrico Torres', nacimiento: '2015-10-12', papa: '74627381', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Matias', apellidos: 'Padilla Acebo', nacimiento: '2014-02-04', papa: '75311448', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Nikolas', apellidos: 'Ortuño Quiroga', nacimiento: '2015-02-27', papa: '72697905', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Rafael', apellidos: 'Unzueta Dominguez', nacimiento: '2015-04-24', papa: '77307747', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Samuel Jesus', apellidos: 'Mamani Jaimes', nacimiento: '2016-04-26', papa: '65076019', mama: '0', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Santiago', apellidos: 'Alvarez Estevez', nacimiento: '2016-02-12', papa: '78453236', mama: '75093668', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Sebastian', apellidos: 'Salazar Suarez', nacimiento: '2016-04-04', papa: '76003327', mama: '0', cancha: 'Villa-Mercedes-2' },
    { nombres: 'Snaider', apellidos: 'Romero Aguilar', nacimiento: '2015-08-12', papa: '60040653', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Tarek', apellidos: 'Acouri Fraija', nacimiento: '2015-10-09', papa: '78560888', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Thiago Vladimir', apellidos: 'Alvarez Mercado', nacimiento: '2015-08-02', papa: '77048814', mama: '0', cancha: 'Villa-Mercedes-1' },
    { nombres: 'Vladimir', apellidos: 'Herrera Torrez', nacimiento: '2015-01-14', papa: '77314493', mama: '77463885', cancha: 'Villa-Mercedes-1' }
];

async function importarAlumnos() {
    console.log(`🚀 Iniciando importación de ${alumnosData.length} alumnos para Marcelo Escalante...`);

    const inserts = alumnosData.map(a => {
        const telPadre = a.papa !== '0' ? a.papa : null;
        const telMadre = a.mama !== '0' ? a.mama : null;
        return {
            nombres: a.nombres,
            apellidos: a.apellidos,
            fecha_nacimiento: a.nacimiento,
            telefono_padre: telPadre,
            telefono_madre: telMadre,
            nombre_padre: telPadre ? 'Papa' : null,
            nombre_madre: telMadre ? 'Mama' : null,
            escuela_id: ESCUELA_ID,
            profesor_asignado_id: PROFESOR_ID,
            cancha_id: CANCHA_MAP[a.cancha],
            horario_id: HORARIO_1530,
            estado: 'Aprobado',
            archivado: false
        }
    });

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
        console.log('✨ Relaciones con profesor Marcelo Escalante creadas exitosamente.');
    }
}

importarAlumnos();
