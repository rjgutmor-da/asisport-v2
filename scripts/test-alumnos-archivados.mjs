// Ejecutar: node --test scripts/test-alumnos-archivados.mjs
// Usa datos sintéticos; no necesita credenciales ni modifica Supabase.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const perfil = { id: 'actor', escuela_id: 'escuela', sucursal_id: 'sucursal' };
const mocks = {
    'react-router-dom': 'export const useNavigate = () => () => {};',
    'supabaseClient': 'export const supabase = globalThis.fixture.supabase;',
    'rpcHelper': 'export const obtenerEscuelaId = globalThis.fixture.obtenerEscuelaId;',
    'AuthContext': 'export const useAuth = () => globalThis.fixture.auth;',
    'Toast': 'export const useToast = () => ({ addToast() {} });',
    'DesktopNavbar': 'export default () => null;',
    'CombinarAlumnosModal': `import React from 'react'; export default ({ alumnos }) => React.createElement('aside', { 'data-combinar-total': alumnos.length });`,
    'combinarAlumnos': 'export const combinarAlumnos = async () => {};'
};
const bundle = async entry => (await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs',
    packages: 'external', external: ['react'], logLevel: 'silent',
    plugins: [{ name: 'fixtures', setup(builder) {
        builder.onResolve({ filter: /react-router-dom|supabaseClient|rpcHelper|AuthContext|\/Toast$|DesktopNavbar|CombinarAlumnosModal|combinarAlumnos$/ }, args => {
            const key = Object.keys(mocks).find(name => args.path.endsWith(name));
            return key ? { path: key, namespace: 'fixture' } : undefined;
        });
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path] }));
    } }]
})).outputFiles[0].text;
const serviceCode = await bundle('src/services/alumnos.js');
const pageCode = await bundle('src/pages/alumnos/AlumnosArchivados.jsx');
const load = (code, fixture) => {
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, require, fixture, console });
    return module.exports;
};
const createFixture = (responses = []) => {
    const calls = [];
    const fixture = {
        calls,
        auth: { user: { id: perfil.id }, userProfile: perfil, role: 'Administrador', escuelaId: perfil.escuela_id, isAdmin: true },
        obtenerEscuelaId: async () => { calls.push(['escuela']); return perfil.escuela_id; },
        supabase: {
            auth: { getUser: async () => { calls.push(['auth']); return { data: { user: { id: perfil.id } } }; } },
            from(table) {
                const record = { table, methods: [] };
                calls.push(record);
                const query = {};
                for (const method of ['select', 'eq', 'neq', 'in', 'order', 'range', 'single', 'abortSignal']) {
                    query[method] = (...args) => { record.methods.push([method, ...args]); return query; };
                }
                query.then = (resolve, reject) => Promise.resolve(responses.shift() || { data: [], error: null }).then(resolve, reject);
                return query;
            }
        }
    };
    return fixture;
};
const methods = fixture => fixture.calls.filter(c => c.table === 'alumnos').map(c => c.methods);
const has = (calls, method, field, value) => calls.some(c => c[0] === method && c[1] === field && (value === undefined || c[2] === value));

test('lista ligera reutiliza el perfil y conserva escuela/sucursal sin contar asistencias', async () => {
    const fixture = createFixture([{ data: [{ id: 'alumno' }] }]);
    const result = await load(serviceCode, fixture).getAlumnosArchivados('Administrador', perfil.id, { perfil });
    assert.equal(result.length, 1);
    assert.equal(fixture.calls.length, 1, 'No debe consultar auth ni usuarios otra vez');
    const [calls] = methods(fixture);
    assert.ok(has(calls, 'eq', 'escuela_id', perfil.escuela_id));
    assert.ok(has(calls, 'eq', 'sucursal_id', perfil.sucursal_id));
    assert.ok(has(calls, 'eq', 'archivado', true));
    assert.ok(has(calls, 'neq', 'estado', 'ELIMINADO SISTEMA'));
    assert.doesNotMatch(calls.find(c => c[0] === 'select')[1], /asistencias|telefono|carnet/);
});

test('entrenador conserva su filtro y superadministrador ve toda su escuela', async () => {
    for (const rol of ['Entrenador', 'SuperAdministrador']) {
        const fixture = createFixture();
        await load(serviceCode, fixture).getAlumnosArchivados(rol, perfil.id, { perfil });
        const [calls] = methods(fixture);
        assert.equal(has(calls, 'eq', 'profesor_asignado_id', perfil.id), rol === 'Entrenador');
        assert.equal(has(calls, 'eq', 'sucursal_id'), rol !== 'SuperAdministrador');
        assert.ok(has(calls, 'eq', 'escuela_id', perfil.escuela_id));
    }
});

test('no trunca listas de más de 1000 y mantiene un desempate estable', async () => {
    const fixture = createFixture([{ data: Array.from({ length: 1000 }, (_, i) => ({ id: i })) }, { data: [{ id: 1000 }] }]);
    const result = await load(serviceCode, fixture).getAlumnosArchivados('Administrador', perfil.id, { perfil });
    assert.equal(result.length, 1001);
    assert.equal(methods(fixture)[1].find(c => c[0] === 'range')[1], 1000);
    assert.ok(has(methods(fixture)[0], 'order', 'id'));
});

test('asistencias suma los dos historiales y consulta solo IDs visibles con los mismos filtros', async () => {
    const fixture = createFixture([{ data: [
        { id: 'a', asistencias_normales: [{ count: 12 }], asistencias_arqueros: [{ count: 3 }] },
        { id: 'b', asistencias_normales: [], asistencias_arqueros: null }
    ] }]);
    const result = await load(serviceCode, fixture).getAsistenciasArchivados('Entrenador', perfil.id, ['a', 'b'], { perfil });
    assert.equal(result.a, 15);
    assert.equal(result.b, 0);
    const [calls] = methods(fixture);
    assert.deepEqual(calls.find(c => c[0] === 'in')[2], ['a', 'b']);
    assert.ok(has(calls, 'eq', 'profesor_asignado_id', perfil.id));
    assert.ok(has(calls, 'eq', 'escuela_id', perfil.escuela_id));
    assert.ok(has(calls, 'eq', 'sucursal_id', perfil.sucursal_id));
});

test('sin IDs no hace consultas y permite cancelar ambas cargas', async () => {
    const fixture = createFixture();
    const services = load(serviceCode, fixture);
    await services.getAsistenciasArchivados('Administrador', perfil.id, [], { perfil });
    assert.equal(fixture.calls.length, 0);
    const signal = new AbortController().signal;
    await services.getAlumnosArchivados('Administrador', perfil.id, { perfil, signal });
    await services.getAsistenciasArchivados('Administrador', perfil.id, ['a'], { perfil, signal });
    for (const calls of methods(fixture)) assert.ok(calls.some(c => c[0] === 'abortSignal' && c[1] === signal));
});

test('perfil de otro usuario exige verificar la sesión y un error de sucursal detiene la carga', async () => {
    const fixture = createFixture([{ data: null, error: { message: 'denegado' } }]);
    await assert.rejects(
        load(serviceCode, fixture).getAlumnosArchivados('Administrador', perfil.id, { perfil: { ...perfil, id: 'otro' } }),
        /verificar la sucursal/
    );
    assert.ok(fixture.calls.some(c => c[0] === 'auth'));
    assert.equal(methods(fixture).length, 0);
});

const renderPage = (fixture, alumnos, asistencias) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const scope = ['alumnos', 'archivados', perfil.escuela_id, perfil.id, fixture.auth.role, perfil.sucursal_id];
    if (alumnos) client.setQueryData([...scope, 'lista'], alumnos);
    if (asistencias) client.setQueryData([...scope, 'asistencias', alumnos.slice(0, 30).map(a => a.id)], asistencias);
    const Page = load(pageCode, fixture).default;
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
        React.createElement(Page)));
    client.clear();
    return html;
};

test('la lista se muestra aunque las asistencias sigan pendientes; renderiza 30 y conserva todos para combinar', () => {
    const fixture = createFixture();
    const alumnos = Array.from({ length: 31 }, (_, i) => ({ id: `a${i}`, nombres: `Alumno ${String(i).padStart(2, '0')}`, apellidos: 'Prueba' }));
    const html = renderPage(fixture, alumnos);
    assert.match(html, /Alumno 00/);
    assert.doesNotMatch(html, /Alumno 30/);
    assert.equal((html.match(/<tr/g) || []).length, 31, 'Encabezado más 30 alumnos');
    assert.match(html, /data-combinar-total="31"/);
    assert.match(html, /Asistencias pendientes de cargar/);
    assert.doesNotMatch(html, /Cargando alumnos archivados/);
});

test('un cero confirmado se muestra como cero y el inicio aún sin lista muestra carga', () => {
    const fixture = createFixture();
    const html = renderPage(fixture, [{ id: 'a', nombres: 'Ana', apellidos: 'Prueba' }], { a: 0 });
    assert.match(html, /<span>0<\/span>/);
    assert.doesNotMatch(html, /Asistencias pendientes de cargar/);
    assert.match(renderPage(fixture), /Cargando alumnos archivados/);
});
