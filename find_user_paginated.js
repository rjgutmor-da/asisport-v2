import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUserAuthWithPagination() {
    console.log('Buscando en auth.users con paginación...');

    for (let i = 1; i <= 5; i++) {
        console.log(`Página ${i}...`);
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            page: i,
            perPage: 50
        });

        if (error) {
            console.error('Error en página', i, ':', error.message);
            break;
        }

        if (users.length === 0) {
            console.log('No hay más usuarios.');
            break;
        }

        const found = users.find(u => u.email === 'chipamo152183@gmail.com');
        if (found) {
            console.log('✅ USUARIO ENCONTRADO!');
            console.log(found);
            return;
        }
    }
    console.log('Usuario no encontrado en las primeras 5 páginas.');
}

findUserAuthWithPagination();
