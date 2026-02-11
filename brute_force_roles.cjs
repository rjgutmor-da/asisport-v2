const { createClient } = require('@supabase/supabase-js');

const url = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const supabase = createClient(url, key);

async function testRoles() {
    const candidates = [
        'Dueño', 'Administrador', 'Entrenador', 'Entrenarqueros',
        'Entrenador de Arqueros', 'Entrenador Arqueros',
        'Superadmin', 'Owner', 'Admin', 'Coach', 'Goalkeeper',
        'dueño', 'administrador', 'entrenador', 'entrenarqueros'
    ];

    for (const role of candidates) {
        const { error } = await supabase.from('usuarios').insert([{
            id: crypto.randomUUID(),
            escuela_id: '91b2a748-f956-41e7-8efe-075257a0889a',
            email: `test_${role.replace(/\s/g, '_')}@test.com`,
            nombres: 'Test',
            apellidos: 'Role',
            telefono_whatsapp: '000',
            rol: role
        }]);

        if (error) {
            if (error.message.includes('usuarios_rol_check')) {
                console.log(`[REJECTED] ${role}`);
            } else {
                console.log(`[ERROR] ${role}: ${error.message}`);
            }
        } else {
            console.log(`[ACCEPTED] ${role} !!!`);
        }
    }
}

testRoles();
