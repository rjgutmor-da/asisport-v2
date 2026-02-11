/**
 * Script para actualizar un usuario en Supabase usando la API de administración
 * Este script actualiza la contraseña y confirma el email del usuario
 */

const https = require('https');

// Configuración de Supabase
const SUPABASE_URL = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

// ID del usuario a actualizar
const USER_ID = '5a8cbc54-c739-4a0a-aad9-5bcbc36152a7';

// Datos a actualizar
const updateData = {
  password: 'Test1234!',
  email_confirm: true
};

// Construir la URL completa
const url = new URL(`/auth/v1/admin/users/${USER_ID}`, SUPABASE_URL);

// Configurar la petición
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'PUT',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔄 Actualizando usuario en Supabase...');
console.log(`📧 Usuario ID: ${USER_ID}`);
console.log(`🔐 Nueva contraseña: ${updateData.password}`);
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
        console.log('✅ Usuario actualizado exitosamente!');
        console.log('');
        console.log('📋 Detalles del usuario:');
        console.log(`   - Email: ${response.email}`);
        console.log(`   - ID: ${response.id}`);
        console.log(`   - Email confirmado: ${response.email_confirmed_at ? 'Sí' : 'No'}`);
        console.log(`   - Última actualización: ${response.updated_at}`);
        console.log('');
        console.log('🎉 Ahora puedes iniciar sesión con:');
        console.log(`   Email: ${response.email}`);
        console.log(`   Contraseña: ${updateData.password}`);
      } else {
        console.log('❌ Error al actualizar el usuario:');
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

// Enviar los datos
req.write(JSON.stringify(updateData));
req.end();
