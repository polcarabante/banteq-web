// Textos de la página en su idioma (tools/textos_demos_interactivas.py; el build los deja en
// <script id="bq-textos">) y utilidades comunes de las demostraciones.

let datos = {};
try {
  datos = JSON.parse(document.getElementById("bq-textos")?.textContent || "{}");
} catch {
  datos = {};
}

export const idioma = ["es", "ca", "en"].includes(document.documentElement.lang) ? document.documentElement.lang : "es";
export const inicio = document.body.dataset.inicio || "/";
export const hablemos = document.body.dataset.hablemos || "/#hablemos";
export const MAX_MB = Number(document.body.dataset.maxMb) || 10;

// t("clave", { n: 3 }) → texto con {n} sustituido. Sin la clave, devuelve la clave (se ve en pruebas).
export function t(clave, vars = {}) {
  const s = Object.prototype.hasOwnProperty.call(datos, clave) ? datos[clave] : clave;
  return s.replace(/\{([\p{L}\p{N}_]+)\}/gu, (m, k) => (Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m));
}

const LOCALE = { es: "es-ES", ca: "ca-ES", en: "en-GB" }[idioma];
const hora = (d) => d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });

// «jue, 26 nov, 10:00» (tablas y tareas) y «jueves 26 de noviembre a las 10:00» (correos).
export function fechaCorta(d) {
  return `${d.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" })}, ${hora(d)}`;
}
// Fecha de un día (guardado a medianoche UTC) con las opciones de Intl que se pidan.
export function formatoDia(d, opciones) {
  return d.toLocaleDateString(LOCALE, { timeZone: "UTC", ...opciones });
}
export function fechaLarga(d) {
  const dia = d.toLocaleDateString(LOCALE, { weekday: "long" });
  const fecha = `${dia} ${d.toLocaleDateString(LOCALE, { day: "numeric", month: "long" })}`;
  return t("fecha.hora", { fecha, hora: hora(d) });
}

export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
export const esperar = (ms) => new Promise((ok) => setTimeout(ok, reduceMotion.matches ? Math.min(ms, 120) : ms));

export function escapar(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Desplaza hasta un elemento solo si no se ve ya entero (suave salvo con movimiento reducido).
export function mostrar(el, bloque = "nearest") {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top >= 0 && r.bottom <= innerHeight) return;
  el.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: bloque });
}

export const OK_SVG = '<svg class="i-ok" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path d="m4.6 8.3 2.3 2.3 4.5-4.9" fill="none"/></svg>';
export const AVISO_SVG = '<svg class="i-aviso" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path d="M8 4.2v4.6M8 11.3v.2" fill="none"/></svg>';
export const ERROR_SVG = '<svg class="i-error" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path d="m5.4 5.4 5.2 5.2m0-5.2-5.2 5.2" fill="none"/></svg>';
