// «ERP Banteq»: backoffice de mentira que comparten todas las demostraciones. Lo que el visitante
// registra en cualquiera de ellas se guarda en sessionStorage (solo en esta pestaña y hasta que la
// cierra) y se ve en su pestaña del ERP, encima de los registros de ejemplo. Si el navegador no deja
// usar sessionStorage (modo privado estricto), se guarda en memoria mientras dure la página.
import { PRIMER_ID, SEMILLAS } from "../lib/demos-erp-datos.mjs";
import { formatoEuros } from "../lib/demos-ahorro.mjs";
import { diasHabiles } from "../lib/agenda.mjs";
import { diaLaborable } from "../lib/crm-leads.mjs";
import { escapar, fechaCorta, formatoDia, idioma, OK_SVG, reduceMotion, t } from "./textos.js";

const CLAVE = "bq-erp-demo-v1";
export const TABLAS = ["facturas", "conocimiento", "crm", "informes", "reservas"];
const OTRAS = ["consultas"]; // historiales sin pestaña propia (consultas al asistente)

let memoria = null;

function leer() {
  if (memoria) return structuredClone(memoria);
  try {
    const d = JSON.parse(sessionStorage.getItem(CLAVE) || "null");
    if (d && typeof d === "object") return d;
  } catch {
    /* sin sessionStorage: se usa la memoria */
  }
  return {};
}

function estado() {
  const d = leer();
  for (const k of [...TABLAS, ...OTRAS]) if (!Array.isArray(d[k])) d[k] = [];
  if (!d.contadores || typeof d.contadores !== "object") d.contadores = {};
  return d;
}

function guardar(d) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(d));
    memoria = null;
  } catch {
    memoria = d;
  }
}

// Registros de una tabla: los del visitante (más recientes primero) y después los de ejemplo.
export function registros(tabla) {
  return [...estado()[tabla]].reverse().concat(SEMILLAS[tabla] || []);
}

export function propios(tabla) {
  return estado()[tabla];
}

// Añade un registro con su ID correlativo (F-0413, LEAD-0087…) y avisa a la página.
export function anadir(tabla, registro) {
  const d = estado();
  const [prefijo, primero, cifras] = PRIMER_ID[tabla];
  const n = Number(d.contadores[tabla]) || primero;
  const nuevo = { ...registro, id: prefijo + String(n).padStart(cifras, "0"), creado: Date.now() };
  d.contadores[tabla] = n + 1;
  d[tabla].push(nuevo);
  guardar(d);
  dispatchEvent(new CustomEvent("bq-erp", { detail: { tabla, registro: nuevo } }));
  return nuevo;
}

export function vaciar() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada */
  }
  memoria = null;
  dispatchEvent(new CustomEvent("bq-erp", { detail: { vaciado: true } }));
}

// --- Vista -------------------------------------------------------------------------------------------

const chip = (r) =>
  `<span class="erp-estado erp-estado-${escapar(r.estado)}">${escapar(t(`erp.estado.${r.estado}`))}</span>` +
  (r.motivo ? `<small class="erp-motivo">${escapar(typeof r.motivo === "string" ? r.motivo : t(r.motivo.k, r.motivo.v || {}))}</small>` : "");

// Próxima acción de un contacto: llamar o escribir (con fecha y comercial) o revisar un duplicado.
function accion(r) {
  const a = r.accion;
  if (!a) return "";
  if (a.tipo === "fusionar") return escapar(t("erp.accion.fusionar", { con: a.con }));
  const fecha = a.fecha ? new Date(a.fecha) : diaLaborable(new Date(), a.enDias || 1);
  return escapar(t(`erp.accion.${a.tipo}`, { cuando: fechaCorta(fecha), quien: a.comercial }));
}

const COLUMNAS = {
  facturas: [["id"], ["proveedor"], ["numero", null, "erp-opcional"], ["total", (r) => escapar(r.total === null || r.total === undefined ? "—" : formatoEuros(r.total, idioma, 2)), "erp-num"], ["estado", chip]],
  conocimiento: [["id"], ["documento", (r) => escapar(r.nombre)], ["secciones", null, "erp-num"],
    ["consultas", (r) => String(propios("consultas").filter((c) => c.doc === r.id).length || (r.creado ? 0 : "—")), "erp-num erp-opcional"], ["estado", chip]],
  crm: [["id"], ["contacto", (r) => `${escapar(r.contacto || r.empresa)}<small class="erp-motivo">${escapar([r.contacto ? r.empresa : "", t(`erp.origen.${r.origen}`)].filter(Boolean).join(" · "))}</small>`],
    ["estado", (r) => chip({ estado: r.estado }) + (r.prioridad ? `<small class="erp-motivo">${escapar(t(`erp.prioridad.${r.prioridad}`))}</small>` : "")],
    ["accion", (r) => `<small class="erp-accion">${accion(r)}</small>`]],
  informes: [["id"], ["informe", (r) => escapar(r.nombre)], ["periodo"], ["estado", chip]],
  reservas: [["id"], ["nombre"], ["dia", (r) => escapar(formatoDia(new Date(`${r.dia || diasHabiles(new Date(), r.enDias || 1).at(-1)}T12:00:00Z`), { weekday: "short", day: "numeric", month: "short" }))],
    ["hora"], ["estado", chip]],
};

const BARRA = '<div class="erp-barra"><i></i><i></i><i></i><b></b></div>';

export function montarERP(contenedor) {
  if (!contenedor) return null;
  let actual = TABLAS.includes(contenedor.dataset.pestana) ? contenedor.dataset.pestana : "facturas";
  let nuevoId = null;
  const tabs = TABLAS.map(
    (k) =>
      `<button type="button" role="tab" id="erp-tab-${k}" aria-controls="erp-panel" data-tabla="${k}">${escapar(t(`erp.tab.${k}`))}<span class="erp-cuenta" hidden></span></button>`,
  ).join("");
  contenedor.innerHTML =
    `<div class="erp">${BARRA}<p class="erp-entorno">${escapar(t("erp.entorno"))}</p>` +
    `<div class="erp-tabs" role="tablist" aria-label="${escapar(t("erp.pestanas"))}">${tabs}</div>` +
    '<div class="erp-panel" id="erp-panel" role="tabpanel" tabindex="0"></div>' +
    `<div class="erp-pie"><button type="button" class="erp-vaciar" hidden>${escapar(t("erp.vaciar"))}</button></div>` +
    '<p class="oculto" aria-live="polite" data-erp-anuncio></p></div>';
  contenedor.querySelector(".erp-barra b").textContent = t("erp.titulo");
  const panel = contenedor.querySelector(".erp-panel");
  const anuncio = contenedor.querySelector("[data-erp-anuncio]");
  const botones = [...contenedor.querySelectorAll('[role="tab"]')];

  function pintar() {
    botones.forEach((b) => {
      const sel = b.dataset.tabla === actual;
      b.setAttribute("aria-selected", String(sel));
      b.tabIndex = sel ? 0 : -1;
      const n = propios(b.dataset.tabla).length;
      const cuenta = b.querySelector(".erp-cuenta");
      cuenta.hidden = !n;
      cuenta.textContent = n ? `+${n}` : "";
    });
    panel.setAttribute("aria-labelledby", `erp-tab-${actual}`);
    const cols = COLUMNAS[actual];
    const filas = registros(actual);
    const cab = cols.map(([k, , cls]) => `<th scope="col"${cls ? ` class="${cls}"` : ""}>${escapar(t(`erp.col.${k}`))}</th>`).join("");
    const cuerpo = filas.length
      ? filas
          .map((r) => {
            const propia = Boolean(r.creado);
            const celdas = cols
              .map(([k, f, cls], i) => {
                const v = f ? f(r) : escapar(r[k] ?? "");
                const marca = i === 0 && propia ? `<span class="erp-nuevo">${OK_SVG}<span class="oculto">${escapar(t("erp.nuevo"))}</span></span>` : "";
                return `<td${cls ? ` class="${cls}"` : ""}>${marca}${v}</td>`;
              })
              .join("");
            const clases = [propia ? "erp-propia" : "", r.id === nuevoId ? "erp-entra" : ""].filter(Boolean).join(" ");
            return `<tr${clases ? ` class="${clases}"` : ""}>${celdas}</tr>`;
          })
          .join("")
      : `<tr><td colspan="${cols.length}" class="erp-vacio">${escapar(t("erp.vacio"))}</td></tr>`;
    panel.innerHTML = `<div class="erp-tabla-caja"><table class="erp-tabla"><thead><tr>${cab}</tr></thead><tbody>${cuerpo}</tbody></table></div>` + historial();
    contenedor.querySelector(".erp-vaciar").hidden = !TABLAS.some((k) => propios(k).length);
    nuevoId = null;
  }

  // Base de conocimiento: debajo de los documentos, el historial de consultas al asistente.
  function historial() {
    const consultas = [...propios("consultas")].reverse();
    if (actual !== "conocimiento" || !consultas.length) return "";
    const filas = consultas
      .map((c) => {
        const resultado = c.encontrada ? escapar(c.fuente || "") : `<span class="erp-estado erp-estado-revisar">${escapar(t("erp.noEncontrada"))}</span>`;
        const clase = c.id === nuevoId ? ' class="erp-propia erp-entra"' : ' class="erp-propia"';
        return `<tr${clase}><td>${escapar(c.id)}</td><td>${escapar(c.pregunta)}</td><td>${resultado}</td></tr>`;
      })
      .join("");
    return `<h3 class="erp-subtitulo">${escapar(t("erp.historial"))}</h3><div class="erp-tabla-caja"><table class="erp-tabla erp-historial">` +
      `<thead><tr><th scope="col">${escapar(t("erp.col.id"))}</th><th scope="col">${escapar(t("erp.col.pregunta"))}</th><th scope="col">${escapar(t("erp.col.resultado"))}</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }

  function elegir(tabla, foco) {
    actual = tabla;
    pintar();
    if (foco) contenedor.querySelector(`#erp-tab-${tabla}`).focus();
  }

  contenedor.querySelector(".erp-tabs").addEventListener("click", (e) => {
    const b = e.target.closest('[role="tab"]');
    if (b) elegir(b.dataset.tabla, false);
  });
  // Teclado del patrón de pestañas: flechas, Inicio y Fin.
  contenedor.querySelector(".erp-tabs").addEventListener("keydown", (e) => {
    const i = TABLAS.indexOf(actual);
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABLAS.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    elegir(TABLAS[(destino + TABLAS.length) % TABLAS.length], true);
  });
  contenedor.querySelector(".erp-vaciar").addEventListener("click", () => {
    vaciar();
    anuncio.textContent = t("erp.vaciado");
  });
  addEventListener("bq-erp", (e) => {
    const { tabla, registro } = e.detail || {};
    if (registro) {
      actual = tabla === "consultas" ? "conocimiento" : tabla;
      nuevoId = registro.id;
      anuncio.textContent = t("erp.anadido", { id: registro.id, seccion: tabla === "consultas" ? t("erp.historial") : t(`erp.tab.${tabla}`) });
    }
    pintar();
    if (registro && !reduceMotion.matches) {
      const fila = panel.querySelector(".erp-entra");
      fila?.addEventListener("animationend", () => fila.classList.remove("erp-entra"), { once: true });
    }
  });
  pintar();
  return { elegir, elemento: contenedor };
}
