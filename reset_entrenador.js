
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setEntrenadorPassword() {
    console.log('🔐 Configurando contraseña para entrenador@asisport.com...');

    // 1. Obtener el ID del usuario
    const { data: userData, error: fetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', 'entrenador@asisport.com')
        .single();

    if (fetchError || !userData) {
        console.error('❌ No se encontró el usuario en la tabla public.usuarios');
        return;
    }

    const userId = userData.id;
    const password = 'Entrenador123!';

    // 2. Actualizar contraseña en Auth
    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        {
            password: password,
            email_confirm: true
        }
    );

    if (error) {
        console.error('❌ Error al actualizar contraseña:', error.message);
    } else {
        console.log('✅ Contraseña actualizada exitosamente');
        console.log('📋 Credenciales:');
        console.log('   Email:      entrenador@asisport.com');
        console.log('   Contraseña: ' + password);
    }
}

setEntrenadorPassword();
