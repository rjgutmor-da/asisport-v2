// Local visual harness: real page, hooks and controls; synthetic services, no production traffic.
// Run from AsiSportv2: node scripts/preview-superadmin-asistencia.mjs
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=`
const empty=new URLSearchParams(location.search).get('scenario')==='empty';
const coach=new URLSearchParams(location.search).get('scenario')==='coach';
const role=coach?'Entrenador':'SuperAdministrador';
const profile={id:'actor',rol:role,escuela_id:'fixture',sucursal_id:null,nombres:'Usuario',apellidos:'Prueba'};
const groups=[{id:'a',nombre:'Grupo A',horario_ids:['h1']},{id:'b',nombre:'Grupo B',horario_ids:['h2']}];
const trainers=empty?[]:[{id:'coach',nombres:'Entrenador',apellidos:'Prueba'}];
const students=empty?[]:[
{id:'s1',nombres:'Ana',apellidos:'Sin entrenador',cancha_id:'a',horario_id:'h1',estado:'Pendiente'},
{id:'s2',nombres:'Bruno',apellidos:'Con entrenador',cancha_id:'b',horario_id:'h2',profesor_asignado_id:'coach',estado:'Aprobado'}];
const records=new Map();
export const useAuth=()=>({isAdmin:!coach,role,userProfile:profile,escuelaId:'fixture',user:{id:'actor'}});
export const useToast=()=>({addToast:()=>{}});
export const useMasterData=()=>({canchas:groups,entrenadores:trainers,isLoading:false});
export const getAlumnosFacets=async()=>students;
export const getEscuelaActual=async()=>({nombre:'Escuela de prueba'});
export const logActivity=()=>{};
export const subirFotoAsistenciaGrupal=async()=>{};
export const cargarAsistenciaAsisport=async(fecha,group,hour,trainer)=>{
  const candidatos=students.filter(a=>(!group||a.cancha_id===group)&&(!hour||a.horario_id===hour)&&(!trainer||a.profesor_asignado_id===trainer));
  const existing=candidatos.map(a=>records.get(a.id)).filter(Boolean);
  return {candidatos,asistencias_existentes:existing,estado_envio:{existe:existing.length>0,cantidad:existing.length}};
};
export const registrarAsistenciasPorLote=async(items,fecha,trainer)=>{
  for(const a of items)records.set(a.alumnoId,{alumno_id:a.alumnoId,estado:a.estado,fecha,entrenador_id:trainer||profile.id});
  return {exitosos:items.length,fallidos:0,errores:[]};
};
`;
const result=await build({
  absWorkingDir:root,bundle:true,write:false,format:'esm',jsx:'automatic',
  stdin:{contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MemoryRouter} from 'react-router-dom';
    import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
    import Asistencia from './src/pages/Asistencia.jsx';
    createRoot(document.getElementById('root')).render(
      <MemoryRouter initialEntries={['/asistencia']}>
      <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>
      <Asistencia/></QueryClientProvider></MemoryRouter>);
  `,resolveDir:root,loader:'jsx'},
  plugins:[{name:'synthetic-backend',setup(b){
    b.onResolve({filter:/context\/AuthContext|components\/ui\/Toast|hooks\/useMasterData|services\/(asistencias|alumnos|escuelas|fotoAsistenciaGrupal)$|lib\/auditLogger/},
      ()=>({path:'fixture',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:data,loader:'js'}));
  }}]
});
const cssPath=readdirSync(resolve(root,'dist/assets')).find(p=>p.endsWith('.css'));
const css=readFileSync(resolve(root,'dist/assets',cssPath));
createServer((req,res)=>{
  if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(result.outputFiles[0].text);}
  else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}
  else if(req.url==='/favicon.ico'){res.writeHead(204);res.end();}
  else {res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Prueba local de asistencia</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');}
}).listen(4318,'127.0.0.1',()=>console.log('Attendance fixture: http://127.0.0.1:4318/?scenario=empty'));
