
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const escuelaId = '91b2a748-f956-41e7-8efe-075257a0889a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestStudents() {
    console.log('🚀 Creando alumnos de prueba corregidos...');

    const alumnos = [
        {
            nombres: 'Diego',
            apellidos: 'Fernández',
            fecha_nacimiento: '2012-03-10',
            nombre_padre: 'Jorge Fernández',
            telefono_padre: '+56987654325',
            direccion: 'Pasaje Los Aromos 456',
            estado: 'Aprobado',
            escuela_id: escuelaId
        },
        {
            nombres: 'Ana',
            apellidos: 'López',
            fecha_nacimiento: '2011-08-20',
            nombre_madre: 'Carmen Rojas',
            telefono_madre: '+56987654324',
            direccion: 'Avenida Siempre Viva 742',
            estado: 'Pendiente',
            escuela_id: escuelaId
        },
        {
            nombres: 'Pedro',
            apellidos: 'Martínez',
            fecha_nacimiento: '2010-05-15',
            nombre_padre: 'Roberto Martínez',
            telefono_padre: '+56987654321',
            nombre_madre: 'María Silva',
            telefono_madre: '+56987654322',
            estado: 'Aprobado',
            escuela_id: escuelaId
        }
    ];

    for (const alumno of alumnos) {
        const { error } = await supabase.from('alumnos').insert(alumno);
        if (error) {
            console.log(`❌ Error al crear ${alumno.nombres}: ${error.message}`);
        } else {
            console.log(`✅ Alumno creado: ${alumno.nombres} ${alumno.apellidos} (${alumno.estado})`);
        }
    }

    console.log('\n✨ Proceso finalizado.');
}

createTestStudents();
