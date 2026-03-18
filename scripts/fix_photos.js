
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ESCUELA_ID = '07d945a7-99ba-4e7d-ba9c-258e7ee27659';
const PHOTOS_DIR = 'C:/Users/Public/Documents/AsiSportMarketing/EstrellasAmerica/';

const PHOTO_MAP = {
    "Lionel Messi": "messi.png",
    "Angel Di Maria": "dimaria.png",
    "Julian Alvarez": "julian_alvarez.png",
    "Marcelo Martins": "martins.png",
    "Carlos Lampe": "lampe.png",
    "Roberto Fernandez": "roberto_fernandez.png",
    "Neymar Jr": "neymar.png",
    "Vinicius Jr": "vinicius.png",
    "Rodrygo Goes": "rodrygo.png",
    "Alexis Sanchez": "alexis.png",
    "Arturo Vidal": "arturo_vidal.png",
    "Ben Brereton": "brereton.png",
    "Luis Diaz": "luis_diaz.png",
    "James Rodriguez": "james.png",
    "Radamel Falcao": "radamel_falcao.png",
    "Enner Valencia": "valencia.png",
    "Moises Caicedo": "caicedo.png",
    "Piero Hincapie": "hincapie.png",
    "Miguel Almiron": "almiron.png",
    "Gustavo Gomez": "gustavo_gomez.png",
    "Julio Enciso": "enciso.png",
    "Paolo Guerrero": "guerrero.png",
    "Gianluca Lapadula": "lapadula.png",
    "Luis Advincula": "advincula.png",
    "Luis Suarez": "suarez.png",
    "Federico Valverde": "valverde.png",
    "Darwin Nuñez": "darwin_nunez.png",
    "Salomon Rondon": "rondon.png",
    "Yeferson Soteldo": "soteldo.png",
    "Tomas Rincon": "rincon.png"
};

async function fixPhotos() {
    console.log('修复照片加载...');

    try {
        const { data: alumnos, error } = await supabase
            .from('alumnos')
            .select('id, nombres, apellidos')
            .eq('escuela_id', ESCUELA_ID);

        if (error) throw error;

        for (const alumno of alumnos) {
            const fullName = `${alumno.nombres} ${alumno.apellidos}`;
            const photoFile = PHOTO_MAP[fullName] || PHOTO_MAP[alumno.nombres];
            
            if (photoFile) {
                const photoPath = path.join(PHOTOS_DIR, photoFile);
                if (fs.existsSync(photoPath)) {
                    const stats = fs.statSync(photoPath);
                    console.log(`📤 Subiendo ${photoFile} (${(stats.size/1024).toFixed(1)} KB) para ${fullName}...`);
                    
                    const fileBuffer = fs.readFileSync(photoPath);
                    const storageKey = `fotos_alumnos/demo_${Date.now()}_${photoFile}`;
                    
                    const { data: uploadData, error: upErr } = await supabase.storage
                        .from('avatars')
                        .upload(storageKey, fileBuffer, {
                            contentType: 'image/png',
                            upsert: true
                        });
                    
                    if (upErr) {
                        console.error(`❌ Error en ${fullName}:`, upErr.message);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(storageKey);

                    const { error: updateErr } = await supabase
                        .from('alumnos')
                        .update({ foto_url: publicUrl })
                        .eq('id', alumno.id);
                    
                    if (updateErr) {
                        console.error(`❌ Error actualizando BD para ${fullName}:`, updateErr.message);
                    } else {
                        console.log(`✅ Foto vinculada para ${fullName}`);
                    }
                } else {
                    console.log(`⚠️ Archivo no encontrado: ${photoFile} para ${fullName}`);
                }
            } else {
                console.log(`❓ No hay mapeo de foto para ${fullName}`);
            }
        }

    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
}

fixPhotos();
