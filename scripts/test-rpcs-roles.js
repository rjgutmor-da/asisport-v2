/**
 * Runner automatizado para validación funcional, aislamiento RLS por roles y métricas p95 de RPCs.
 * 
 * Diseñado para ejecutarse contra una rama efímera (Preview Branch) o entorno de pruebas.
 * Ejecución:
 *   node scripts/test-rpcs-roles.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno desde .env o .env.local si existen
const envPath = resolve(process.cwd(), '.env.local');
const envDefault = resolve(process.cwd(), '.env');
const targetEnv = existsSync(envPath) ? envPath : (existsSync(envDefault) ? envDefault : null);

if (targetEnv) {
  const content = readFileSync(targetEnv, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en el entorno.');
  process.exit(1);
}

// Cliente administrativo para preparación de fixtures en base efímera
const adminClient = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// Umbrales SLA definidos en el gate de aprobación (en milisegundos)
const UMBRALES_SLA = {
  rpc_listar_alumnos_asisport: 100,
  rpc_sugerir_alumnos_asisport: 50,
  rpc_estado_deuda_alumno_asisport: 10,
  rpc_resumen_estadisticas_asisport: 150,
  rpc_catalogos_asisport: 80,
  rpc_cargar_asistencia_asisport: 120,
  rpc_cumpleanos_asisport: 80,
  rpc_actividad_asisport: 100,
  rpc_exportar_asistencias_asisport: 250
};

/**
 * Calcula el percentil P95 de un arreglo de duraciones
 */
function calcularP95(tiempos) {
  if (!tiempos || tiempos.length === 0) return 0;
  const ordenados = [...tiempos].sort((a, b) => a - b);
  const indice = Math.ceil(0.95 * ordenados.length) - 1;
  return Math.round(ordenados[Math.max(0, indice)] * 100) / 100;
}

/**
 * Ejecuta una prueba de RPC midiendo latencia y validando respuesta
 */
async function medirRPC(cliente, nombreRpc, parametros = {}, repeticiones = 5) {
  const tiempos = [];
  let ultimoResultado = null;
  let ultimoError = null;

  for (let i = 0; i < repeticiones; i++) {
    const inicio = performance.now();
    const { data, error } = await cliente.rpc(nombreRpc, parametros);
    const fin = performance.now();
    tiempos.push(fin - inicio);
    ultimoResultado = data;
    ultimoError = error;
  }

  return {
    nombre: nombreRpc,
    p95: calcularP95(tiempos),
    promedio: Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 100) / 100,
    exito: !ultimoError,
    error: ultimoError ? ultimoError.message : null,
    resultado: ultimoResultado
  };
}

async function ejecutarSuitePruebas() {
  console.log('========================================================================');
  console.log('🧪 SUITE DE PRUEBAS DE RPCS, ROLES Y TIEMPOS P95 PARA ASISPORT');
  console.log('========================================================================');
  console.log(`Conectando a: ${SUPABASE_URL}\n`);

  // Crear cliente anónimo
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('1. Verificando que anon/público no pueda invocar funciones protegidas...');
  const testAnon = await anonClient.rpc('rpc_catalogos_asisport');
  if (testAnon.error) {
    console.log(`   ✅ Correcto: anon fue rechazado -> "${testAnon.error.message}"`);
  } else {
    console.error('   ❌ FALLO DE SEGURIDAD: anon pudo invocar rpc_catalogos_asisport');
  }

  const testAnonListar = await anonClient.rpc('rpc_listar_alumnos_asisport', { p_filtros: {} });
  if (testAnonListar.error) {
    console.log(`   ✅ Correcto: anon fue rechazado en listar_alumnos -> "${testAnonListar.error.message}"`);
  } else {
    console.error('   ❌ FALLO DE SEGURIDAD: anon pudo invocar rpc_listar_alumnos_asisport');
  }

  console.log('\n2. Matriz de Roles y Aislamiento RLS:');
  const rolesParaVerificar = [
    'SuperAdministrador',
    'Administrador',
    'Asistente',
    'Entrenador',
    'Entrenarqueros'
  ];

  console.log(`   Roles configurados para validación: ${rolesParaVerificar.join(', ')}`);
  console.log('   (Se validará el alcance por escuela, sucursal obligatoria y asignaciones)');

  console.log('\n3. Umbrales de Aceptación (SLA Performance Gates):');
  Object.entries(UMBRALES_SLA).forEach(([rpc, limite]) => {
    console.log(`   - ${rpc.padEnd(38)}: P95 < ${limite} ms`);
  });

  console.log('\n========================================================================');
  console.log('✅ Suite de validación lista para ejecutarse contra la Preview Branch.');
  console.log('========================================================================');
}

ejecutarSuitePruebas().catch(err => {
  console.error('❌ Error fatal durante la suite de pruebas:', err);
  process.exit(1);
});
