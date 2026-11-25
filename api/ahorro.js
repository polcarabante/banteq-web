// Solicitudes de la calculadora «¿Cuánto me ahorro?» (área de seguimiento de retrasos).
// Mismo sistema que el formulario de la web (api/leads.js): Brevo guarda la solicitud en la lista de
// contacto, avisa a Banteq con todas las cifras y envía la confirmación al cliente. Las cifras se
// recalculan aquí con lib/ahorro-calculo.mjs a partir de los controles: no se usan las del navegador.
// Variables (las mismas del formulario): BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME,
// BREVO_ADMIN_EMAIL (o AHORRO_ADMIN_EMAIL para mandar este aviso a otra dirección) y
// BREVO_CONTACT_LIST_ID. Con AHORRO_SIMULAR=1 (solo en local) no llama a Brevo: guarda los dos correos
// como HTML en AHORRO_SIMULAR_DIR para revisarlos.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CONTROLES, calcular, formatoEuros, formatoNumero, validarValores } from "../lib/ahorro-calculo.mjs";

const BREVO_API_URL = "https://api.brevo.com/v3";
const TIPO = "Calculadora de ahorro · seguimiento de retrasos";
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?banteq\.com|banteq-[a-z0-9-]+\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ETIQUETAS = {
  correosDia: ["Correos de retraso al día", (v) => formatoNumero(v)],
  minCorreo: ["Minutos por correo", (v) => `${v} min`],
  minSeguimiento: ["Minutos por correo en seguimiento", (v) => `${v} min`],
  automatizable: ["Parte que se automatiza", (v) => `${v} %`],
  dias: ["Días laborables al año", (v) => `${v} días`],
  costeHora: ["Coste por hora del empleado", (v) => `${v} €/h`],
};
const procedencias = new Map([
  ["paid", "Campaña de pago"], ["email", "Campaña de correo"], ["campaign", "Campaña etiquetada"],
  ["google", "Referencia de Google"], ["search", "Referencia de otro buscador"],
  ["ai", "Referencia de un asistente de IA"], ["referral", "Otro sitio web"],
  ["internal", "Página anterior de Banteq"], ["unknown", "Sin referencia identificable"],
]);

const hits = new Map();
const limitado = (ip) => {
  const ahora = Date.now();
  const recientes = (hits.get(ip) || []).filter((t) => ahora - t < 10 * 60 * 1000);
  recientes.push(ahora);
  hits.set(ip, recientes);
  if (hits.size > 5000) hits.clear();
  return recientes.length > 5;
};

const responder = (res, status, datos) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(datos));
};
const texto = (v) => String(v ?? "").trim();
const escapar = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fallo = (code, message, status = 502) => Object.assign(new Error(message), { publicCode: code, publicStatus: status });

const leerCuerpo = (req) => {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  try {
    return JSON.parse(Buffer.isBuffer(b) ? b.toString("utf8") : String(b || "{}"));
  } catch {
    return {};
  }
};

const fechaMadrid = (d) => new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(d).replace(",", "");

async function brevo(ruta, cuerpo, metodo = "POST") {
  const clave = process.env.BREVO_API_KEY;
  if (!clave) throw fallo("config", "Falta BREVO_API_KEY", 500);
  const r = await fetch(`${BREVO_API_URL}${ruta}`, {
    method: metodo,
    headers: { "api-key": clave, "Content-Type": "application/json", Accept: "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) {
    const detalle = await r.text();
    throw Object.assign(new Error(`Brevo ${r.status} en ${ruta}`), { status: r.status, detalle });
  }
  return r.status === 204 ? null : r.json();
}

// --- Contenido de los correos ----------------------------------------------------------------------
function filasControles(v) {
  return CONTROLES.map(({ clave }) => [ETIQUETAS[clave][0], ETIQUETAS[clave][1](v[clave])]);
}
// Precios de Banteq, sin IVA; cifras de ahorro, marcadas como estimación (igual que en la página).
const sinIva = (n) => `${formatoEuros(n)} sin IVA`;
const estimado = (n) => `${formatoEuros(n)} (ahorro estimado)`;
function filasResultados(r) {
  const n = r.redondeado;
  return [
    ["Horas liberadas al año", `${formatoNumero(n.horasAño)} h (${formatoNumero(n.empleados, 2)} empleados a jornada completa)`],
    ["Ahorro bruto al mes (tiempo liberado)", estimado(n.ahorroBrutoMes)],
    ["Herramientas al mes", sinIva(n.herramientasMes)],
    ["Ahorro mensual", estimado(n.ahorroMes)],
    ["Implantación (pago único)", sinIva(n.implantacion)],
    ["Mantenimiento mensual (25 %)", sinIva(n.mantenimientoMes)],
    ["Ganancia del cliente al mes (75 %)", estimado(n.gananciaClienteMes)],
    ["Ganancia del cliente al año", estimado(n.gananciaClienteAño)],
    ["Ganancia del primer año (con la implantación)", estimado(n.gananciaPrimerAño)],
  ];
}
const tabla = (filas) => `<table cellpadding="6" style="border-collapse:collapse;font-size:14px">${filas
  .map(([k, v]) => `<tr><td style="border-bottom:1px solid #eee;color:#555">${escapar(k)}</td><td style="border-bottom:1px solid #eee"><strong>${escapar(v)}</strong></td></tr>`)
  .join("")}</table>`;

function correoAviso(s) {
  const procedencia = s.procedencia ? `<p><strong>Procedencia observada:</strong> ${escapar(s.procedencia)}${s.entrada ? ` · ${escapar(s.entrada)}` : ""}.</p>` : "";
  return {
    subject: `Calculadora de ahorro: ${s.empresa} · ${formatoEuros(s.r.redondeado.gananciaClienteAño)} al año`,
    html: `<h2>Nueva solicitud desde la calculadora «¿Cuánto me ahorro?»</h2>
<p><strong>Empresa:</strong> ${escapar(s.empresa)}<br><strong>Correo:</strong> <a href="mailto:${escapar(s.email)}">${escapar(s.email)}</a> (responde a este aviso para escribirle)</p>
<h3>Datos que ha introducido</h3>${tabla(filasControles(s.v))}
<h3>Resultados que ha visto</h3>${tabla(filasResultados(s.r))}
<p><strong>Compromiso:</strong> responderle en menos de 48 horas. Ha aceptado la política de privacidad y los términos (incluido el apartado 8, cálculo del precio).</p>
${s.pagina ? `<p><strong>Página:</strong> ${escapar(s.pagina)}</p>` : ""}${procedencia}
<p><strong>Fecha y hora:</strong> ${escapar(s.fechaHora)}</p>`,
  };
}

function correoConfirmacion(s) {
  const n = s.r.redondeado;
  const resumen = [
    ["Ahorro mensual", estimado(n.ahorroMes)],
    ["Implantación (pago único)", sinIva(n.implantacion)],
    ["Mantenimiento mensual", sinIva(n.mantenimientoMes)],
    ["Lo que ganas tú al año", estimado(n.gananciaClienteAño)],
  ];
  return {
    subject: "Hemos recibido tu solicitud",
    html: `<p>Hola,</p>
<p>Hemos recibido la solicitud de ${escapar(s.empresa)} para el área de seguimiento de retrasos. Este es el resumen de tus cifras:</p>
${tabla(resumen)}
<p>Son cifras orientativas calculadas con los datos que has introducido; las confirmaremos contigo en la reunión inicial.</p>
<p>Te responderemos en menos de 48 horas.</p>
<p>Un saludo,<br>Equipo de Banteq</p>`,
  };
}

// --- Envío -----------------------------------------------------------------------------------------
async function guardar(s) {
  const lista = Number(String(process.env.BREVO_CONTACT_LIST_ID || "").replace("#", "").trim());
  const mensaje = `${TIPO}: ${filasControles(s.v).map(([k, v]) => `${k}: ${v}`).join(" · ")}. `
    + `Resultados: ${filasResultados(s.r).map(([k, v]) => `${k}: ${v}`).join(" · ")}.`;
  const atributos = Object.fromEntries(Object.entries({
    EMPRESA: s.empresa,
    PREFERENCIA_CONTACTO: "Correo electrónico",
    FECHA_ENVIO: s.fecha,
    FECHA_HORA: s.fechaHora,
    ESTADO: "Nuevo",
    TIPO_SOLICITUD: TIPO,
    MENSAJE: mensaje,
    PAGINA: s.pagina,
    ULTIMA_PROCEDENCIA_WEB: s.procedencia,
    ULTIMA_ENTRADA_WEB: s.entrada,
  }).filter(([, v]) => v !== undefined && v !== ""));
  const cuerpo = { email: s.email, updateEnabled: true, attributes: atributos, ...(lista > 0 ? { listIds: [lista] } : {}) };
  await brevo("/contacts", cuerpo);
}

async function enviarCorreo(para, { subject, html }, responderA) {
  const remitente = process.env.BREVO_SENDER_EMAIL;
  if (!remitente) throw fallo("config", "Falta BREVO_SENDER_EMAIL", 500);
  await brevo("/smtp/email", {
    sender: { name: process.env.BREVO_SENDER_NAME || "Banteq", email: remitente },
    to: [para],
    ...(responderA ? { replyTo: responderA } : {}),
    subject,
    htmlContent: html,
  });
}

async function simular(s) {
  const dir = process.env.AHORRO_SIMULAR_DIR || "/tmp/banteq-ahorro";
  await mkdir(dir, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const aviso = correoAviso(s);
  const conf = correoConfirmacion(s);
  const destinoAviso = process.env.AHORRO_ADMIN_EMAIL || process.env.BREVO_ADMIN_EMAIL || "(BREVO_ADMIN_EMAIL)";
  const pagina = (para, c) => `<!doctype html><meta charset="utf-8"><title>${escapar(c.subject)}</title><p style="color:#888">Para: ${escapar(para)} · Asunto: <strong>${escapar(c.subject)}</strong></p><hr>${c.html}`;
  await writeFile(join(dir, `${marca}-1-aviso-banteq.html`), pagina(destinoAviso, aviso));
  await writeFile(join(dir, `${marca}-2-confirmacion-cliente.html`), pagina(s.email, conf));
  console.log("[api/ahorro] (simulado: sin Brevo) correos guardados en", dir);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return responder(res, 405, { error: "Método no permitido." });
  }
  try {
    const origen = texto(req.headers.origin);
    if (origen && !ALLOWED_ORIGIN.test(origen)) return responder(res, 403, { error: "Origen no permitido.", code: "origin" });

    const b = leerCuerpo(req);
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
    // Antispam: campo trampa relleno o envío en menos de 3 s. Se responde como si fuera bien.
    const ms = Number(b.elapsedMs);
    if (texto(b.hp) || (Number.isFinite(ms) && ms >= 0 && ms < 3000)) {
      console.error("Ahorro: envío descartado como spam", JSON.stringify({ ip, ms, trampa: Boolean(texto(b.hp)) }));
      return responder(res, 200, { ok: true, confirmation: true });
    }
    if (limitado(ip)) return responder(res, 429, { error: "Has enviado varias solicitudes seguidas. Espera unos minutos y vuelve a intentarlo.", code: "rate_limit" });

    const empresa = texto(b.company);
    const email = texto(b.email).toLowerCase();
    const fields = {};
    if (!empresa) fields.empresa = "Escribe el nombre de tu empresa.";
    else if (empresa.length > 160) fields.empresa = "El nombre es demasiado largo.";
    if (!email) fields.correo = "Escribe tu correo.";
    else if (!EMAIL.test(email) || email.length > 254) fields.correo = "Revisa el correo: por ejemplo, nombre@empresa.com.";
    if (b.acceptTerms !== true) fields.acepto = "Para enviar la solicitud, acepta la política de privacidad y los términos y condiciones.";
    const v = validarValores(b.valores);
    if (!v) fields.valores = "Los valores de la calculadora no son válidos.";
    if (Object.keys(fields).length) return responder(res, 400, { error: "Revisa los campos marcados.", code: "validation", fields });

    const r = calcular(v);
    if (!r.compensa) return responder(res, 400, { error: "Con este volumen la automatización no compensa todavía.", code: "no_compensa" });

    const ahora = new Date();
    const pagina = texto(b.page);
    const s = {
      empresa, email, v, r,
      fecha: ahora.toISOString().slice(0, 10),
      fechaHora: fechaMadrid(ahora),
      pagina: /^https?:\/\//.test(pagina) ? pagina.slice(0, 500) : "",
      procedencia: procedencias.get(b.sourceSignal),
      entrada: typeof b.entryPath === "string" && /^\/[a-z0-9/-]{0,200}$/.test(b.entryPath) ? b.entryPath : undefined,
    };

    if (process.env.AHORRO_SIMULAR === "1") {
      await simular(s);
      return responder(res, 200, { ok: true, confirmation: true, simulated: true });
    }

    // 1. Guardar en Brevo y 2. avisar a Banteq: si falla cualquiera, la solicitud no se da por
    // recibida. 3. Confirmación al cliente: si falla, la solicitud sigue valiendo (se registra).
    const adminEmail = process.env.AHORRO_ADMIN_EMAIL || process.env.BREVO_ADMIN_EMAIL;
    if (!adminEmail) throw fallo("config", "Falta BREVO_ADMIN_EMAIL", 500);
    await guardar(s).catch((e) => { throw Object.assign(e, { publicCode: e.publicCode || "brevo_contact" }); });
    await enviarCorreo({ email: adminEmail, name: "Banteq" }, correoAviso(s), { email, name: empresa })
      .catch((e) => { throw Object.assign(e, { publicCode: e.publicCode || "brevo_email" }); });
    let confirmation = true;
    try {
      await enviarCorreo({ email, name: empresa }, correoConfirmacion(s));
    } catch (e) {
      confirmation = false;
      console.error("Ahorro: no se pudo enviar la confirmación", JSON.stringify({ status: e.status || null, detalle: e.detalle || e.message }));
    }
    return responder(res, 200, { ok: true, confirmation });
  } catch (error) {
    console.error("Ahorro: error", JSON.stringify({ code: error.publicCode || "server", status: error.status || null, detalle: error.detalle || error.message }));
    return responder(res, error.publicStatus || 502, { error: "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.", code: error.publicCode || "server" });
  }
}
