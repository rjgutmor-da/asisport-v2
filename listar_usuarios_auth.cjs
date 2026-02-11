/**
 * Script para listar todos los usuarios de Supabase Auth
 * Útil para verificar qué usuarios existen y sus estados
 */

const https = require('https');

// Configuración de Supabase
const SUPABASE_URL = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

// Construir la URL completa
const url = new URL('/auth/v1/admin/users', SUPABASE_URL);

// Configurar la petición
const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'GET',
    headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
    }
};

console.log('🔍 Listando usuarios en Supabase Auth...');
console.log('');

// Realizar la petición
const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log('');

        try {
            const response = JSON.parse(data);

            if (res.statusCode === 200) {
                const users = response.users || [];

                console.log(`✅ Total de usuarios: ${users.length}`);
                console.log('');

                if (users.length === 0) {
                    console.log('⚠️  No hay usuarios registrados en Auth');
                } else {
                    users.forEach((user, index) => {
                        console.log(`👤 Usuario ${index + 1}:`);
                        console.log(`   - ID: ${user.id}`);
                        console.log(`   - Email: ${user.email}`);
                        console.log(`   - Email confirmado: ${user.email_confirmed_at ? '✅ Sí' : '❌ No'}`);
                        console.log(`   - Creado: ${user.created_at}`);
                        console.log(`   - Última sesión: ${user.last_sign_in_at || 'Nunca'}`);
                        console.log('');
                    });
                }
            } else {
                console.log('❌ Error al listar usuarios:');
                console.log(JSON.stringify(response, null, 2));
            }
        } catch (error) {
            console.log('❌ Error al parsear la respuesta:');
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error en la petición:', error.message);
});

req.end();
