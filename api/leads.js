const BREVO_API_URL = "https://api.brevo.com/v3";

const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ unserializable: true, message: error.message });
  }
};

const parseRequestBody = (request) => {
  const body = request.body;

  if (!body) return {};
  if (typeof body === "object" && !Buffer.isBuffer(body)) return body;

  const raw = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Lead endpoint body parse error", safeStringify({
      message: error.message,
      rawBodyPreview: raw.slice(0, 500),
    }));
    return {};
  }
};

const normalizeText = (value = "") => String(value || "").trim();

const getBrevoDate = (date = new Date()) => date.toISOString().slice(0, 10);

// Fecha y hora de España para el aviso y para Brevo («28/10/2026 10:52»).
const getMadridDateTime = (date = new Date()) => new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(date).replace(",", "");

// Solo se aceptan envíos desde la propia web (y sus vistas previas de Vercel, y en local).
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?banteq\.com|banteq-[a-z0-9-]+\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Límite básico contra envíos automáticos: como mucho 5 solicitudes por IP cada 10 minutos
// (por instancia de la función; suficiente para cortar ráfagas).
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const recentByIp = new Map();
const isRateLimited = (ip) => {
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) recentByIp.clear();
  return hits.length > RATE_LIMIT.max;
};

const getClientIp = (request) => String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "").split(",")[0].trim();

const LIMITS = { name: 120, company: 160, message: 5000, email: 254, page: 500, monthlyFee: 100000 };

// Fórmula Banteq: remodelación gratuita de una web informativa básica al contratar con Banteq su
// mantenimiento, con un 25 % de descuento sobre la cuota actual, hasta 50 €/mes y con una cuota
// mínima de 35 €/mes (sin IVA; condiciones en el aviso legal y en tools/contenido.py). La solicitud
// trae empresa, web, cuota mensual actual y un contacto; va a la misma lista de Brevo que el
// formulario de contacto, marcada con TIPO_SOLICITUD = «Fórmula Banteq».
const FORMULA = "Fórmula Banteq";
const FORMULA_DESCUENTO = 0.25;
const FORMULA_AHORRO_MAX = 50;
const FORMULA_CUOTA_MIN = 35;
const formulaQuote = (actual) => {
  const rebaja = Math.max(0, Math.min(actual * FORMULA_DESCUENTO, FORMULA_AHORRO_MAX, actual - FORMULA_CUOTA_MIN));
  return { nueva: Math.max(actual - rebaja, FORMULA_CUOTA_MIN), rebaja };
};
const isFormulaType = (type) => normalizeText(type) === FORMULA;

// «120», «120,50», «1.200» o un número → número con dos decimales como mucho (o NaN).
const parseEuros = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN;
  let v = String(value || "").replace(/[\s€]/g, "");
  if (!v) return NaN;
  if (v.includes(",") && v.includes(".")) v = v.replace(/\./g, "").replace(",", ".");
  else if (v.includes(",")) v = v.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  return /^\d+(\.\d{1,2})?$/.test(v) ? Number(v) : NaN;
};
// Web actual de la empresa (Fórmula Banteq): «tuempresa.com» → «https://tuempresa.com/»; "" si no vale.
const normalizeWebsite = (value) => {
  let v = normalizeText(value).replace(/\s+/g, "");
  if (!v || v.length > 300) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, "")}`;
  try {
    const url = new URL(v);
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname) ? url.href : "";
  } catch {
    return "";
  }
};
const formatEuros = (n) => {
  const r = Math.round(n * 100) / 100;
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(r);
};

// Error con código para la respuesta: el navegador recibe el código y un texto, nunca detalles internos.
const failure = (code, message, status = 502, extra = {}) => Object.assign(new Error(message), { publicCode: code, publicStatus: status, ...extra });

const formatDisplayDate = (value = "") => {
  const raw = normalizeText(value);
  if (!raw) return "";

  const datePart = raw.includes("T") ? raw.slice(0, 10) : raw;
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return raw;

  return `${match[3]}-${match[2]}-${match[1].slice(2)}`;
};

const normalizeContactPreference = (value = "") => {
  const preference = normalizeText(value);
  const normalized = preference.toLowerCase();

  if (normalized === "correo" || normalized === "email" || normalized === "correo electrónico" || normalized === "correo electronico") {
    return "Correo electrónico";
  }

  if (normalized === "whatsapp") return "WhatsApp";

  return preference;
};

const normalizeSpanishPhone = (value = "") => {
  const raw = normalizeText(value);

  if (!raw) return "";

  let phone = raw.replace(/[\s().-]/g, "");

  if (phone.startsWith("00")) {
    phone = `+${phone.slice(2)}`;
  }

  if (phone.startsWith("+")) {
    return `+${phone.slice(1).replace(/\D/g, "")}`;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 9) {
    return `+34${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("34")) {
    return `+${digits}`;
  }

  return digits ? `+${digits}` : "";
};

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

// Número internacional ya normalizado (+ y entre 8 y 15 cifras, el máximo de E.164).
const isValidPhone = (value = "") => /^\+\d{8,15}$/.test(value);

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const parseBrevoListId = (value) => Number(String(value || "").replace("#", "").trim());

const getListIdForType = (type) => {
  if (type === "FUNDAE") return parseBrevoListId(process.env.BREVO_FUNDAE_LIST_ID);
  if (String(type || "").startsWith("Contacto") || isFormulaType(type)) return parseBrevoListId(process.env.BREVO_CONTACT_LIST_ID);
  return parseBrevoListId(process.env.BREVO_DIAGNOSTIC_LIST_ID);
};

const classifyBrevoError = (status, text = "") => {
  const normalized = text.toLowerCase();

  if (status === 401 || normalized.includes("unauthorized") || normalized.includes("api key")) {
    return "API key incorrecta o ausente";
  }

  if (normalized.includes("list") || normalized.includes("listid") || normalized.includes("list id")) {
    return "list ID incorrecto o lista inexistente";
  }

  if (normalized.includes("already exists") || normalized.includes("duplicate_parameter") || normalized.includes("duplicate")) {
    return "contacto ya existente en Brevo";
  }

  if (normalized.includes("attribute") || normalized.includes("attributes") || normalized.includes("not a valid attribute")) {
    return "atributo inexistente o tipo de atributo incorrecto en Brevo";
  }

  if (normalized.includes("phone") || normalized.includes("sms") || normalized.includes("mobile") || normalized.includes("invalid parameter")) {
    return "formato de teléfono incorrecto o identificador externo no aceptado";
  }

  if (normalized.includes("sender") || normalized.includes("not verified") || normalized.includes("not allowed")) {
    return "sender email no verificado o no permitido";
  }

  return "error de Brevo sin clasificar";
};

const brevoFetch = async (path, options = {}) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    const error = new Error("Missing BREVO_API_KEY");
    error.category = "API key incorrecta o ausente";
    error.publicCode = "config";
    error.publicStatus = 500;
    console.error("Brevo configuration error", safeStringify({
      category: error.category,
      brevoApiKeyExists: false,
      path,
    }));
    throw error;
  }

  const response = await fetch(`${BREVO_API_URL}${path}`, {
    ...options,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const category = classifyBrevoError(response.status, text);
    console.error("Brevo API error", safeStringify({
      category,
      path,
      status: response.status,
      response: text,
      requestBody: options.body,
    }));
    const error = new Error(`Brevo API error ${response.status}: ${text}`);
    error.category = category;
    error.status = response.status;
    error.responseBody = text;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};

const getConfirmationText = (name) => `Hola ${name},

Gracias por contactar con Banteq.

Hemos recibido tu solicitud. Revisaremos lo que nos cuentas y te escribiremos para comentar qué tiene sentido mejorar en tu empresa y por dónde conviene empezar.

Un saludo,
Equipo de Banteq`;

const getFormulaConfirmationText = (company) => `Hola,

Gracias por tu interés en la Fórmula Banteq.

Hemos recibido la solicitud de ${company}. En menos de 48 horas te enviaremos una propuesta con tu web remodelada y la oferta de mantenimiento correspondiente.

Un saludo,
Equipo de Banteq`;

const sendConfirmationEmail = async ({ name, email, formType, company }) => {
  if (!email) return;
  const formula = isFormulaType(formType);

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Banteq";

  if (!senderEmail) {
    throw new Error("Missing BREVO_SENDER_EMAIL");
  }

  const htmlContent = escapeHtml(formula ? getFormulaConfirmationText(company) : getConfirmationText(name)).replace(/\n/g, "<br>");

  await brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: name || company || email }],
      subject: formula ? "Hemos recibido tu solicitud de la Fórmula Banteq" : "Hemos recibido tu solicitud",
      htmlContent,
    }),
  });
};

const sendAdminNotification = async (lead) => {
  const adminEmail = process.env.BREVO_ADMIN_EMAIL;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Banteq";

  // Sin aviso no se da la solicitud por recibida: el contacto podría quedarse sin atender.
  if (!adminEmail || !senderEmail) {
    throw failure("config", "Missing BREVO_ADMIN_EMAIL or BREVO_SENDER_EMAIL", 500, {
      category: "configuración incompleta en Vercel (BREVO_ADMIN_EMAIL / BREVO_SENDER_EMAIL)",
    });
  }

  const text = (value) => escapeHtml(value || "No indicado");
  const isWhatsappLead = lead.contactPreference === "WhatsApp" && lead.phone;
  const digits = (lead.phone || "").replace(/\D/g, "");
  // Enlace para que el equipo abra el chat desde el aviso. Al cliente nunca se le abre WhatsApp.
  const contactLine = isWhatsappLead
    ? `<p><strong>WhatsApp:</strong> ${text(lead.phone)} · <a href="https://wa.me/${digits}">Abrir chat de WhatsApp</a></p>`
    : `<p><strong>Correo:</strong> <a href="mailto:${escapeHtml(lead.email)}">${text(lead.email)}</a> (responde a este aviso para escribirle)</p>`;
  const pageLine = lead.page
    ? `<p><strong>Página:</strong> <a href="${escapeHtml(lead.page)}">${text(lead.pageTitle || lead.page)}</a><br><small>${text(lead.page)}</small></p>`
    : `<p><strong>Página:</strong> ${text(lead.origin)}</p>`;

  if (isFormulaType(lead.formType)) {
    const { nueva, rebaja } = formulaQuote(lead.monthlyFee);
    const plazo = getMadridDateTime(new Date(lead.submittedAtMs + 48 * 3600 * 1000));
    const formulaHtml = `
    <h2>Nueva solicitud de la Fórmula Banteq</h2>
    <p><strong>Empresa:</strong> ${text(lead.company)}</p>
    <p><strong>Web actual:</strong> <a href="${escapeHtml(lead.currentWebsite)}">${text(lead.currentWebsite)}</a></p>
    <p><strong>Paga hoy por el mantenimiento de su web (según indica, sin IVA):</strong> ${formatEuros(lead.monthlyFee)} €/mes</p>
    <p><strong>Cuota con la Fórmula Banteq:</strong> ${formatEuros(nueva)} €/mes${rebaja > 0 ? ` (ahorro de ${formatEuros(rebaja)} €/mes)` : " (paga 35 € o menos: sin descuento, cuota mínima)"}. Pendiente de acreditar su cuota actual con una factura y de revisar su web.</p>
    <p><strong>Prefiere que le contactemos por:</strong> ${text(lead.contactPreference)}</p>
    ${contactLine}
    <p><strong>Compromiso:</strong> enviarle en menos de 48 h la propuesta de web remodelada y la oferta de mantenimiento (antes del ${text(plazo)}).</p>
    ${pageLine}
    <p><strong>Fecha y hora:</strong> ${text(lead.submittedAtLocal)}</p>
  `;
    const result = await brevoFetch("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: adminEmail, name: "Banteq" }],
        replyTo: lead.email ? { email: lead.email, name: lead.company || "Fórmula Banteq" } : undefined,
        subject: `Fórmula Banteq: ${lead.company} · ${formatEuros(lead.monthlyFee)} €/mes (${isWhatsappLead ? "WhatsApp" : "correo"})`,
        htmlContent: formulaHtml,
      }),
    });
    return result?.messageId || null;
  }

  const htmlContent = `
    <h2>Nueva solicitud desde la web de Banteq</h2>
    <p><strong>Prefiere que le contactemos por:</strong> ${text(lead.contactPreference)}</p>
    ${contactLine}
    <p><strong>Nombre:</strong> ${text(lead.name)}</p>
    <p><strong>Empresa:</strong> ${text(lead.company)}</p>
    <p><strong>Qué quiere mejorar:</strong><br>${text(lead.message).replace(/\n/g, "<br>")}</p>
    ${pageLine}
    <p><strong>Fecha y hora:</strong> ${text(lead.submittedAtLocal)}</p>
  `;

  const result = await brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: adminEmail, name: "Banteq" }],
      replyTo: lead.email ? { email: lead.email, name: lead.name || "Contacto web" } : undefined,
      subject: `Nueva solicitud web (${isWhatsappLead ? "WhatsApp" : "correo"}): ${lead.name}${lead.company ? ` · ${lead.company}` : ""}`,
      htmlContent,
    }),
  });
  return result?.messageId || null;
};

const getValidBrevoListId = (formType) => {
  const listId = getListIdForType(formType);

  if (!Number.isInteger(listId) || listId <= 0) {
    console.error("Brevo list ID warning", safeStringify({
      category: "list ID incorrecto o lista inexistente",
      formType,
      rawListIds: {
        diagnostic: process.env.BREVO_DIAGNOSTIC_LIST_ID || null,
        contact: process.env.BREVO_CONTACT_LIST_ID || null,
        fundae: process.env.BREVO_FUNDAE_LIST_ID || null,
      },
      message: "No se enviara listIds a Brevo. El contacto se guardara sin lista hasta configurar el ID numerico en Vercel.",
    }));
    return null;
  }

  return listId;
};

const getContactIdentifier = (lead) => lead.email || (lead.phone && lead.contactPreference === "WhatsApp" ? `whatsapp:${lead.phone}` : "");

const addAttribute = (attributes, key, value) => {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    attributes[key] = value;
  }
};

const buildContactPayload = (lead) => {
  const listId = getValidBrevoListId(lead.formType);
  const phone = lead.phone || "";
  const isWhatsappLead = lead.contactPreference === "WhatsApp";
  const attributes = {};

  addAttribute(attributes, "NOMBRE", lead.name);
  addAttribute(attributes, "EMPRESA", lead.company);
  addAttribute(attributes, "PREFERENCIA_CONTACTO", lead.contactPreference || (lead.email ? "Correo electrónico" : ""));
  addAttribute(attributes, "FECHA_ENVIO", lead.submittedAt || getBrevoDate());
  addAttribute(attributes, "ESTADO", "Nuevo");
  addAttribute(attributes, "MENSAJE", lead.message);
  addAttribute(attributes, "AREAS", lead.areas);
  addAttribute(attributes, "PAGINA", lead.page || lead.origin);
  addAttribute(attributes, "TIPO_SOLICITUD", lead.formType);
  if (Number.isFinite(lead.monthlyFee)) addAttribute(attributes, "PAGO_MANTENIMIENTO", lead.monthlyFee);
  addAttribute(attributes, "WEB_ACTUAL", lead.currentWebsite);
  addAttribute(attributes, "FECHA_HORA", lead.submittedAtLocal);

  if (phone) {
    addAttribute(attributes, "TELEFONO", phone);

    if (isWhatsappLead) {
      addAttribute(attributes, "WHATSAPP", phone);
    }
  }

  const payload = {
    updateEnabled: true,
    attributes,
  };

  if (listId) {
    payload.listIds = [listId];
  }

  if (lead.email) {
    payload.email = lead.email;
  } else if (isWhatsappLead && phone) {
    payload.ext_id = `whatsapp:${phone}`;
  } else {
    payload.ext_id = `${lead.formType || "Lead"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return payload;
};

const buildUpdatePayload = (lead) => {
  const payload = buildContactPayload(lead);
  return {
    attributes: payload.attributes,
    ...(payload.listIds ? { listIds: payload.listIds } : {}),
  };
};

const requiredContactAttributes = [
  { name: "NOMBRE", type: "text" },
  { name: "EMPRESA", type: "text" },
  { name: "WHATSAPP", type: "text" },
  { name: "TELEFONO", type: "text" },
  { name: "PREFERENCIA_CONTACTO", type: "text" },
  { name: "FECHA_ENVIO", type: "date" },
  { name: "AREAS", type: "text" },
  { name: "ESTADO", type: "text" },
  { name: "MENSAJE", type: "text" },
  { name: "PAGINA", type: "text" },
  { name: "FECHA_HORA", type: "text" },
  { name: "TIPO_SOLICITUD", type: "text" },
  { name: "PAGO_MANTENIMIENTO", type: "float" },
  { name: "WEB_ACTUAL", type: "text" },
];

let attributesReady = false;

const ensureContactAttributes = async () => {
  if (attributesReady) return;

  await Promise.all(requiredContactAttributes.map(async ({ name, type }) => {
    try {
      await brevoFetch(`/contacts/attributes/normal/${encodeURIComponent(name)}`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      console.log("Brevo attribute created", safeStringify({ name, type }));
    } catch (error) {
      const details = `${error.message || ""} ${error.responseBody || ""}`.toLowerCase();
      const alreadyExists = details.includes("already exists") || details.includes("duplicate") || details.includes("exists");

      if (!alreadyExists) {
        console.error("Brevo attribute setup warning", safeStringify({
          name,
          type,
          status: error.status,
          category: error.category,
          responseBody: error.responseBody,
          message: error.message,
        }));
      }
    }
  }));

  attributesReady = true;
};

const saveLead = async (lead) => {
  const payload = buildContactPayload(lead);
  const identifier = getContactIdentifier(lead);
  console.log("Saving Brevo lead", safeStringify({
    brevoApiKeyExists: Boolean(process.env.BREVO_API_KEY),
    formType: lead.formType,
    rawListIds: {
      diagnostic: process.env.BREVO_DIAGNOSTIC_LIST_ID || null,
      contact: process.env.BREVO_CONTACT_LIST_ID || null,
      fundae: process.env.BREVO_FUNDAE_LIST_ID || null,
    },
    selectedListId: payload.listIds?.[0] || null,
    hasEmail: Boolean(lead.email),
    phone: lead.phone,
    identifier,
    extId: payload.ext_id,
    attributes: payload.attributes,
    payload,
  }));

  await ensureContactAttributes();

  try {
    const created = await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (created?.id) return created.id;
  } catch (error) {
    if (error.category !== "contacto ya existente en Brevo") {
      throw error;
    }

    const updatePayload = buildUpdatePayload(lead);
    const encodedIdentifier = encodeURIComponent(identifier);
    const identifierType = lead.email ? "" : "?identifierType=ext_id";
    console.error("Brevo contact exists, updating contact", safeStringify({
      originalCategory: error.category,
      originalMessage: error.message,
      identifier,
      identifierType: lead.email ? "email" : "ext_id",
      updatePayload,
    }));

    await brevoFetch(`/contacts/${encodedIdentifier}${identifierType}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
    });
  }
  // Con updateEnabled Brevo puede actualizar un contacto existente sin devolver su id: se consulta.
  const encodedIdentifier = encodeURIComponent(identifier);
  const identifierType = lead.email ? "" : "?identifierType=ext_id";
  const contact = await brevoFetch(`/contacts/${encodedIdentifier}${identifierType}`);
  return contact?.id || null;
};

const mapContactToLead = (contact, sourceList = "") => {
  const attrs = contact.attributes || {};
  const rawDate = attrs.FECHA_ENVIO || contact.modifiedAt || contact.createdAt || "";
  return {
    id: contact.id || contact.email || contact.ext_id,
    date: formatDisplayDate(rawDate),
    dateRaw: rawDate,
    sourceList,
    name: attrs.NOMBRE || "",
    company: attrs.EMPRESA || "",
    email: contact.email || "",
    phone: attrs.TELEFONO || attrs.SMS || "",
    whatsapp: attrs.WHATSAPP || attrs.TELEFONO || attrs.SMS || "",
    contactPreference: attrs.PREFERENCIA_CONTACTO || "",
    message: attrs.MENSAJE || "",
    areas: attrs.AREAS || "",
    status: attrs.ESTADO || "Nuevo",
  };
};

const listContactsFromList = async (listId, sourceList) => {
  if (!listId) return [];
  const result = await brevoFetch(`/contacts/lists/${listId}/contacts?limit=500&offset=0&sort=desc`);
  return (result.contacts || []).map((contact) => ({ ...contact, __sourceList: sourceList }));
};

const handlePost = async (request, response) => {
  const origin = normalizeText(request.headers.origin);
  if (origin && !ALLOWED_ORIGIN.test(origin)) {
    console.error("Lead endpoint rejected origin", safeStringify({ origin }));
    return json(response, 403, { error: "Origen no permitido.", code: "origin" });
  }

  const body = parseRequestBody(request);
  const ip = getClientIp(request);

  // Antispam: campo trampa relleno o formulario enviado en menos de 2 s desde que se cargó. Se
  // responde como si fuera bien (un bot no debe saber que lo hemos detectado) y no se guarda nada.
  const elapsedMs = Number(body.elapsedMs);
  if (normalizeText(body.hp) || (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < 2000)) {
    console.error("Lead endpoint spam discarded", safeStringify({ ip, elapsedMs, honeypot: Boolean(normalizeText(body.hp)) }));
    return json(response, 200, { ok: true });
  }

  if (isRateLimited(ip)) {
    console.error("Lead endpoint rate limited", safeStringify({ ip }));
    return json(response, 429, { error: "Has enviado varias solicitudes seguidas. Espera unos minutos y vuelve a intentarlo.", code: "rate_limit" });
  }

  const formType = normalizeText(body.formType);
  const contactPreference = normalizeContactPreference(body.contactPreference || body.contactMethod || (normalizeText(body.email) ? "Correo electrónico" : ""));
  const email = normalizeText(body.email).toLowerCase();
  const phone = normalizeSpanishPhone(body.phone || body.whatsapp || body.telefono);
  const name = normalizeText(body.name || body.nombre);
  const company = normalizeText(body.company || body.empresa);
  const message = normalizeText(body.message || body.mensaje);
  const page = normalizeText(body.page);
  const isContactForm = formType.startsWith("Contacto");
  const isFormula = isFormulaType(formType);
  const monthlyFee = isFormula ? parseEuros(body.monthlyFee) : NaN;
  const currentWebsite = isFormula ? normalizeWebsite(body.currentWebsite) : "";

  // Mismas comprobaciones que en el navegador, por si alguien envía directamente al endpoint.
  const fields = {};
  if (!name && !isFormula) fields.name = "Escribe tu nombre.";
  if ((isContactForm || isFormula) && !company) fields.company = "Escribe el nombre de tu empresa.";
  if (isFormula && !currentWebsite) fields.currentWebsite = normalizeText(body.currentWebsite) ? "Revisa la dirección: por ejemplo, tuempresa.com." : "Escribe la dirección de tu web actual.";
  if (isFormula && !(monthlyFee > 0 && monthlyFee <= LIMITS.monthlyFee)) fields.monthlyFee = "Escribe el importe en euros, por ejemplo 120.";
  if (isFormula && !email && !phone) fields.phone = "Indica un WhatsApp o un correo para enviarte la propuesta.";
  if (isContactForm && !message) fields.message = "Cuéntanos qué te gustaría mejorar.";
  if (name.length > LIMITS.name) fields.name = "El nombre es demasiado largo.";
  if (company.length > LIMITS.company) fields.company = "El nombre de la empresa es demasiado largo.";
  if (message.length > LIMITS.message) fields.message = "El mensaje es demasiado largo (máximo 5.000 caracteres).";
  if (contactPreference === "WhatsApp" && !isValidPhone(phone)) fields.phone = "Revisa el número de WhatsApp.";
  if (contactPreference === "Correo electrónico" && (!isValidEmail(email) || email.length > LIMITS.email)) fields.email = "Revisa el correo electrónico.";
  if (!contactPreference && !email && !phone) fields.email = "Indica un correo o un teléfono.";
  if (!formType) fields.form = "Formulario no reconocido.";

  if (Object.keys(fields).length) {
    console.error("Lead endpoint validation error", safeStringify({ ip, formType, fields }));
    return json(response, 400, { error: "Revisa los campos marcados.", code: "validation", fields });
  }

  const now = new Date();
  const lead = {
    formType,
    name,
    email: contactPreference === "WhatsApp" ? "" : email,
    phone: contactPreference === "Correo electrónico" ? "" : phone,
    company,
    contactPreference: contactPreference || (email ? "Correo electrónico" : ""),
    message: isFormula ? `Fórmula Banteq: paga ${formatEuros(monthlyFee)} €/mes por el mantenimiento de su web (${currentWebsite}).` : message,
    monthlyFee: isFormula ? monthlyFee : undefined,
    currentWebsite,
    areas: Array.isArray(body.areas) ? body.areas.join(", ") : normalizeText(body.areas),
    origin: normalizeText(body.origin || body.origen),
    page: /^https?:\/\//.test(page) ? page.slice(0, LIMITS.page) : "",
    pageTitle: normalizeText(body.pageTitle).slice(0, 200),
    employeesRange: normalizeText(body.employeesRange || body.numeroEmpleados || body.numero_empleados),
    microsoft365Usage: normalizeText(body.microsoft365Usage || body.usoActualMicrosoft365 || body.uso_actual_microsoft_365),
    microsoftApps: Array.isArray(body.microsoftApps) ? body.microsoftApps.join(", ") : normalizeText(body.microsoftApps || body.aplicacionesMicrosoft || body.aplicaciones_microsoft),
    submittedAt: getBrevoDate(now),
    submittedAtLocal: getMadridDateTime(now),
    submittedAtMs: now.getTime(),
  };

  console.log("Lead endpoint received", safeStringify({
    brevoApiKeyExists: Boolean(process.env.BREVO_API_KEY),
    adminEmailExists: Boolean(process.env.BREVO_ADMIN_EMAIL),
    senderEmailExists: Boolean(process.env.BREVO_SENDER_EMAIL),
    formType,
    contactPreference: lead.contactPreference,
    page: lead.page || lead.origin,
    listId: getListIdForType(formType),
  }));

  // 1. Guardar en Brevo. 2. Avisar a Banteq. Si falla cualquiera, la solicitud no se da por
  // recibida: el navegador muestra el error y se puede reintentar (el contacto se actualiza, no
  // se duplica). 3. Confirmación al cliente que eligió correo (si falla, solo se registra).
  let contactId;
  try {
    contactId = await saveLead(lead);
  } catch (error) {
    throw Object.assign(error, { publicCode: error.publicCode || (error.status === 401 ? "brevo_auth" : "brevo_contact"), publicStatus: error.publicStatus || 502 });
  }

  let notificationId;
  try {
    notificationId = await sendAdminNotification(lead);
  } catch (error) {
    throw Object.assign(error, { publicCode: error.publicCode || "brevo_email", publicStatus: error.publicStatus || 502 });
  }

  let confirmation = false;
  if (lead.email) {
    try {
      await sendConfirmationEmail({ name, email: lead.email, formType, company });
      confirmation = true;
    } catch (error) {
      console.error("Brevo confirmation email error", safeStringify({
        category: error.category || classifyBrevoError(0, error.message),
        message: error.message,
        formType: lead.formType,
      }));
    }
  }

  console.log("Lead saved and notified", safeStringify({ contactId, notificationId, confirmation, contactPreference: lead.contactPreference }));

  const result = { ok: true, contactId, notificationId, confirmation };
  // Comprobación de extremo a extremo: devuelve lo que ha quedado guardado en Brevo (los datos son
  // los que acaba de enviar quien pregunta).
  if (request.headers["x-bq-diagnostico"] === "1" && contactId) {
    try {
      const saved = await brevoFetch(`/contacts/${contactId}`);
      result.saved = { id: saved.id, email: saved.email || null, ext_id: saved.ext_id || null, listIds: saved.listIds, attributes: saved.attributes };
    } catch (error) {
      result.saved = { error: error.category || error.message };
    }
  }
  return json(response, 200, result);
};

const handleGet = async (request, response) => {
  const password = request.query?.password || request.headers["x-admin-password"];

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return json(response, 401, { error: "Unauthorized" });
  }

  const lists = [
    { id: parseBrevoListId(process.env.BREVO_DIAGNOSTIC_LIST_ID), sourceList: "Diagnóstico" },
    { id: parseBrevoListId(process.env.BREVO_CONTACT_LIST_ID), sourceList: "Contacto" },
    { id: parseBrevoListId(process.env.BREVO_FUNDAE_LIST_ID), sourceList: "FUNDAE" },
  ].filter((list) => Boolean(list.id));

  const contacts = (await Promise.all(lists.map((list) => listContactsFromList(list.id, list.sourceList)))).flat();
  const seen = new Map();

  contacts.forEach((contact) => {
    const lead = mapContactToLead(contact, contact.__sourceList);
    const key = lead.id || `${lead.email}-${lead.date}`;
    seen.set(key, lead);
  });

  const leads = Array.from(seen.values()).sort((a, b) => String(b.dateRaw).localeCompare(String(a.dateRaw)));
  return json(response, 200, { leads });
};

export default async function handler(request, response) {
  try {
    if (request.method === "OPTIONS") {
      response.setHeader("Allow", "GET, POST, OPTIONS");
      response.statusCode = 204;
      return response.end();
    }

    if (request.method === "POST") return await handlePost(request, response);
    if (request.method === "GET") return await handleGet(request, response);

    response.setHeader("Allow", "GET, POST, OPTIONS");
    return json(response, 405, { error: "Method not allowed" });
  } catch (error) {
    const diagnostic = {
      category: error.category || classifyBrevoError(error.status || 0, error.responseBody || error.message),
      status: error.status || null,
      responseBody: error.responseBody || null,
      message: error.message,
      stack: error.stack,
      method: request.method,
    };

    console.error("Lead endpoint error", safeStringify({ ...diagnostic, publicCode: error.publicCode || "server" }));

    return json(response, error.publicStatus || 500, {
      error: "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.",
      code: error.publicCode || "server",
    });
  }
}
