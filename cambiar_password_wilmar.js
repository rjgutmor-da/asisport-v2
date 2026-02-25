import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cambiarPasswordWilmar() {
    const userId = '1df51cb2-e42a-4aa6-b0ea-66c3ee4ae52a';
    const nuevaPassword = 'wilmar677';

    console.log(`🔐 Cambiando contraseña para el usuario Wilmar (ID: ${userId})...`);

    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: nuevaPassword }
    );

    if (error) {
        console.error('❌ Error al cambiar la contraseña:', error.message);
    } else {
        console.log('✅ Contraseña actualizada correctamente.');
        console.log(`📧 Usuario: ${data.user.email}`);
        console.log(`🔑 Nueva contraseña: ${nuevaPassword}`);
    }
}

cambiarPasswordWilmar();
