import { createHash } from 'node:crypto';
import { rich, block, buildReports, reportBlocks } from './diagnostico.mjs';
import { diagnosticPdf } from './diagnostico-pdf.mjs';
const API='https://api.notion.com/v1';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export const configReady = env => Boolean(env.NOTION_DIAGNOSTIC_TOKEN && env.NOTION_PROJECTS_DATA_SOURCE_ID);
export function notionClient(env=process.env, transport=fetch) {
  let last=0;
  return async function call(path,body,method='POST',form=false) {
    await pause(Math.max(0,350-(Date.now()-last))); last=Date.now();
    for(let attempt=0;attempt<3;attempt++) {
      const response=await transport(API+path,{method,headers:{Authorization:`Bearer ${env.NOTION_DIAGNOSTIC_TOKEN}`,'Notion-Version':'2025-09-03',...(form?{}:{'Content-Type':'application/json'})},...(body!==undefined?{body:form?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(18000)});
      if(response.status===429 && attempt<2) {await pause(Math.min(5000,Math.max(500,Number(response.headers.get('retry-after')||1)*1000)));continue;}
      if(!response.ok) throw Object.assign(new Error('Notion request failed'),{serviceStatus:response.status});
      return response.json();
    }
  };
}
async function allChildren(call,id) {
  const blocks=[];let cursor='';
  do {
    const r=await call(`/blocks/${id}/children?page_size=100${cursor?'&start_cursor='+encodeURIComponent(cursor):''}`,undefined,'GET');
    blocks.push(...r.results);cursor=r.has_more?r.next_cursor:'';
  } while(cursor);
  return blocks;
}
async function ensureReport(call,parent,report,known) {
  let page=known.find(b=>b.type==='child_page'&&b.child_page.title===report.title);
  let id=page?.id;
  if(!id) { const r=await call('/pages',{parent:{page_id:parent},properties:{title:{title:rich(report.title)}},children:[]});id=r.id; }
  // Contenido reproducible: reanuda por bloques guardados, sin sobrescribir revisiones humanas.
  const existing=await allChildren(call,id);const blocks=reportBlocks(report);
  for(let i=existing.length;i<blocks.length;i+=80) await call(`/blocks/${id}/children`,{children:blocks.slice(i,i+80)},'PATCH');
  return id;
}
// Conserva los adjuntos ajenos al flujo y guarda cada PDF antes de continuar: los reintentos
// recuperan el archivo ya adjuntado si el siguiente paso o la respuesta de red fallan.
export async function ensureDiagnosticPdfs(call, projectId, reports, company, reference) {
  const definitions=[['procesos',reports.processes],['automatizaciones',reports.automation]];
  for(const [kind,report] of definitions) {
    const name=`diagnostico-${kind}-${reference}.pdf`;
    const page=await call(`/pages/${projectId}`,undefined,'GET');
    const files=page.properties?.['Adjuntar archivo']?.files;
    if(!Array.isArray(files))throw new Error('No se encuentra la propiedad de archivos del proyecto.');
    if(files.some(f=>f.name===name))continue;
    if(files.length>=100)throw new Error('No hay espacio para más adjuntos en este proyecto.');
    const pdf=await diagnosticPdf(report,{company,reference});
    if(pdf.length>5*1024*1024)throw new Error('El informe PDF supera el tamaño permitido.');
    const upload=await call('/file_uploads',{mode:'single_part',filename:name,content_type:'application/pdf'});
    const form=new FormData();form.append('file',new Blob([pdf],{type:'application/pdf'}),name);
    await call(`/file_uploads/${upload.id}/send`,form,'POST',true);
    // Volver a leer evita descartar adjuntos añadidos durante la generación.
    const latest=await call(`/pages/${projectId}`,undefined,'GET');
    const current=latest.properties?.['Adjuntar archivo']?.files;
    if(!Array.isArray(current))throw new Error('No se pueden confirmar los adjuntos.');
    if(current.some(f=>f.name===name))continue;
    if(current.length>=100)throw new Error('No hay espacio para más adjuntos en este proyecto.');
    const preserved=current.map(f=>({name:f.name,type:f.type,[f.type]:f.type==='file_upload'?{id:f.file_upload.id}:{url:f[f.type].url}}));
    await call(`/pages/${projectId}`,{properties:{'Adjuntar archivo':{files:[...preserved,{name,type:'file_upload',file_upload:{id:upload.id}}]}}},'PATCH');
  }
  const verified=await call(`/pages/${projectId}`,undefined,'GET');
  const files=verified.properties?.['Adjuntar archivo']?.files||[];
  if(definitions.some(([kind])=>!files.some(f=>f.name===`diagnostico-${kind}-${reference}.pdf`)))throw new Error('No se han confirmado los PDF adjuntos.');
}
export async function saveDiagnostic(a,submission,{env=process.env,call=notionClient(env)}={}) {
  const reports=buildReports(a);
  const reference='BQ-'+submission.id.toUpperCase();
  const title=`Diagnóstico · ${a.r.E1} · ${reference}`;
  const stable=JSON.parse(JSON.stringify(a));
  delete stable.actualizado; delete stable.r._submissionId; delete stable.r._submissionHash;
  const digest=createHash('sha256').update(JSON.stringify(stable)).digest('hex');
  // Búsqueda persistente para reintentos. Notion no impone unicidad entre instancias simultáneas.
  const query=await call(`/data_sources/${env.NOTION_PROJECTS_DATA_SOURCE_ID}/query`,{filter:{property:'Referencia diagnóstico',rich_text:{equals:reference}},page_size:1});
  let project=query.results[0];
  const now=new Date();const deadline=new Date(now.getTime()+72*3600*1000).toISOString();
  if(!project) {
    // Respuestas originales adjuntas antes de crear el proyecto. Nunca se publican como URL pública.
    const filename=`respuestas-${reference}.txt`;
    const upload=await call('/file_uploads',{mode:'single_part',filename,content_type:'text/plain'});
    const form=new FormData();form.append('file',new Blob([JSON.stringify({submission:{id:submission.id,consent:true,privacyVersion:submission.privacyVersion,receivedAt:now.toISOString(),deadline},answers:a},null,2)],{type:'text/plain'}),filename);
    await call(`/file_uploads/${upload.id}/send`,form,'POST',true);
    project=await call('/pages',{
      parent:{type:'data_source_id',data_source_id:env.NOTION_PROJECTS_DATA_SOURCE_ID},
      properties:{'Nombre del proyecto':{title:rich(title)},Estado:{status:{name:'Sin empezar'}},Prioridad:{select:{name:'Alta'}},'Referencia diagnóstico':{rich_text:rich(reference)},'Facturación declarada':{rich_text:rich(reports.price.revenue)},'Honorarios propuestos (€)':{number:reports.price.pack},'Revisión diagnóstico':{select:{name:'Pendiente'}},'Fecha de inicio':{date:{start:now.toISOString()}},'Fecha de finalización':{date:{start:deadline}}},
      children:[block('paragraph',`Referencia ${reference}. Huella de las respuestas: ${digest}. Confidencial · Uso interno de Banteq.`),block('paragraph',`Contacto: ${a.persona.nombre} · ${a.persona.puesto||'Puesto no indicado'} · ${a.r.contactEmail} · ${a.r.contactPhone||'Sin teléfono'}.`),block('paragraph',`Plazo máximo de contacto: ${deadline} (72 horas naturales). Preparación automática; revisión y envío por Banteq. Al enviar no hay contratación ni cobro.`),{object:'block',type:'file',file:{type:'file_upload',file_upload:{id:upload.id},caption:rich('Respuestas originales y consentimiento (JSON en archivo de texto)')}},block('paragraph',`Propuesta interna sin IVA: procesos ${reports.price.processes} €, automatizaciones ${reports.price.automation} €, pack ${reports.price.pack} €. Pendiente de aprobación. ${reports.price.reason}`)]
    });
  }
  const children=await allChildren(call,project.id);
  const fingerprint=children.find(b=>b.type==='paragraph')?.paragraph?.rich_text?.map(t=>t.plain_text??t.text?.content??'').join('')||'';
  if(fingerprint && !fingerprint.includes(digest)) throw Object.assign(new Error('Esta referencia ya corresponde a otras respuestas. Descarga una copia y contacta con Banteq.'),{status:409});
  const ids=[];
  // Secuencial para respetar límites del proveedor y permitir reanudar envíos interrumpidos.
  for(const report of [reports.processes,reports.automation,reports.internal]) ids.push(await ensureReport(call,project.id,report,children));
  const verified=await allChildren(call,project.id);
  if(ids.some(id=>!verified.some(b=>b.id===id))) throw new Error('No se han confirmado los informes.');
  await ensureDiagnosticPdfs(call,project.id,reports,a.r.E1,reference);
  return {reference,projectId:project.id,deadline:project.properties?.['Fecha de finalización']?.date?.start||deadline};
}
