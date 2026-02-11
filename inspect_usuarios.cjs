const https = require('https');

const url = 'uqrmmotcbnyazmadzfvd.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';

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
            const table = 'usuarios';
            console.log(`\nColumns for ${table}:`);
            const def = spec.definitions[table];
            if (def && def.properties) {
                Object.keys(def.properties).forEach(prop => {
                    const req = def.required && def.required.includes(prop) ? '(Required)' : '';
                    console.log(` - ${prop} ${req}`);
                });
            } else {
                console.log(' Definition not found.');
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    });
});
