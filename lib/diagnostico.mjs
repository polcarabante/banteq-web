// Motor trazable: cada hallazgo conserva su respuesta de origen. No usa un modelo para inventar datos.
export const AREAS = ['marketing', 'ventas', 'entrega', 'administracion'];
export const value = v => Array.isArray(v) ? v.join(', ') : String(v ?? '').trim();
const txt = v => value(v) || 'Pendiente de confirmar';
const numeric = v => ['string','number'].includes(typeof v) && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null;
const round = n => Math.round(n * 100) / 100;
export const processes = a => AREAS.flatMap(area => (a.areas?.[area]?.procesos || []).map(p => ({ ...p, area })));
export function validateSubmission(body) {
  const err = m => { throw Object.assign(new Error(m), { status: 400 }); };
  if (!body || !/^[a-f0-9-]{36}$/i.test(body.id || '')) err('Recarga la página y vuelve a intentar el envío.');
  if (body.consent !== true || body.privacyVersion !== '2026-11-01') err('Confirma la política de privacidad.');
  const a = body.answers;
  if (!a || a.esquema !== 'banteq-diagnostico-procesos/3' || !a.r || !a.persona || !a.areas) err('El archivo de respuestas no es compatible.');
  if (!value(a.r.E1) || value(a.r.E1).length > 160 || !value(a.persona.nombre) || value(a.persona.nombre).length > 120) err('Revisa el nombre de la empresa y de la persona de contacto.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.r.contactEmail || '') || a.r.contactEmail.length > 254) err('Revisa el correo de contacto.');
  for (const key of AREAS) {
    if (!a.areas[key] || !Array.isArray(a.areas[key].procesos) || a.areas[key].procesos.length > 40) err('Revisa los procesos de cada área.');
  }
  for (const key of ['puestos','herramientas','externos']) if (!Array.isArray(a[key]) || a[key].length > 100) err('Revisa los puestos y las herramientas.');
  const ps = processes(a);
  if (!ps.length || !ps.some(p => Array.isArray(p.pasos) && p.pasos.some(s => value(s.que)))) err('Describe al menos un proceso y sus pasos.');
  for (const p of ps) {
    if (!Array.isArray(p.pasos) || p.pasos.length > 80 || !value(p.nombre) || !value(p.id)) err('Revisa los pasos de los procesos.');
    for (const [k,v] of Object.entries(p.medicion || {})) {
      if (['casosMes','minutosCaso','minutosEspera','minutosRetrabajoMes','costeHoraExacto','porcentajeExcepciones'].includes(k) && v !== '' && (numeric(v) === null || Number(v) > (k === 'porcentajeExcepciones' ? 100 : 1e8))) err('Revisa los valores numéricos del proceso ' + p.nombre + '.');
    }
  }
  const check = (v,depth=0) => {
    if (depth > 16) err('La estructura del cuestionario no es válida.');
    if (typeof v === 'string' && v.length > 6000) err('Una respuesta es demasiado larga (máximo 6.000 caracteres).');
    if (Array.isArray(v) && v.length > 200) err('Hay demasiadas entradas en una respuesta.');
    if (v && typeof v === 'object') for (const [k,x] of Object.entries(v)) {
      if (['__proto__','constructor','prototype'].includes(k)) err('La estructura del cuestionario no es válida.');
      check(x,depth+1);
    }
  }; check(a);
  return a;
}
export function measurement(p) {
  const m = p.medicion || {};
  const volume = numeric(m.casosMes), minutes = numeric(m.minutosCaso), cost = numeric(m.costeHoraExacto);
  const hours = volume !== null && minutes !== null ? round(volume * minutes / 60) : null;
  const exceptions = numeric(m.porcentajeExcepciones);
  const source = value(m.fuente), period = value(m.periodo);
  const warnings = [];
  if (!source || !period) warnings.push('Falta fuente o periodo de medición; no tratar como medición confirmada.');
  const weekly = {'Menos de 1 h':[0,1],'1 a 3 h':[1,3],'3 a 5 h':[3,5],'5 a 10 h':[5,10],'Más de 10 h':[10,Infinity]}[p.horas];
  if (hours !== null && weekly && (hours < weekly[0]*4.3*0.6 || hours > weekly[1]*4.3*1.4)) warnings.push('El tiempo por caso no concuerda con las horas semanales: validar antes de valorar ahorro.');
  if (hours !== null && numeric(m.minutosRetrabajoMes) > hours*60) warnings.push('El retrabajo supera el tiempo activo declarado.');
  return {volume,minutes,cost,hours,exceptions,source,period,warnings};
}
// Parámetros iniciales propuestos, no tarifas aprobadas ni precios enviados al cliente.
export const PRICING = {version:'propuesta-2026-11-01',processes:290,automation:240,pack:450,discount:0.5,threshold:500};
export function pricing(a, config=PRICING) {
  const n = processes(a).length;
  const revenue = value(a.r.E12);
  const byRevenue = {'Menos de 100.000 €':1,'100.000 a 500.000 €':1,'500.000 € a 2 M€':1.25,'2 a 10 M€':1.6,'Más de 10 M€':2}[revenue];
  const scope = n <= 3 ? 1 : n <= 8 ? 1.25 : n <= 15 ? 1.6 : 2;
  const factor = Math.max(byRevenue || 1,scope);
  return {version:config.version,processes:Math.ceil(config.processes*factor/5)*5,automation:Math.ceil(config.automation*factor/5)*5,pack:Math.ceil(config.pack*factor/5)*5,factor,revenue:revenue||'No indicado',needsReview:true,reason:`Factor ${factor}: mayor de tramo de facturación (${byRevenue || 'desconocido: base provisional'}) y alcance (${n} procesos: ${scope}). Confirmar sedes, complejidad y horas de consultoría.`,promotion:`Si la implantación contratada suma ${config.threshold} € sin IVA, descuento del ${config.discount*100} % en el diagnóstico o pack contratado; no afecta al mantenimiento. No aplicado ahora: no hay implantación contratada.`};
}
export function buildReports(a) {
  const ps = processes(a), gaps = [], opportunityRows=[];
  const processSections = ps.map(p => {
    const ref = `${p.area}/${p.id}`;
    const pending = [['inicio','inicio'],['necesita','entradas'],['fin','resultado'],['duenoNombre','responsable'],['control','control'],['instrucciones','documentación']].filter(([key])=>!value(p[key])).map(([,label])=>label);
    const m=measurement(p);
    if (pending.length) gaps.push(`${p.nombre}: faltan ${pending.join(', ')} [${ref}].`);
    const steps=p.pasos.map((s,i)=>`${i+1}. ${txt(s.que)} · Responsable: ${txt(s.quienNombre)} · Herramienta: ${txt(s.conNombre)} · Método: ${txt(s.modoNombre||s.modo)} · Tiempo declarado: ${txt(s.tarda)}${s.decide?` · Decisión: ${txt(s.decision)} · Alternativa: ${txt(s.siNoTexto||s.siNo)}`:''}`);
    const manual=p.pasos.filter(s=>['mano','copiar','plantilla'].includes(s.modo)&&s.quien!=='x:cliente'&&s.quien!=='x:auto');
    if(manual.length && p.automatizar!=='No, mejor a mano') {
      // Una única oportunidad por proceso evita sumar ahorros solapados.
      const copy=manual.some(s=>s.modo==='copiar');
      const title=copy?'Evitar la doble introducción de datos':'Preparar tareas repetitivas para revisión';
      const candidates=[];
      if(copy)candidates.push('Conectar origen y destino para registrar una sola vez, con validación y deduplicación');
      const words=manual.map(s=>s.que||'').join(' ').toLowerCase();
      if(/presupuesto|factura|document|contrato|albar[aá]n/.test(words))candidates.push('Preparar documentos con plantillas y reglas; revisión humana de precios y condiciones');
      if(/record|seguimiento|avis|reclama|confirm|cita/.test(words))candidates.push('Programar avisos y seguimientos con reglas de parada y escalado');
      if(/correo|mensaje|solicitud|clasific/.test(words))candidates.push('Clasificar entradas y preparar respuestas; evaluar IA solo con ejemplos y supervisión');
      if(/informe|report|indicador|resumen|concili/.test(words))candidates.push('Consolidar registros y preparar informes; comprobar fuentes y cifras');
      if(!candidates.length)candidates.push('Estandarizar entradas y separar reglas repetitivas de decisiones humanas antes de automatizar');

      const eligible=m.hours!==null && m.exceptions!==null && m.source && m.period && !m.warnings.length;
      // No se inventa una reducción: horas elegibles son un techo, ahorro neto pendiente de piloto.
      const ceiling=eligible?round(m.hours*(1-m.exceptions/100)):null;
      const linked=a.herramientas.filter(t=>manual.some(s=>[s.con,s.copiaDe,s.copiaA].includes(t.id)));
      const blocked=linked.some(t=>t.conexion==='Solo podemos usar la pantalla');
      const score=(copy?3:1)+(m.hours!==null&&m.hours>=10?2:0)+(p.duplicado?.startsWith('Sí')?1:0)-(blocked?3:0)-(p.automatizar==='No lo tengo claro'?2:0);
      opportunityRows.push({process:p.nombre,ref,title,score,ceiling,body:[
        `Problema declarado: ${txt(p.fallos)}. Pasos: ${manual.map(s=>s.que).join(' → ')}.`,
        `Propuesta preliminar: ${copy?'transferir datos entre los sistemas declarados, con validación y registro de errores':'usar reglas o plantillas para preparar borradores y asignarlos a una persona'}. La IA solo se considerará si hay texto no estructurado y una validación fiable; validar en revisión.`,
        `Líneas a evaluar en este proceso (no se suman sus ahorros entre sí): ${candidates.join("; ")}.`,
        `Sistemas: ${linked.map(t=>`${t.nombre}: ${txt(t.conexion)}; datos ${txt(t.calidadDatos)}`).join('; ')||'Sin identificar: confirmar origen, destino y permisos.'}`,
        `Supervisión humana: ${txt(p.supervision)}. Excepción: ${txt(p.medicion?.excepcion)}. Recuperación ante fallos: ${txt(p.medicion?.siFalla)}.`,
        `Medición de partida: ${m.hours===null?'sin volumen y tiempo suficientes':`${m.volume} casos/mes × ${m.minutes} minutos activos de todo el equipo ÷ 60 = ${m.hours} h/mes`}. Fuente: ${txt(m.source)}; periodo: ${txt(m.period)}. Esperas excluidas: ${txt(p.medicion?.minutosEspera)} min/caso.`,
        `Techo de tiempo elegible: ${ceiling===null?'pendiente de datos consistentes':`${ceiling} h/mes, después de excluir ${m.exceptions} % de excepciones; no equivale a ahorro`}. Ahorro neto, porcentaje de reducción y tiempo de revisión: pendientes de piloto. No se suman suboportunidades de este proceso.`,
        `Valor del tiempo: ${m.cost===null?'coste/h no confirmado':`${m.cost} €/h declarados`}. Ahorro económico efectivo, inversión de implantación, mantenimiento, licencias y ROI: pendientes de presupuesto y piloto; no se confunden horas liberadas con reducción de gastos.`,
        `Criterio de aceptación: ${txt(p.medicion?.pruebaExito)}. Dependencias: ${blocked?'no hay conexión documentada; estudiar antes de comprometer viabilidad':'confirmar integración, permisos, calidad de datos y seguridad'}.`,
        `Prioridad preliminar: ${score} puntos (duplicidad, trabajo manual y carga; penaliza bloqueo técnico y dudas del cliente). ${m.warnings.join(' ')}`
      ]});
    }
    return {title:`${p.nombre} [${ref}]`,body:[`Área: ${p.area}. Responsable: ${txt(p.duenoNombre)}. Participantes: ${txt(p.personas)}.`,`Inicio: ${txt(p.inicio)}. Entradas: ${txt(p.necesita)}. Frecuencia: ${txt(p.frecuencia)}. Volumen: ${txt(p.volumen)}.`,...steps,`Resultado: ${txt(p.fin)}. Registros: ${txt(p.salidas)}. Control: ${txt(p.control)}.`,`Problemas: ${txt(p.fallos)}. Frecuencia: ${txt(p.falloFrecuencia)}. Efectos: ${txt(p.falloEfecto)}.`,`Instrucciones: ${txt(p.instrucciones)}. Ubicación: ${txt(p.instruccionesDonde)}. Indicadores: ${txt(p.medida)}. Objetivo: ${txt(p.objetivo)}.`,`Medición: ${m.hours===null?'Pendiente':`${m.hours} h activas/mes declaradas`}. ${m.warnings.join(' ')}`,`Reglas: ${txt(p.medicion?.reglas)}. Excepción: ${txt(p.medicion?.excepcion)}. Notas: ${txt(p.nota)}.`]};
  });
  const quality=Object.entries(a.preguntas||{}).filter(([key])=>/^C\d/.test(key)).map(([key,q])=>`${key} · ${q.texto}: ${txt(a.r[key])}. Estado: ${value(a.r[key])?'declarado por la empresa, evidencia no revisada':'sin datos'}.`);
  const price=pricing(a);
  return {price,processes:{title:'Diagnóstico de procesos',sections:[{title:'Alcance y límites',body:[`Empresa: ${txt(a.r.E1)}. Sector/actividad: ${txt(a.r.E3)} · ${txt(a.r.E6)}. Alcance: ${txt(a.r.E17)}. Exclusiones: ${txt(a.r.E21)}.`, 'BORRADOR · Pendiente de revisión de Banteq. Se describe lo declarado, sin acceso a sistemas ni verificación de evidencias. Este documento no acredita conformidad ni preparación para certificar ISO 9001. Edición declarada: '+txt(a.r.E20)+'. Validar la edición y los requisitos aplicables con el consultor de calidad.',`Objetivos: ${txt(a.r.E10)}. Resultado esperado: ${txt(a.r.E19)}.`]},...processSections,{title:'Calidad y preparación hacia ISO 9001',body:quality.length?quality:['Faltan las preguntas de calidad.']},{title:'Plan de validación',body:[...gaps,'Confirmar responsables, alcance y la secuencia de cada proceso con quienes lo ejecutan.','Revisar evidencias, riesgos, oportunidades, indicadores y eficacia de acciones; acordar prioridades y fechas.']} ]},automation:{title:'Diagnóstico de oportunidades de automatización',sections:[{title:'Alcance y método',body:['BORRADOR · Pendiente de validación técnica y económica. Oportunidades identificadas en los procesos descritos; no se afirma haber encontrado todas las de la empresa.','Las prioridades orientan una revisión, no sustituyen un estudio de viabilidad. IA, automatización por reglas y mejora del proceso se valoran por separado.']},...opportunityRows.sort((x,y)=>y.score-x.score).map((o,i)=>({title:`${i+1}. ${o.title} · ${o.process} [${o.ref}]`,body:o.body})),{title:'Riesgos y siguiente paso',body:[`Categorías de datos: ${txt(a.r.V1)}. Restricciones: ${txt(a.r.V2)}. Pruebas con datos ficticios: ${txt(a.r.V3)}.`,'Seleccionar un piloto; confirmar integración, permisos, casos de prueba y responsable; medir errores y tiempo de revisión; aprobar presupuesto antes de implantar.',`Oportunidades preliminares: ${opportunityRows.length}. Totales de ahorro e inversión: pendientes de validar. No se suman máximos teóricos ni cifras sin datos suficientes.`]}]},internal:{title:'Propuesta comercial interna',sections:[{title:'Pendiente de aprobación · Sin IVA',body:[`Facturación declarada: ${price.revenue}. ${price.reason}`,`Procesos: ${price.processes} €. Automatizaciones: ${price.automation} €. Pack: ${price.pack} €. Propuesta calculada con ${price.version}; no es tarifa aprobada ni oferta enviada.`,price.promotion,'Separar diagnóstico, implantación, mantenimiento y terceros. No aplicar promoción sin contratación que cumpla el umbral. No enviar honorarios al cliente automáticamente.','Revisión obligatoria: fuentes, cifras, viabilidad, ISO aplicable, alcance, precios y condiciones de entrega.']} ]}};
}
export const rich = text => {
 const s=String(text); const chunks=[]; for(let i=0;i<s.length;i+=1800) chunks.push({type:'text',text:{content:s.slice(i,i+1800)}});return chunks.length?chunks:[{type:'text',text:{content:' '}}];
};
export const block = (type,text) => ({object:'block',type,[type]:{rich_text:rich(text)}});
export function reportBlocks(report) {return report.sections.flatMap(s=>[block('heading_2',s.title),...s.body.map(t=>block('paragraph',t))]);}
