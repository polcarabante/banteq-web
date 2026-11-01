import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/diagnosticos.js';
import {validateSubmission,measurement,pricing,buildReports,reportBlocks,rich} from '../lib/diagnostico.mjs';
import {saveDiagnostic} from '../lib/notion-diagnostico.mjs';
import {fixture} from './fixture.mjs';

test('volumen, tiempo activo y excepciones; esperas no se convierten en ahorro',()=>{const a=fixture().answers;const p=a.areas.ventas.procesos[0];assert.equal(measurement(p).hours,25);const r=buildReports(a);const auto=r.automation.sections[1].body.join('\n');assert.match(auto,/22.5 h\/mes/);assert.match(auto,/no equivale a ahorro/);assert.equal(r.automation.sections.length,3);assert.match(auto,/pendientes de presupuesto/);});
test('cero es un dato válido y las ausencias no se convierten en ceros',()=>{const p=fixture().answers.areas.ventas.procesos[0];p.medicion.casosMes='0';assert.equal(measurement(p).hours,0);p.medicion.casosMes='';assert.equal(measurement(p).hours,null);});
test('contradicciones y ausencia de fuente impiden dar un techo como confirmado',()=>{const p=fixture().answers.areas.ventas.procesos[0];p.horas='Menos de 1 h';assert.match(measurement(p).warnings.join(' '),/no concuerda/);delete p.medicion.fuente;assert.match(measurement(p).warnings.join(' '),/Falta fuente/);});
test('tarifa base y propuesta por facturación; nunca precio contractual',()=>{const a=fixture().answers;assert.equal(pricing(a).pack,450);a.r.E12='Más de 10 M€';assert.equal(pricing(a).pack,900);assert.equal(pricing(a).needsReview,true);a.r.E12='Prefiero no decirlo';assert.match(pricing(a).reason,/desconocido/);});
test('validación exige consentimiento, contacto y al menos un proceso',()=>{const b=fixture();assert.equal(validateSubmission(b),b.answers);b.consent=false;assert.throws(()=>validateSubmission(b),/privacidad/);b.consent=true;b.answers.r.contactEmail='no';assert.throws(()=>validateSubmission(b),/correo/);b.answers.r.contactEmail='a@example.invalid';b.answers.areas.ventas.procesos[0].medicion.porcentajeExcepciones='101';assert.throws(()=>validateSubmission(b),/numéricos/);});
test('los bloques de Notion conservan textos largos dentro de sus límites',()=>{const str='x'.repeat(6000);const r=rich(str);assert.equal(r.map(t=>t.text.content).join(''),str);assert.ok(r.every(t=>t.text.content.length<=1800));assert.ok(reportBlocks(buildReports(fixture().answers).processes).length>5);});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.data=JSON.parse(v);}};}
test('sin configuración el endpoint rechaza sin fingir un envío guardado',async()=>{const res=response();await handler({method:'POST',headers:{origin:'https://banteq.com',host:'banteq.com'},body:fixture()},res);assert.equal(res.statusCode,503);assert.equal(res.data.ok,undefined);});
test('origen externo rechazado',async()=>{const res=response();await handler({method:'POST',headers:{origin:'https://otro.example',host:'banteq.com'},body:fixture()},res);assert.equal(res.statusCode,403);});
test('reintento recupera el proyecto y sus informes; payload distinto no reutiliza la referencia',async()=>{
 const body=fixture(),a=body.answers;const db={projects:[],blocks:{}};let seq=0;
 const call=async(path,data,method)=>{
  if(path.includes('/query'))return {results:db.projects};
  if(path==='/file_uploads')return {id:'upload'};
  if(path.endsWith('/send'))return {status:'uploaded'};
  if(path==='/pages'){
   const id='p'+(++seq);const p={id,properties:data.properties};db.blocks[id]=data.children||[];
   if(data.parent.data_source_id)db.projects.push(p);
   else db.blocks[data.parent.page_id].push({id,type:'child_page',child_page:{title:data.properties.title.title[0].text.content}});
   return p;
  }
  const id=path.match(/^\/blocks\/([^/]+)\/children/)?.[1];
  if(id){if(method==='PATCH'){db.blocks[id].push(...data.children);return {};}return {results:db.blocks[id],has_more:false};}
  throw new Error('unexpected '+path);
 };
 const opts={env:{NOTION_PROJECTS_DATA_SOURCE_ID:'ds'},call};
 const r=await saveDiagnostic(a,body,opts);assert.match(r.reference,/BQ-/);assert.equal(db.projects.length,1);
 a.actualizado=new Date().toISOString();a.r._submissionHash='transient';
 await saveDiagnostic(a,body,opts);assert.equal(db.projects.length,1);assert.equal(seq,4);
 a.r.E10='Cambio';await assert.rejects(saveDiagnostic(a,body,opts),/otras respuestas/);
});

test('disponibilidad pública sin revelar credenciales',async()=>{const res=response();await handler({method:'GET',headers:{}},res);assert.deepEqual(res.data,{ready:false});assert.equal(res.statusCode,200);});
