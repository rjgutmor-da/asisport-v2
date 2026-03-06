
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uqrmmotcbnyazmadzfvd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findDuplicates() {
    try {
        const { data: escuelas, error: escError } = await supabase
            .from('escuelas')
            .select('id, nombre')
            .ilike('nombre', '%Planeta FC%');

        if (escError) throw escError;
        if (!escuelas || escuelas.length === 0) {
            console.log('Escuela "Planeta FC" no encontrada.');
            return;
        }

        const escuelaId = escuelas[0].id;
        console.log(`Buscando duplicados para la escuela: ${escuelas[0].nombre} (ID: ${escuelaId})`);

        const { data: alumnos, error: alumError } = await supabase
            .from('alumnos')
            .select('id, nombres, apellidos, fecha_nacimiento')
            .eq('escuela_id', escuelaId)
            .is('archivado', false)
            .neq('estado', 'ELIMINADO SISTEMA');

        if (alumError) throw alumError;

        const porFecha = {};
        alumnos.forEach(a => {
            if (!a.fecha_nacimiento) return;
            if (!porFecha[a.fecha_nacimiento]) porFecha[a.fecha_nacimiento] = [];
            porFecha[a.fecha_nacimiento].push(a);
        });

        const normalize = (str) => {
            if (!str) return "";
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
        };

        const duplicados = [];

        for (const fecha in porFecha) {
            const grupo = porFecha[fecha];
            if (grupo.length < 2) continue;

            for (let i = 0; i < grupo.length; i++) {
                for (let j = i + 1; j < grupo.length; j++) {
                    const a1 = grupo[i];
                    const a2 = grupo[j];

                    const n1 = normalize(`${a1.nombres} ${a1.apellidos}`);
                    const n2 = normalize(`${a2.nombres} ${a2.apellidos}`);

                    const p1 = n1.split(/\s+/).filter(p => p.length > 2);
                    const p2 = n2.split(/\s+/).filter(p => p.length > 2);

                    const coincidencia = p1.some(palabra => p2.includes(palabra));

                    if (coincidencia) {
                        duplicados.push({
                            fecha,
                            alumno1: `${a1.nombres} ${a1.apellidos}`,
                            alumno2: `${a2.nombres} ${a2.apellidos}`,
                            id1: a1.id,
                            id2: a2.id
                        });
                    }
                }
            }
        }

        if (duplicados.length === 0) {
            console.log('No se encontraron posibles duplicados.');
        } else {
            console.log('--- POSIBLES DUPLICADOS ENCONTRADOS ---');
            duplicados.forEach((d, idx) => {
                process.stdout.write(`${idx + 1}. Fecha: ${d.fecha}\n`);
                process.stdout.write(`   Alumno A: ${d.alumno1} (ID: ${d.id1})\n`);
                process.stdout.write(`   Alumno B: ${d.alumno2} (ID: ${d.id2})\n`);
                process.stdout.write('---------------------------------------\n');
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

findDuplicates();
