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
            console.log('Available Tables/Paths:');
            Object.keys(spec.paths).forEach(p => console.log(p));
        } catch (e) {
            console.log('Error parsing response:', e.message);
            console.log('Raw body start:', body.substring(0, 200));
        }
    });
});
