
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateLimit() {
    console.log('🆙 Intentando aumentar el límite del bucket a 1MB...');
    const { data, error } = await supabase.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 1048576, // 1MB
    });
    
    if (error) console.error('Error al actualizar:', error.message);
    else console.log('✅ Bucket actualizado con éxito.');
}

updateLimit();
