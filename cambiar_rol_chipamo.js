import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cambiarRol() {
    const userId = '64607217-75e1-424d-8a88-2eba809022e9';
    const nuevoRol = 'Entrenador';

    console.log(`🔄 Cambiando rol de usuario ${userId} a ${nuevoRol}...`);

    const { data, error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('❌ Error al cambiar el rol:', error.message);
    } else {
        console.log('✅ Rol actualizado exitosamente:');
        console.log(data);
    }
}

cambiarRol();
