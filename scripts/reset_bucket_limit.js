
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setLimit() {
    console.log('📏 Restableciendo límite del bucket a 150KB...');
    const { data, error } = await supabase.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 153600, // 150KB (150 * 1024)
    });
    
    if (error) console.error('Error al actualizar:', error.message);
    else console.log('✅ Límite de 150KB establecido correctamente.');
}

setLimit();
