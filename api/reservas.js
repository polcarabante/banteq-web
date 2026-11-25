// Reservas de videollamada con Banteq (demostración «Reservas y citas» y ventana «Quiero mejorar»).
//   GET  → huecos de los próximos tres días hábiles, con los ya reservados marcados.
//   POST → reserva un hueco: lo guarda en Brevo, avisa a Banteq, confirma al cliente (con la cita en
//          .ics) y programa el recordatorio de una hora antes (o lo deja para el cron diario).
// Detalles, variables y simulación local: lib/reservas-servidor.mjs. Reglas de la agenda: lib/agenda.mjs.
import { esHueco, huecos } from "../lib/agenda.mjs";
import {
  activo, correoAviso, correoConfirmacion, correoSinVideollamada, enviar, guardarReserva, marcarRecordatorio, programarRecordatorio, referencia, reservasFuturas,
} from "../lib/reservas-servidor.mjs";

const ORIGEN_OK = /^https:\/\/((www\.)?banteq\.com|banteq-[a-z0-9-]+\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
const TIPOS = { "demo-reservas": "Videollamada · demo de reservas", "quiero-mejorar": "Videollamada · diagnóstico inicial gratuito" };
const PROCEDENCIAS = new Map([
  ["paid", "Campaña de pago"], ["email", "Campaña de correo"], ["campaign", "Campaña etiquetada"], ["google", "Referencia de Google"],
  ["search", "Referencia de otro buscador"], ["ai", "Referencia de un asistente de IA"], ["referral", "Otro sitio web"],
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
const texto = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const leerCuerpo = (req) => {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  try {
    return JSON.parse(Buffer.isBuffer(b) ? b.toString("utf8") : String(b || "{}"));
  } catch {
    return {};
  }
};
const fechaHora = (d) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d).replace(",", "");

// Mensajes de error para el visitante, en su idioma.
const MENSAJES = {
  es: { ocupado: "Ese hueco se acaba de ocupar. Elige otra hora.", hueco: "Esa hora ya no está disponible. Elige otra.", campos: "Revisa los campos marcados.", nombre: "Escribe tu nombre.", email: "Revisa el correo: por ejemplo, nombre@empresa.com.", acepto: "Para reservar, acepta la política de privacidad.", limite: "Has hecho varias reservas seguidas. Espera unos minutos.", error: "No hemos podido hacer la reserva. Inténtalo de nuevo en unos minutos.", inactivo: "La reserva en línea no está disponible ahora mismo." },
  ca: { ocupado: "Aquesta hora s'acaba d'ocupar. Tria'n una altra.", hueco: "Aquesta hora ja no està disponible. Tria'n una altra.", campos: "Revisa els camps marcats.", nombre: "Escriu el teu nom.", email: "Revisa el correu: per exemple, nom@empresa.com.", acepto: "Per reservar, accepta la política de privacitat.", limite: "Has fet diverses reserves seguides. Espera uns minuts.", error: "No hem pogut fer la reserva. Torna-ho a provar d'aquí a uns minuts.", inactivo: "La reserva en línia no està disponible ara mateix." },
  en: { ocupado: "That slot has just been taken. Please choose another time.", hueco: "That time is no longer available. Please choose another.", campos: "Please check the highlighted fields.", nombre: "Please enter your name.", email: "Check the email: for example, name@company.com.", acepto: "To book, please accept the privacy policy.", limite: "You've made several bookings in a row. Please wait a few minutes.", error: "We couldn't make the booking. Please try again in a few minutes.", inactivo: "Online booking isn't available right now." },
};

export default async function handler(req, res) {
  const ahora = new Date();
  if (req.method === "GET") {
    if (!activo()) return responder(res, 200, { ok: true, activo: false });
    try {
      const ocupados = (await reservasFuturas(ahora)).map((r) => r.inicio);
      return responder(res, 200, { ok: true, activo: true, dias: huecos(ahora, ocupados) });
    } catch (e) {
      console.error("Reservas: no se pudieron leer los huecos", JSON.stringify({ status: e.status || null, detalle: e.detalle || e.message }));
      return responder(res, 502, { ok: false, activo: true });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return responder(res, 405, { error: "Método no permitido." });
  }
  const b = leerCuerpo(req);
  const idioma = ["es", "ca", "en"].includes(b.idioma) ? b.idioma : "es";
  const M = MENSAJES[idioma];
  try {
    const origen = texto(req.headers.origin);
    if (origen && !ORIGEN_OK.test(origen)) return responder(res, 403, { error: M.error, code: "origin" });
    if (!activo()) return responder(res, 503, { error: M.inactivo, code: "inactivo" });
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
    // Antispam: campo trampa o envío en menos de 3 s. Se responde como si fuera bien, sin reservar.
    const ms = Number(b.elapsedMs);
    if (texto(b.hp) || (Number.isFinite(ms) && ms >= 0 && ms < 3000)) {
      console.error("Reservas: envío descartado como spam", JSON.stringify({ ip, ms, trampa: Boolean(texto(b.hp)) }));
      return responder(res, 200, { ok: true, ref: "VC-0", recordatorio: "programado" });
    }
    if (limitado(ip)) return responder(res, 429, { error: M.limite, code: "rate_limit" });

    const nombre = texto(b.nombre, 80);
    const email = texto(b.email, 254).toLowerCase();
    const telefono = texto(b.telefono, 30).replace(/[^\d+\s()-]/g, "");

    // Ventana «Quiero mejorar» → «Prefiero no hacer videollamada»: solo se avisa a Banteq para que le
    // envíe el diagnóstico por escrito (la solicitud ya llegó por /api/leads).
    if (b.accion === "sin-videollamada") {
      if (!nombre || (!EMAIL.test(email) && telefono.replace(/\D/g, "").length < 9)) return responder(res, 400, { error: M.campos, code: "validation" });
      await enviar({ email: process.env.RESERVAS_ADMIN_EMAIL || process.env.BREVO_ADMIN_EMAIL || "(BREVO_ADMIN_EMAIL)", name: "Banteq" },
        correoSinVideollamada({ nombre, empresa: texto(b.empresa, 160), email, telefono, idioma, fechaHora: fechaHora(ahora) }),
        { responderA: EMAIL.test(email) ? { email, name: nombre } : undefined });
      return responder(res, 200, { ok: true });
    }

    const fields = {};
    if (!nombre) fields.nombre = M.nombre;
    if (!EMAIL.test(email)) fields.email = M.email;
    // La casilla de privacidad es de la demostración; la ventana «Quiero mejorar» lleva el aviso
    // informativo de siempre bajo el formulario.
    if (b.origen !== "quiero-mejorar" && b.acceptTerms !== true) fields.acepto = M.acepto;
    if (Object.keys(fields).length) return responder(res, 400, { error: M.campos, code: "validation", fields });
    const f = new Date(String(b.inicio || ""));
    const inicio = Number.isNaN(f.getTime()) ? null : f.toISOString();
    if (!inicio || !esHueco(inicio, ahora)) return responder(res, 409, { error: M.hueco, code: "hueco" });
    const futuras = await reservasFuturas(ahora);
    if (futuras.some((r) => new Date(r.inicio).toISOString() === inicio && r.email !== email)) return responder(res, 409, { error: M.ocupado, code: "ocupado" });

    const pagina = texto(b.page);
    const s = {
      nombre, email, idioma, inicio,
      empresa: texto(b.empresa, 160), telefono, mensaje: texto(b.mensaje, 1500),
      tipo: TIPOS[b.origen] || TIPOS["demo-reservas"], ref: referencia(inicio),
      fecha: ahora.toISOString().slice(0, 10), fechaHora: fechaHora(ahora),
      pagina: /^https?:\/\//.test(pagina) ? pagina : "",
      procedencia: PROCEDENCIAS.get(b.sourceSignal),
      entrada: typeof b.entryPath === "string" && /^\/[a-z0-9/-]{0,200}$/.test(b.entryPath) ? b.entryPath : undefined,
      recordatorio: "pendiente",
    };

    // 1. Guardar y 2. avisar a Banteq: si falla cualquiera, no hay reserva. 3. Confirmación al
    // cliente y 4. recordatorio: si fallan, la reserva vale igual (se registra el fallo).
    const admin = process.env.RESERVAS_ADMIN_EMAIL || process.env.BREVO_ADMIN_EMAIL || "(BREVO_ADMIN_EMAIL)";
    await guardarReserva(s);
    await enviar({ email: admin, name: "Banteq" }, correoAviso(s), { responderA: { email, name: nombre } });
    let confirmacion = true;
    try {
      await enviar({ email, name: nombre }, correoConfirmacion(s), { responderA: process.env.BREVO_ADMIN_EMAIL ? { email: process.env.BREVO_ADMIN_EMAIL, name: "Banteq" } : undefined });
    } catch (e) {
      confirmacion = false;
      console.error("Reservas: no se pudo enviar la confirmación", JSON.stringify({ status: e.status || null, detalle: e.detalle || e.message }));
    }
    try {
      if (await programarRecordatorio(s, ahora)) {
        s.recordatorio = "programado";
        await marcarRecordatorio(email, "programado");
      }
    } catch (e) {
      console.error("Reservas: recordatorio no programado (lo intentará el cron)", JSON.stringify({ status: e.status || null, detalle: e.detalle || e.message }));
    }
    return responder(res, 200, { ok: true, ref: s.ref, inicio, confirmacion, recordatorio: s.recordatorio });
  } catch (e) {
    console.error("Reservas: error", JSON.stringify({ code: e.publicCode || "server", status: e.status || null, detalle: e.detalle || e.message }));
    return responder(res, e.publicStatus || 502, { error: M.error, code: e.publicCode || "server" });
  }
}
