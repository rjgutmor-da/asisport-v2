import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
    console.log('Buscando usuario: chipamo152183@gmail.com');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error al listar usuarios:', error.message);
        return;
    }

    const user = users.find(u => u.email === 'chipamo152183@gmail.com');
    if (user) {
        console.log('Usuario encontrado en Auth:');
        console.log('ID:', user.id);
        console.log('Email:', user.email);

        // Ahora buscar en la tabla public.usuarios
        const { data: publicUser, error: publicError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', 'chipamo152183@gmail.com')
            .single();

        if (publicError) {
            console.log('El usuario no existe en la tabla public.usuarios o hubo un error:', publicError.message);
        } else {
            console.log('Usuario encontrado en public.usuarios:');
            console.log(publicUser);
        }
    } else {
        console.log('Usuario no encontrado en Supabase Auth.');
    }
}

findUser();
