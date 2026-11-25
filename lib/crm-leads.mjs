// Contactos de la demostración «Ventas y CRM» (/automatizaciones/crm): un contacto del formulario web
// o una lista importada (CSV o Excel) pasa por alta en el CRM, detección de duplicados, clasificación
// (sector, prioridad, origen), correo de bienvenida y tarea de seguimiento con fecha y comercial.
// Sin nada del navegador: se prueba con node (tests/crm-leads.test.mjs). Las reglas son sencillas a
// propósito: en un proyecto real se ajustan a los sectores y criterios de cada empresa.

export const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

// --- CSV --------------------------------------------------------------------------------------------

// CSV con el separador que use el archivo (punto y coma, coma o tabulador: el Excel en castellano
// guarda con punto y coma) y comillas según RFC 4180. Devuelve filas de celdas.
export function leerCsv(texto, { conVacias = false } = {}) {
  const t = String(texto).replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const primera = t.split("\n").find((l) => l.trim()) || "";
  const sep = [";", ",", "\t"].map((s) => [s, primera.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const filas = [];
  let fila = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"' && !celda) comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  // conVacias: las filas vacías se conservan (salvo las del final), para que la limpieza las cuente.
  const limpias = filas.map((f) => f.map((x) => x.trim()));
  if (!conVacias) return limpias.filter((f) => f.some(Boolean));
  while (limpias.length && !limpias[limpias.length - 1].some(Boolean)) limpias.pop();
  return limpias;
}

// Columnas reconocidas por sus nombres habituales (castellano, catalán e inglés).
const COLUMNAS = {
  nombre: ["nombre", "nom", "name", "contacto", "contacte", "contact", "nombre y apellidos", "full name", "persona"],
  empresa: ["empresa", "company", "compania", "companyia", "organizacion", "organization", "razon social", "cliente"],
  email: ["email", "e-mail", "correo", "correo electronico", "correu", "correu electronic", "mail"],
  telefono: ["telefono", "telefon", "phone", "movil", "mobil", "mobile", "tel", "tel."],
  mensaje: ["mensaje", "missatge", "message", "comentario", "comentarios", "comentari", "comentaris", "comments", "notas", "notes", "consulta", "observaciones", "observacions"],
  origen: ["origen", "source", "canal", "channel", "procedencia", "como nos conocio"],
};

// Filas (la primera, cabeceras) → { contactos, columnas, faltan, total }. Exige nombre o empresa, y
// email o teléfono; el resto es opcional. Como mucho `maximo` contactos.
export function contactosDeFilas(filas, { maximo = 200 } = {}) {
  if (!filas.length) return { contactos: [], columnas: {}, faltan: ["nombre", "email"], total: 0 };
  const cab = filas[0].map(normalizar);
  const columnas = {};
  for (const [campo, nombres] of Object.entries(COLUMNAS)) {
    const i = cab.findIndex((c) => nombres.includes(c.replace(/[:*]/g, "").trim()));
    if (i >= 0) columnas[campo] = i;
  }
  const faltan = [];
  if (columnas.nombre === undefined && columnas.empresa === undefined) faltan.push("nombre");
  if (columnas.email === undefined && columnas.telefono === undefined) faltan.push("email");
  const cuerpo = filas.slice(1);
  const contactos = faltan.length ? [] : cuerpo.slice(0, maximo).map((f, i) => {
    const c = { fila: i + 2 };
    for (const [campo, j] of Object.entries(columnas)) c[campo] = String(f[j] ?? "").trim();
    return c;
  }).filter((c) => c.nombre || c.empresa || c.email || c.telefono);
  return { contactos, columnas, faltan, total: cuerpo.length };
}

// --- Comprobaciones -----------------------------------------------------------------------------------

export const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
export const telefonoCifras = (t) => String(t || "").replace(/\D/g, "").replace(/^0034|^34(?=\d{9}$)/, "");

const GRATUITOS = ["gmail", "hotmail", "yahoo", "outlook", "icloud", "live", "msn", "protonmail", "proton", "gmx", "aol", "telefonica", "movistar"];
export const correoDeEmpresa = (email) => EMAIL.test(email || "") && !GRATUITOS.includes(email.split("@")[1].split(".")[0].toLowerCase());

const SOCIEDAD = /\b(s\.?\s?l\.?\s?u?\.?|s\.?\s?a\.?|s\.?\s?c\.?\s?c\.?\s?l\.?|sll|scp|cb|slp|ltd|inc|gmbh)\b\.?/g;
export const empresaClave = (e) => normalizar(e).replace(SOCIEDAD, "").replace(/[^a-z0-9]+/g, " ").trim();

// Duplicado: mismo email, mismo teléfono o misma empresa con el mismo nombre de pila.
export function buscarDuplicado(c, existentes) {
  const email = normalizar(c.email);
  const tel = telefonoCifras(c.telefono);
  const emp = empresaClave(c.empresa);
  const pila = normalizar(c.nombre).split(/\s+/)[0];
  for (const e of existentes) {
    if (email && normalizar(e.email) === email) return { con: e, motivo: "email" };
    if (tel.length >= 9 && telefonoCifras(e.telefono) === tel) return { con: e, motivo: "telefono" };
    if (emp && pila && empresaClave(e.empresa) === emp && normalizar(e.contacto || e.nombre).split(/\s+/)[0] === pila) return { con: e, motivo: "empresa" };
  }
  return null;
}

// --- Clasificación ------------------------------------------------------------------------------------

// Sector por palabras de la empresa, el mensaje y el dominio del correo (sin tildes).
const SECTORES = [
  ["industria", ["taller", "metal", "mecaniz", "acero", "industri", "fabric", "soldad", "maquinaria", "prensa", "plastico", "estampac", "fundic", "manufact", "steel"]],
  ["construccion", ["constru", "reforma", "obra", "instalacion", "fontaner", "electricidad", "electric", "climatiz", "carpinter", "pintura", "building"]],
  ["hosteleria", ["restaura", "hotel", "bar ", "cafeter", "catering", "hostal", "pasteler", "panader", "bodega", "cuina", "cocina"]],
  ["comercio", ["tienda", "botiga", "ferreter", "comercio", "comerc", "distribu", "mayorista", "majorista", "ecommerce", "shop", "store", "retail", "moda"]],
  ["salud", ["clinica", "dental", "fisio", "farmacia", "veterin", "salud", "salut", "medic", "optica", "psicolog", "health"]],
  ["servicios", ["asesor", "gestor", "abogad", "advocat", "consult", "despacho", "despatx", "arquitect", "inmobiliari", "seguros", "assegurances", "notar", "agencia", "law"]],
  ["logistica", ["transport", "logistic", "almacen", "magatzem", "mensajer", "missatger", "envio", "paqueter", "flota", "shipping"]],
  ["educacion", ["academia", "escuela", "escola", "formacion", "formacio", "colegio", "universi", "school", "training"]],
];

// Cada clave vale por el principio de una palabra («taller» → «talleres»); con espacio al final,
// solo la palabra exacta («bar », para no confundirlo con «Barcelona»).
export function sectorDe(c) {
  const palabras = normalizar([c.empresa, c.mensaje, (c.email || "").split("@")[1]].filter(Boolean).join(" ")).split(/[^a-z0-9]+/).filter(Boolean);
  const hay = (k) => (k.endsWith(" ") ? palabras.includes(k.trim()) : palabras.some((w) => w.startsWith(k)));
  for (const [sector, claves] of SECTORES) if (claves.some(hay)) return sector;
  return "otros";
}

const INTENCION = ["presupuesto", "pressupost", "precio", "preu", "tarifa", "urgente", "urgent", "cuanto antes", "esta semana", "aquesta setmana", "contratar", "contractar", "comprar", "demo", "reunion", "reunio", "llamad", "truca", "quote", "budget", "price", "asap", "this week", "meeting", "call me"];

// Prioridad con sus motivos: empresa, correo de empresa, teléfono y que pida algo concreto.
export function prioridadDe(c) {
  const motivos = [];
  if (c.empresa) motivos.push("empresa");
  if (correoDeEmpresa(c.email)) motivos.push("correoEmpresa");
  if (telefonoCifras(c.telefono).length >= 9) motivos.push("telefono");
  const m = normalizar(c.mensaje);
  const intencion = INTENCION.some((k) => m.includes(k));
  if (intencion) motivos.push("intencion");
  const puntos = motivos.length + (intencion ? 1 : 0);
  return { prioridad: puntos >= 4 ? "alta" : puntos >= 2 ? "media" : "baja", motivos };
}

const ORIGENES = [
  ["web", ["web", "formulario", "formulari", "google", "website", "form", "seo"]],
  ["telefono", ["telefono", "telefon", "llamada", "trucada", "phone", "call"]],
  ["feria", ["feria", "fira", "evento", "event", "trade show", "congreso"]],
  ["redes", ["linkedin", "instagram", "facebook", "redes", "xarxes", "social", "twitter", "tiktok"]],
  ["recomendacion", ["recomend", "referido", "boca", "referral", "amic", "amigo", "cliente"]],
  ["email", ["email", "correo", "correu", "newsletter", "mail"]],
];

export function origenDe(texto, porDefecto = "importacion") {
  const t = normalizar(texto);
  if (!t) return porDefecto;
  for (const [origen, claves] of ORIGENES) if (claves.some((k) => t.includes(k))) return origen;
  return "otro";
}

// --- Seguimiento ----------------------------------------------------------------------------------------

export const COMERCIALES = ["Marta", "Jordi", "Laia"];

// Siguiente día laborable a `dias` días laborables de `desde` (sin fines de semana), a las 10:00.
export function diaLaborable(desde, dias) {
  const f = new Date(desde);
  let n = 0;
  while (n < dias) {
    f.setDate(f.getDate() + 1);
    if (f.getDay() !== 0 && f.getDay() !== 6) n++;
  }
  f.setHours(10, 0, 0, 0);
  return f;
}

// Alta en un día laborable, media en dos, baja en cinco. Comercial por turno (según cuántos
// contactos hay ya en el CRM), para repartir la carga.
export function seguimiento(prioridad, { desde = new Date(), turno = 0 } = {}) {
  const dias = { alta: 1, media: 2, baja: 5 }[prioridad];
  return { tipo: prioridad === "baja" ? "email" : "llamar", fecha: diaLaborable(desde, dias).toISOString(), comercial: COMERCIALES[turno % COMERCIALES.length] };
}

// Proceso completo de una lista de contactos frente a los que ya hay en el CRM. Cada resultado:
// { contacto, valido, problema, duplicado, sector, prioridad, motivos, origen, accion }.
export function procesarContactos(contactos, existentes, { desde = new Date(), origenPorDefecto = "importacion" } = {}) {
  const vistos = [...existentes];
  let turno = existentes.length;
  return contactos.map((c) => {
    const r = { contacto: c, valido: true, problema: null };
    if (!c.nombre && !c.empresa) r.problema = "sinNombre";
    else if (!c.email && telefonoCifras(c.telefono).length < 9) r.problema = "sinContacto";
    else if (c.email && !EMAIL.test(c.email)) r.problema = "emailMal";
    if (r.problema) return { ...r, valido: false };
    const dup = buscarDuplicado(c, vistos);
    r.duplicado = dup ? { id: dup.con.id || null, fila: dup.con.fila || null, motivo: dup.motivo } : null;
    r.sector = sectorDe(c);
    Object.assign(r, prioridadDe(c));
    r.origen = c.origenFijo || origenDe(c.origen, origenPorDefecto);
    if (!dup) {
      r.accion = seguimiento(r.prioridad, { desde, turno: turno++ });
      // Sin teléfono, se le escribe; sin email, se le llama. La bienvenida va por WhatsApp si no hay email.
      if (r.accion.tipo === "llamar" && telefonoCifras(c.telefono).length < 9) r.accion.tipo = "email";
      else if (r.accion.tipo === "email" && !c.email) r.accion.tipo = "llamar";
      r.canal = c.email ? "email" : "whatsapp";
      vistos.push({ ...c, contacto: c.nombre });
    }
    return r;
  });
}

// Iniciales para el avatar («Laura Gómez» → «LG»).
export const iniciales = (nombre) => String(nombre || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
