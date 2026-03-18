
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
const SUCURSAL_ID = '99f11454-8d15-4888-8a18-0e7fa0436892';
const CANCHA_ID = 'cccf5cc7-e113-4fc5-a937-cfe7f8bb4e76';
const HORARIO_ID = '10768921-cab5-4cd5-88f0-6e968d084969';
const JSON_PATH = 'C:/Users/Public/Documents/AsiSportMarketing/EstrellasAmerica/jugadores.json';
const PHOTOS_DIR = 'C:/Users/Public/Documents/AsiSportMarketing/EstrellasAmerica/';

const PHOTO_MAP = {
    "Lionel Messi": "messi.png",
    "Angel Di Maria": "dimaria.png",
    "Julian Alvarez": "julian_alvarez.png",
    "Marcelo Martins": "martins.png",
    "Carlos Lampe": "lampe.png",
    "Neymar Jr": "neymar.png",
    "Vinicius Jr": "vinicius.png",
    "Alexis Sanchez": "alexis.png",
    "Arturo Vidal": "arturo_vidal.png",
    "Ben Brereton": "brereton.png",
    "Luis Diaz": "luis_diaz.png",
    "James Rodriguez": "james.png",
    "Radamel Falcao": "radamel_falcao.png",
    "Enner Valencia": "valencia.png",
    "Moises Caicedo": "caicedo.png",
    "Miguel Almiron": "almiron.png",
    "Paolo Guerrero": "guerrero.png",
    "Luis Suarez": "suarez.png",
    "Federico Valverde": "valverde.png",
    "Darwin Nuñez": "darwin_nunez.png",
    "Salomon Rondon": "rondon.png",
    "Yeferson Soteldo": "soteldo.png"
};

async function enrollStars() {
    console.log('🚀 Iniciando Inscripción Masiva de Cracks...');

    try {
        const email = 'estrellas@asisport.com';
        let userId;

        // Limpiar si existe previo
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let existing = users.find(u => u.email === email);
        if (existing) {
            userId = existing.id;
        } else {
            const { data: created, error } = await supabase.auth.admin.createUser({
                email,
                password: 'demoasisport',
                email_confirm: true
            });
            if (error) {
                // Si falla por registro, intentamos una vez más listando todo
                const { data: { users: all } } = await supabase.auth.admin.listUsers();
                existing = all.find(u => u.email === email);
                if (!existing) throw new Error("No se pudo crear ni encontrar el usuario: " + error.message);
                userId = existing.id;
            } else {
                userId = created.user.id;
            }
        }

        console.log(`👤 Usuario OK: ${userId}`);

        await supabase.from('usuarios').upsert({
            id: userId, email, nombres: 'Director', apellidos: 'Demo',
            rol: 'Dueño', escuela_id: ESCUELA_ID, sucursal_id: SUCURSAL_ID, activo: true,
            telefono_whatsapp: '59174631123'
        });

        const rawData = fs.readFileSync(JSON_PATH, 'utf8');
        const paises = JSON.parse(rawData);
        const allAlumnos = [];
        for (const p of paises) {
            for (const j of p.jugadores) {
                allAlumnos.push({ ...j, pais: p.pais });
            }
        }

        console.log(`📦 Procesando ${allAlumnos.length} jugadores...`);

        for (const alumno of allAlumnos) {
            const names = alumno.nombre.split(' ');
            const nombres = names[0];
            const apellidos = names.slice(1).join(' ') || 'Ficticio';

            const { data: exists } = await supabase.from('alumnos').select('id').eq('nombres', nombres).eq('apellidos', apellidos).eq('escuela_id', ESCUELA_ID).maybeSingle();
            if (exists) {
                // Actualizar created_by si era nulo o erróneo
                await supabase.from('alumnos').update({ created_by: userId }).eq('id', exists.id);
                console.log(`⏩ ${alumno.nombre} actualizado.`);
                continue;
            }

            let fotoUrl = null;
            const photoFile = PHOTO_MAP[alumno.nombre];
            if (photoFile) {
                const photoPath = path.join(PHOTOS_DIR, photoFile);
                if (fs.existsSync(photoPath)) {
                    const stats = fs.statSync(photoPath);
                    if (stats.size < 800000) {
                        const { error: upErr } = await supabase.storage.from('avatars').upload(`fotos_alumnos/demo_${Date.now()}_${photoFile}`, fs.readFileSync(photoPath), { contentType: 'image/png' });
                        if (!upErr) {
                            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`fotos_alumnos/demo_${Date.now()}_${photoFile}`);
                            fotoUrl = publicUrl;
                        }
                    }
                }
            }

            const { data: ins, error: iErr } = await supabase.from('alumnos').insert({
                nombres, apellidos, fecha_nacimiento: alumno.fecha_nacimiento,
                escuela_id: ESCUELA_ID, sucursal_id: SUCURSAL_ID, cancha_id: CANCHA_ID, horario_id: HORARIO_ID,
                foto_url: fotoUrl, nombre_padre: 'Representante', telefono_padre: '59174631123', whatsapp_preferido: 'padre',
                estado: 'Aprobado', created_by: userId, archivado: false
            }).select().single();

            if (iErr) console.error(`❌ ${alumno.nombre}:`, iErr.message);
            else {
                console.log(`✅ ${alumno.nombre} inscrito.`);
                await supabase.from('alumnos_entrenadores').insert({ alumno_id: ins.id, entrenador_id: userId });
            }
        }
        console.log('\n✨ ¡Listo!');
        console.log(`Login: ${email} / Pass: demoasisport`);
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
}
enrollStars();
