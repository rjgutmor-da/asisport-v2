
import { obtenerClienteSupabaseAdmin } from './config/cliente_supabase_admin.js';

const supabase = obtenerClienteSupabaseAdmin();

async function check() {
    console.log('Searching for users named Marcelo Escalante...');
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nombres', '%Marcelo%')
        .ilike('apellidos', '%Escalante%');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Rol: ${u.rol}, Escuela: ${u.escuela_id}`);
        });
    }

    const targetStudentId = '737d6b12-96ff-4bf7-b720-d93f880eb5fe';
    const { data: student } = await supabase
        .from('alumnos')
        .select('profesor_asignado_id')
        .eq('id', targetStudentId)
        .single();
    
    console.log(`\nStudent assigned to professor ID: ${student?.profesor_asignado_id}`);
}

check();
