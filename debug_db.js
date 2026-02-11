import { supabase } from './src/lib/supabaseClient.js';

async function checkData() {
    console.log('--- Checking Canchas ---');
    const { data: canchas, error: cError } = await supabase.from('canchas').select('*').limit(1);
    if (cError) console.error('Canchas error:', cError.message);
    else console.log('Canchas sample:', canchas);

    console.log('\n--- Checking Horarios ---');
    const { data: horarios, error: hError } = await supabase.from('horarios').select('*').limit(1);
    if (hError) console.error('Horarios error:', hError.message);
    else console.log('Horarios sample:', horarios);
}

checkData();
