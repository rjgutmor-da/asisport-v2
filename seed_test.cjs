const https = require('https');
const fs = require('fs');

const url = 'uqrmmotcbnyazmadzfvd.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0';

function post(path, data) {
    const options = {
        hostname: url,
        path: path,
        method: 'POST',
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => console.log(`POST ${path} - Status: ${res.statusCode}`, body));
    });

    req.on('error', (e) => console.error(e));
    req.write(data);
    req.end();
}

const canchas = fs.readFileSync('test_canchas.json', 'utf8');
const horarios = fs.readFileSync('test_horarios.json', 'utf8');

post('/rest/v1/canchas', canchas);
post('/rest/v1/horarios', horarios);
