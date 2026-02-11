const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
// User provided Service Role Key in previous failed command
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(url, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmUser() {
    const userId = '5a8cbc54-c739-4a0a-aad9-5bcbc36152a7';

    console.log(`Confirmando email para usuario: ${userId}...`);

    const { data: user, error } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
    );

    if (error) {
        console.error('Error al confirmar usuario:', error.message);
    } else {
        console.log('Usuario confirmado exitosamente:', user.user.email);
    }
}

confirmUser();
