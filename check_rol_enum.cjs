const https = require('https');

const url = 'uqrmmotcbnyazmadzfvd.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';

// Note: We can't easily run arbitrary SQL via REST without a function.
// But we can check if there's an enum or just look at existing data if there is any.
// Or we can try to find the 'usuarios' definition in the OpenAPI spec again but look for 'enum'.

const options = {
    hostname: url,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
    }
};

https.get(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const spec = JSON.parse(body);
            const rolProp = spec.definitions.usuarios.properties.rol;
            console.log('Rol Property:', JSON.stringify(rolProp, null, 2));
            if (rolProp.description) {
                console.log('Description:', rolProp.description);
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    });
});
