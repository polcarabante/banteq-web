// Reservas de videollamada con Banteq, lado servidor (api/reservas.js y api/reservas-recordatorios.js).
//
// Dónde se guardan: en Brevo, como contactos de la lista BREVO_RESERVAS_LIST_ID con el atributo
// RESERVA_INICIO (inicio en ISO UTC). Así no hace falta otro servicio (lo decidió Pol el 2026-11-25).
// Los huecos ocupados se leen de esa lista.
//
// Recordatorio una hora antes: Brevo solo programa correos hasta 72 h vista (guía «Schedule emails»).
// Si la llamada cae dentro de ese plazo, se programa al reservar; si no, la reserva queda con
// RESERVA_RECORDATORIO = «pendiente» y el cron diario (api/reservas-recordatorios.js, vercel.json) lo
// programa cuando ya cabe.
//
// Variables: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, BREVO_ADMIN_EMAIL (o
// RESERVAS_ADMIN_EMAIL), BREVO_RESERVAS_LIST_ID y VIDEOLLAMADA_URL (enlace fijo de Meet o Zoom; sin
// él, los correos dicen que el enlace llegará antes de la reunión). Con RESERVAS_SIMULAR=1 (solo en
// local) no se llama a Brevo: las reservas se guardan en un JSON y los correos como HTML en
// RESERVAS_SIMULAR_DIR (por defecto /tmp/banteq-reservas).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AGENDA, enMadrid, ics } from "./agenda.mjs";

const BREVO = "https://api.brevo.com/v3";
export const MAX_PROGRAMAR_MS = 72 * 3600 * 1000 - 10 * 60 * 1000; // 72 h, con margen
const ATRIBUTOS = [
  ["NOMBRE", "text"], ["EMPRESA", "text"], ["TELEFONO", "text"], ["MENSAJE", "text"], ["ESTADO", "text"], ["FECHA_ENVIO", "date"],
  ["FECHA_HORA", "text"], ["TIPO_SOLICITUD", "text"], ["PAGINA", "text"], ["ULTIMA_PROCEDENCIA_WEB", "text"], ["ULTIMA_ENTRADA_WEB", "text"],
  ["RESERVA_INICIO", "text"], ["RESERVA_RECORDATORIO", "text"], ["RESERVA_IDIOMA", "text"], ["RESERVA_REF", "text"],
];

export const simulado = () => process.env.RESERVAS_SIMULAR === "1";
const dirSimulado = () => process.env.RESERVAS_SIMULAR_DIR || "/tmp/banteq-reservas";
const listaReservas = () => Number(String(process.env.BREVO_RESERVAS_LIST_ID || "").replace("#", "").trim()) || 0;
export const activo = () => simulado() || Boolean(process.env.BREVO_API_KEY && listaReservas() && process.env.BREVO_SENDER_EMAIL);
export const fallo = (code, message, status = 502) => Object.assign(new Error(message), { publicCode: code, publicStatus: status });

async function brevo(ruta, cuerpo, metodo = cuerpo ? "POST" : "GET") {
  const r = await fetch(`${BREVO}${ruta}`, {
    method: metodo,
    headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) throw Object.assign(new Error(`Brevo ${r.status} en ${ruta.split("?")[0]}`), { status: r.status, detalle: (await r.text()).slice(0, 400) });
  return r.status === 204 ? null : r.json().catch(() => null);
}

let atributosListos = false;
async function asegurarAtributos() {
  if (atributosListos) return;
  await Promise.all(ATRIBUTOS.map(([nombre, tipo]) => brevo(`/contacts/attributes/normal/${nombre}`, { type: tipo }).catch((e) => {
    if (!/exist|duplicate/i.test(e.detalle || "")) console.error("Reservas: atributo de Brevo", JSON.stringify({ nombre, status: e.status, detalle: e.detalle }));
  })));
  atributosListos = true;
}

// --- Reservas guardadas ----------------------------------------------------------------------------

// Reservas futuras: [{ email, nombre, inicio, recordatorio, idioma, ref }].
export async function reservasFuturas(ahora = new Date()) {
  let todas = [];
  if (simulado()) {
    todas = JSON.parse(await readFile(join(dirSimulado(), "reservas.json"), "utf8").catch(() => "[]"));
  } else {
    const lista = listaReservas();
    for (let offset = 0; offset < 2500; offset += 500) {
      const r = await brevo(`/contacts/lists/${lista}/contacts?limit=500&offset=${offset}&sort=desc`);
      const contactos = r?.contacts || [];
      for (const c of contactos) {
        const a = c.attributes || {};
        if (a.RESERVA_INICIO) todas.push({ email: c.email, nombre: a.NOMBRE || "", inicio: a.RESERVA_INICIO, recordatorio: a.RESERVA_RECORDATORIO || "", idioma: a.RESERVA_IDIOMA || "es", ref: a.RESERVA_REF || "" });
      }
      if (contactos.length < 500) break;
    }
  }
  return todas.filter((r) => new Date(r.inicio) > ahora);
}

export async function guardarReserva(s) {
  if (simulado()) {
    const dir = dirSimulado();
    await mkdir(dir, { recursive: true });
    const archivo = join(dir, "reservas.json");
    const todas = JSON.parse(await readFile(archivo, "utf8").catch(() => "[]")).filter((r) => r.email !== s.email);
    todas.push({ email: s.email, nombre: s.nombre, inicio: s.inicio, recordatorio: s.recordatorio, idioma: s.idioma, ref: s.ref });
    await writeFile(archivo, JSON.stringify(todas, null, 1));
    return;
  }
  await asegurarAtributos();
  // Puede ser la misma lista que la de reservas (Pol usa la 4, «VENTAS Y CRM», el 2026-11-25): sin repetirla.
  const contacto = Number(String(process.env.BREVO_CONTACT_LIST_ID || "").replace("#", "").trim()) || 0;
  const atributos = Object.fromEntries(Object.entries({
    NOMBRE: s.nombre, EMPRESA: s.empresa, TELEFONO: s.telefono, MENSAJE: s.mensaje, ESTADO: "Nuevo",
    FECHA_ENVIO: s.fecha, FECHA_HORA: s.fechaHora, TIPO_SOLICITUD: s.tipo, PAGINA: s.pagina,
    ULTIMA_PROCEDENCIA_WEB: s.procedencia, ULTIMA_ENTRADA_WEB: s.entrada,
    RESERVA_INICIO: s.inicio, RESERVA_RECORDATORIO: s.recordatorio, RESERVA_IDIOMA: s.idioma, RESERVA_REF: s.ref,
  }).filter(([, v]) => v !== undefined && v !== ""));
  await brevo("/contacts", { email: s.email, updateEnabled: true, attributes: atributos, listIds: [...new Set([listaReservas(), ...(contacto ? [contacto] : [])])] });
}

export async function marcarRecordatorio(email, estado) {
  if (simulado()) {
    const archivo = join(dirSimulado(), "reservas.json");
    const todas = JSON.parse(await readFile(archivo, "utf8").catch(() => "[]"));
    for (const r of todas) if (r.email === email) r.recordatorio = estado;
    await writeFile(archivo, JSON.stringify(todas, null, 1));
    return;
  }
  await brevo(`/contacts/${encodeURIComponent(email)}`, { attributes: { RESERVA_RECORDATORIO: estado } }, "PUT");
}

// --- Correos ----------------------------------------------------------------------------------------

const escapar = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const LOCALES = { es: "es-ES", ca: "ca-ES", en: "en-GB" };
export const fechaLarga = (iso, idioma = "es") => {
  const f = new Date(iso);
  const opc = { timeZone: AGENDA.zona };
  const dia = `${f.toLocaleDateString(LOCALES[idioma], { ...opc, weekday: "long" })} ${f.toLocaleDateString(LOCALES[idioma], { ...opc, day: "numeric", month: "long" })}`;
  const hora = f.toLocaleTimeString(LOCALES[idioma], { ...opc, hour: "2-digit", minute: "2-digit" });
  return { dia, hora, completa: { es: `${dia} a las ${hora}`, ca: `${dia} a les ${hora}`, en: `${dia} at ${hora}` }[idioma] };
};

const TEXTOS = {
  es: {
    asunto: "Videollamada con Banteq confirmada: {fecha}",
    hola: "Hola, {nombre}:",
    reservada: "Tu videollamada con Banteq queda reservada para el <strong>{fecha}</strong> (hora peninsular española). Dura {min} minutos.",
    para: "En la llamada veremos qué automatizaciones tienen sentido en tu negocio y cuánto costarían, para que en una sola reunión sepas si te interesa.",
    enlace: "Enlace de la videollamada: <a href=\"{url}\">{url}</a>",
    sinEnlace: "Te enviaremos el enlace de la videollamada antes de la reunión.",
    adjunto: "Te adjuntamos la cita para que la añadas a tu calendario.",
    recordatorio: "Una hora antes te enviaremos un recordatorio. Si necesitas cambiar la hora, responde a este correo.",
    firma: "Un saludo,<br>Pol Carabante · Banteq",
    recAsunto: "Recordatorio: videollamada con Banteq a las {hora}",
    recCuerpo: "Te recordamos que dentro de una hora, a las <strong>{hora}</strong>, tenemos la videollamada.",
    recFirma: "Hasta ahora,<br>Pol · Banteq",
    titulo: "Videollamada con Banteq",
  },
  ca: {
    asunto: "Videotrucada amb Banteq confirmada: {fecha}",
    hola: "Hola, {nombre}:",
    reservada: "La teva videotrucada amb Banteq queda reservada per al <strong>{fecha}</strong> (hora peninsular espanyola). Dura {min} minuts.",
    para: "A la trucada veurem quines automatitzacions tenen sentit al teu negoci i quant costarien, perquè en una sola reunió sàpigues si t'interessa.",
    enlace: "Enllaç de la videotrucada: <a href=\"{url}\">{url}</a>",
    sinEnlace: "T'enviarem l'enllaç de la videotrucada abans de la reunió.",
    adjunto: "T'adjuntem la cita perquè l'afegeixis al teu calendari.",
    recordatorio: "Una hora abans t'enviarem un recordatori. Si necessites canviar l'hora, respon aquest correu.",
    firma: "Salutacions,<br>Pol Carabante · Banteq",
    recAsunto: "Recordatori: videotrucada amb Banteq a les {hora}",
    recCuerpo: "Et recordem que d'aquí a una hora, a les <strong>{hora}</strong>, tenim la videotrucada.",
    recFirma: "Fins ara,<br>Pol · Banteq",
    titulo: "Videotrucada amb Banteq",
  },
  en: {
    asunto: "Video call with Banteq confirmed: {fecha}",
    hola: "Hi {nombre},",
    reservada: "Your video call with Banteq is booked for <strong>{fecha}</strong> (Spanish mainland time). It lasts {min} minutes.",
    para: "On the call we'll look at which automations make sense for your business and what they would cost, so you'll know after a single meeting whether it's for you.",
    enlace: "Video call link: <a href=\"{url}\">{url}</a>",
    sinEnlace: "We'll send you the video call link before the meeting.",
    adjunto: "The appointment is attached so you can add it to your calendar.",
    recordatorio: "We'll send you a reminder one hour before. If you need to change the time, just reply to this email.",
    firma: "Best regards,<br>Pol Carabante · Banteq",
    recAsunto: "Reminder: video call with Banteq at {hora}",
    recCuerpo: "Just a reminder that in one hour, at <strong>{hora}</strong>, we have our video call.",
    recFirma: "Talk soon,<br>Pol · Banteq",
    titulo: "Video call with Banteq",
  },
};
const rellenar = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

function enlaceHtml(T) {
  const url = process.env.VIDEOLLAMADA_URL;
  return url && /^https:\/\//.test(url) ? rellenar(T.enlace, { url: escapar(url) }) : T.sinEnlace;
}

export function correoConfirmacion(s) {
  const T = TEXTOS[s.idioma] || TEXTOS.es;
  const f = fechaLarga(s.inicio, s.idioma);
  return {
    subject: rellenar(T.asunto, { fecha: f.completa }),
    html: [rellenar(T.hola, { nombre: escapar(s.nombre) }), rellenar(T.reservada, { fecha: escapar(f.completa), min: AGENDA.duracion }), T.para, enlaceHtml(T), T.adjunto, T.recordatorio, T.firma]
      .map((p) => `<p>${p}</p>`).join("\n"),
    ics: ics({
      uid: `${s.ref}@banteq.com`, inicio: s.inicio, titulo: T.titulo,
      descripcion: `${T.para}${process.env.VIDEOLLAMADA_URL ? `\n${process.env.VIDEOLLAMADA_URL}` : ""}`,
      url: /^https:\/\//.test(process.env.VIDEOLLAMADA_URL || "") ? process.env.VIDEOLLAMADA_URL : "",
      organizador: process.env.BREVO_SENDER_EMAIL,
    }),
  };
}

export function correoRecordatorio(r) {
  const T = TEXTOS[r.idioma] || TEXTOS.es;
  const { hora } = fechaLarga(r.inicio, r.idioma);
  return {
    subject: rellenar(T.recAsunto, { hora }),
    html: [rellenar(T.hola, { nombre: escapar(r.nombre || "") }), rellenar(T.recCuerpo, { hora }), enlaceHtml(T), T.recFirma].map((p) => `<p>${p}</p>`).join("\n"),
  };
}

export function correoAviso(s) {
  const f = fechaLarga(s.inicio, "es");
  const filas = [["Día y hora", `${f.completa} (${AGENDA.duracion} min)`], ["Nombre", s.nombre], ["Empresa", s.empresa || "—"], ["Correo", s.email], ["Teléfono", s.telefono || "—"],
    ["Qué quiere automatizar", s.mensaje || "—"], ["Desde", s.tipo], ["Idioma", s.idioma], ["Referencia", s.ref],
    ["Recordatorio al cliente", recordatorioCabe(s.inicio) ? "se programa ahora (1 h antes)" : "lo programará el cron el día antes (Brevo solo programa a 72 h vista)"],
    ["Página", s.pagina || "—"], ["Procedencia", [s.procedencia, s.entrada].filter(Boolean).join(" · ") || "—"]];
  return {
    subject: `Nueva videollamada: ${s.nombre}${s.empresa ? ` (${s.empresa})` : ""} · ${f.completa}`,
    html: `<h2>Videollamada reservada desde la web</h2><table cellpadding="6" style="border-collapse:collapse;font-size:14px">${filas
      .map(([k, v]) => `<tr><td style="border-bottom:1px solid #eee;color:#555">${escapar(k)}</td><td style="border-bottom:1px solid #eee"><strong>${escapar(v)}</strong></td></tr>`).join("")}</table>
<p>Responde a este correo para escribirle. La cita va adjunta para tu calendario.</p>`,
    ics: ics({ uid: `${s.ref}-banteq@banteq.com`, inicio: s.inicio, titulo: `Videollamada: ${s.nombre}${s.empresa ? ` (${s.empresa})` : ""}`, descripcion: `${s.email}${s.telefono ? ` · ${s.telefono}` : ""}\n${s.mensaje || ""}`, url: process.env.VIDEOLLAMADA_URL || "" }),
  };
}

// Aviso a Banteq: ha pedido el diagnóstico gratuito y prefiere no hacer videollamada.
export function correoSinVideollamada(s) {
  const filas = [["Nombre", s.nombre], ["Empresa", s.empresa || "—"], ["Correo", s.email || "—"], ["Teléfono / WhatsApp", s.telefono || "—"], ["Idioma", s.idioma], ["Fecha y hora", s.fechaHora]];
  return {
    subject: `Diagnóstico gratuito sin videollamada: ${s.nombre}${s.empresa ? ` (${s.empresa})` : ""}`,
    html: `<h2>Prefiere no hacer videollamada</h2><p>Ha pedido el diagnóstico inicial gratuito desde «Quiero mejorar» y ha elegido recibirlo por escrito: envíale el diagnóstico con lo que puede mejorar y a qué precio. Lo que te contó llegó en el aviso anterior.</p>`
      + `<table cellpadding="6" style="border-collapse:collapse;font-size:14px">${filas
        .map(([k, v]) => `<tr><td style="border-bottom:1px solid #eee;color:#555">${escapar(k)}</td><td style="border-bottom:1px solid #eee"><strong>${escapar(v)}</strong></td></tr>`).join("")}</table>`,
  };
}

// Envía (o, con `programado`, programa) un correo. Con RESERVAS_SIMULAR lo guarda como HTML.
export async function enviar(para, correo, { responderA, programado } = {}) {
  if (simulado()) {
    const dir = dirSimulado();
    await mkdir(dir, { recursive: true });
    const marca = new Date().toISOString().replace(/[:.]/g, "-");
    const nombre = `${marca}-${correo.subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 50)}`;
    await writeFile(join(dir, `${nombre}.html`), `<!doctype html><meta charset="utf-8"><title>${escapar(correo.subject)}</title>`
      + `<p style="color:#888">Para: ${escapar(para.email)} · Asunto: <strong>${escapar(correo.subject)}</strong>${programado ? ` · Programado para: ${escapar(programado)}` : ""}</p><hr>${correo.html}`);
    if (correo.ics) await writeFile(join(dir, `${nombre}.ics`), correo.ics);
    return;
  }
  await brevo("/smtp/email", {
    sender: { name: process.env.BREVO_SENDER_NAME || "Banteq", email: process.env.BREVO_SENDER_EMAIL },
    to: [para],
    ...(responderA ? { replyTo: responderA } : {}),
    subject: correo.subject,
    htmlContent: correo.html,
    ...(correo.ics ? { attachment: [{ name: "videollamada-banteq.ics", content: Buffer.from(correo.ics, "utf8").toString("base64") }] } : {}),
    ...(programado ? { scheduledAt: programado } : {}),
  });
}

// ¿Cabe el recordatorio (una hora antes) en las 72 h que deja programar Brevo?
export function recordatorioCabe(inicio, ahora = new Date()) {
  const cuando = new Date(new Date(inicio).getTime() - 60 * 60000);
  return cuando > ahora && cuando - ahora <= MAX_PROGRAMAR_MS;
}

// Programa el recordatorio si cabe en las 72 h de Brevo. Devuelve true si lo ha programado.
export async function programarRecordatorio(r, ahora = new Date()) {
  const cuando = new Date(new Date(r.inicio).getTime() - 60 * 60000);
  if (!recordatorioCabe(r.inicio, ahora)) return false;
  await enviar({ email: r.email, name: r.nombre }, correoRecordatorio(r), { programado: cuando.toISOString() });
  return true;
}

export const referencia = (inicio) => {
  const { dia, hora } = enMadrid(new Date(inicio));
  return `VC-${dia.replace(/-/g, "")}-${hora.replace(":", "")}`;
};
