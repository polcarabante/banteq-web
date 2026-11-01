import { validateSubmission } from '../lib/diagnostico.mjs';
import { configReady, saveDiagnostic } from '../lib/notion-diagnostico.mjs';
export const config={maxDuration:120};
const inFlight=new Map();const hits=new Map();
const reply=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
export default async function handler(req,res) {
  if(req.method==='GET') return reply(res,200,{ready:configReady(process.env)});
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return reply(res,405,{error:'Método no permitido.'});}
  const origin=req.headers.origin;
  const host=String(req.headers.host||'');
  let originHost;try{originHost=new URL(origin).host;}catch{}
  if(!originHost||originHost!==host) return reply(res,403,{error:'Envía el cuestionario desde esta web.'});
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const recent=(hits.get(ip)||[]).filter(t=>Date.now()-t<15*60000);
  if(recent.length>=6) return reply(res,429,{error:'Espera unos minutos antes de volver a intentarlo.'});
  recent.push(Date.now());hits.set(ip,recent);if(hits.size>5000)hits.clear();
  try {
    const raw=typeof req.body==='string'?req.body:Buffer.isBuffer(req.body)?req.body.toString('utf8'):JSON.stringify(req.body||{});
    if(Buffer.byteLength(raw)>350000) return reply(res,413,{error:'El cuestionario es demasiado grande. Reduce los comentarios o contacta con Banteq.'});
    const body=JSON.parse(raw);const a=validateSubmission(body);
    if(!configReady(process.env)) return reply(res,503,{error:'El envío del cuestionario está temporalmente desactivado. Guarda una copia y contacta con Banteq.'});
    let work=inFlight.get(body.id);
    if(!work){work=saveDiagnostic(a,body);inFlight.set(body.id,work);work.finally(()=>inFlight.delete(body.id)).catch(()=>{});}
    const saved=await work;
    return reply(res,200,{ok:true,reference:saved.reference,deadline:saved.deadline});
  }catch(error){
    // No registrar respuestas, contactos, tokens ni errores completos del proveedor.
    console.error('Diagnostic submission failure',{status:error.status||500,serviceStatus:error.serviceStatus||null});
    return reply(res,error.status||502,{error:error.status?error.message:'No se ha podido confirmar el envío completo. Tus respuestas están guardadas; vuelve a intentarlo.'});
  }
}
