// Demostración interactiva «Automatización de procesos»: una factura de proveedor (del visitante o
// de ejemplo) se lee, se extraen sus datos, se comprueban contra el ERP de la demostración y se
// registra. Todo en el navegador: el archivo no sale del equipo del visitante.
//   PDF con texto → pdf.js · PDF escaneado o imagen → OCR (tesseract.js) · XML Facturae → lectura exacta
import { montarAhorro } from "../comun/ahorro.js";
import { cargarPdfjs, reconocerTexto } from "../comun/carga.js";
import { anadir, montarERP, registros } from "../comun/erp.js";
import { crearPasos } from "../comun/pasos.js";
import { prepararSubida } from "../comun/subida.js";
import { AVISO_SVG, ERROR_SVG, OK_SVG, escapar, esperar, idioma, mostrar, t } from "../comun/textos.js";
import { formatoEuros, formatoNumero } from "../lib/demos-ahorro.mjs";
import { EMPRESA_DEMO, PEDIDOS } from "../lib/demos-erp-datos.mjs";
import {
  CAMPOS, OBLIGATORIOS, camposEncontrados, esFacturae, extraerCampos, leerFacturae, lineasDeItems, normalizarNif, pareceFactura, parseImporte, validarFactura,
} from "../lib/facturas-lectura.mjs";

const $ = (s, raiz = document) => raiz.querySelector(s);
const erp = montarERP($("[data-erp]"));
const proceso = $(".proceso");
const cuerpo = $(".proceso-cuerpo");
const vacio = $("[data-vacio]");
const hoja = $(".vista-hoja");
const pieVista = $(".vista figcaption");
const avisoProceso = $("[data-aviso]");
const pasos = crearPasos($(".pasos"), $("#pasos-anuncio"));
const revision = $(".revision");
const form = $(".campos");
const checks = $(".checks");
const botonRegistrar = $("[data-registrar]");
const botonOtra = $("[data-otra]");
const final = $("[data-final]");

const IMPORTES = ["base", "iva", "total"];
const ICONO = { ok: OK_SVG, aviso: AVISO_SVG, error: ERROR_SVG };
const euros = (n) => formatoEuros(n, idioma, 2);

class Fallo extends Error {}

let ronda = 0; // cada archivo nuevo deja sin efecto el anterior
let actual = null; // { campos, leido, validacion, registrado }
let urlImagen = null;

const subida = prepararSubida($("[data-subida]"), {
  tipos: {
    pdf: { ext: [".pdf"], mime: ["application/pdf"] },
    imagen: { ext: [".jpg", ".jpeg", ".png"], mime: ["image/jpeg", "image/png"] },
    xml: { ext: [".xml"], mime: ["text/xml", "application/xml"] },
  },
  formatos: t("subida.formatos"),
  alElegir: (archivo, tipo) => procesar(archivo, tipo),
});

function aviso(texto, tipo = "info") {
  avisoProceso.textContent = texto || "";
  avisoProceso.hidden = !texto;
  avisoProceso.dataset.tipo = tipo;
}

function reiniciar(conProceso) {
  pasos.reiniciar();
  aviso("");
  if (urlImagen) URL.revokeObjectURL(urlImagen);
  urlImagen = null;
  hoja.replaceChildren();
  hoja.className = "vista-hoja";
  vacio.hidden = conProceso;
  cuerpo.hidden = !conProceso;
  revision.hidden = true;
  final.hidden = true;
  checks.replaceChildren();
  form.classList.remove("campos-entran");
  for (const el of form.elements) {
    el.value = "";
    el.disabled = false;
    el.removeAttribute("aria-invalid");
  }
  form.querySelectorAll(".campo-aviso").forEach((s) => (s.hidden = true));
  botonRegistrar.hidden = false;
  botonOtra.hidden = true;
  actual = null;
}

// --- Lectura ----------------------------------------------------------------------------------------

async function ocr(imagen, r) {
  pasos.detalle(0, t("det.ocrCarga"));
  try {
    return await reconocerTexto(imagen, (p) => {
      if (r === ronda) pasos.detalle(0, t("det.ocrProgreso", { p }));
    });
  } catch {
    throw new Fallo(t("error.red"));
  }
}

async function pintarPagina(pagina, escala) {
  const vp = pagina.getViewport({ scale: escala });
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.ceil(vp.width);
  lienzo.height = Math.ceil(vp.height);
  await pagina.render({ canvasContext: lienzo.getContext("2d"), canvas: lienzo, viewport: vp }).promise;
  return lienzo;
}

async function leerPdf(archivo, r) {
  let pdfjs;
  try {
    pdfjs = await cargarPdfjs();
  } catch {
    throw new Fallo(t("error.red"));
  }
  let tarea;
  let doc;
  try {
    tarea = pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()), isEvalSupported: false });
    doc = await tarea.promise;
  } catch {
    tarea?.destroy();
    throw new Fallo(t("error.pdf"));
  }
  try {
    let lineas = [];
    for (let p = 1; p <= Math.min(doc.numPages, 3); p++) {
      const pagina = await doc.getPage(p);
      lineas.push(...lineasDeItems((await pagina.getTextContent()).items));
    }
    const primera = await doc.getPage(1);
    if (r !== ronda) return null;
    hoja.replaceChildren(await pintarPagina(primera, 1.5));
    // Sin texto: es un escaneo. Se lee la primera página con OCR.
    if (lineas.join("").replace(/\s/g, "").length < 30) {
      aviso(t("det.escaneado"));
      const texto = await ocr(await pintarPagina(primera, 2.6), r);
      return { lineas: texto.split(/\r?\n/), detalle: t("det.ocr") };
    }
    return { lineas, detalle: t("det.paginas", { n: doc.numPages }) };
  } catch (e) {
    if (e instanceof Fallo) throw e;
    console.warn("[demo facturas] PDF:", e);
    throw new Fallo(t("error.pdf"));
  } finally {
    tarea.destroy(); // libera el worker de pdf.js y la memoria del documento
  }
}

async function leerImagen(archivo, r) {
  urlImagen = URL.createObjectURL(archivo);
  const img = new Image();
  img.alt = "";
  img.src = urlImagen;
  try {
    await img.decode();
  } catch {
    throw new Fallo(t("error.imagen"));
  }
  hoja.replaceChildren(img);
  aviso(t("aviso.imagen"));
  const texto = await ocr(img, r);
  return { lineas: texto.split(/\r?\n/), detalle: t("det.ocr") };
}

async function leerXml(archivo) {
  const texto = await archivo.text();
  if (!esFacturae(texto)) throw new Fallo(t("error.xml"));
  const pre = document.createElement("pre");
  pre.className = "vista-xml";
  pre.textContent = texto.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*<\?xml[^>]*>\s*/, "").split("\n").filter((l) => l.trim()).slice(0, 40).join("\n");
  hoja.replaceChildren(pre);
  return { campos: leerFacturae(texto), detalle: t("det.xml") };
}

// --- Campos y comprobaciones ------------------------------------------------------------------------

const valorCampo = (k, v) => (IMPORTES.includes(k) ? (v === null || v === undefined ? "" : formatoNumero(v, idioma, 2)) : v ?? "");

function rellenar(campos) {
  for (const k of CAMPOS) form.elements[k].value = valorCampo(k, campos[k]);
  const tipo = campos.tipoIva;
  $('[data-campo="iva"] .campo-extra').textContent = tipo === null || tipo === undefined ? "" : ` (${formatoNumero(tipo, idioma, tipo % 1 ? 1 : 0)} %)`;
}

function leerFormulario() {
  const c = { ...actual.campos };
  for (const k of CAMPOS) {
    const input = form.elements[k];
    const texto = input.value.trim();
    let mal = "";
    if (IMPORTES.includes(k)) {
      c[k] = texto ? parseImporte(texto) : null;
      if (texto && c[k] === null) mal = t("campo.importeMal");
    } else c[k] = k === "nif" ? normalizarNif(texto) : texto;
    if (!mal && OBLIGATORIOS.includes(k) && (c[k] === "" || c[k] === null)) mal = t("campo.noEncontrado");
    const nota = $(`#c-${k}-aviso`);
    nota.textContent = mal;
    nota.hidden = !mal;
    if (mal) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }
  return c;
}

function textoCheck({ clave, estado, datos }) {
  if (clave === "campos") return estado === "ok" ? t("c.campos.ok") : t("c.campos.error", { lista: datos.faltan.map((k) => t(`campo.${k}`)).join(", ") });
  if (clave === "cuadra") return estado === "ok" ? t("c.cuadra.ok", { total: euros(datos.total) }) : estado === "error" ? t("c.cuadra.error", { suma: euros(datos.suma), total: euros(datos.total) }) : t("c.cuadra.aviso");
  if (clave === "nif") return estado === "ok" ? t("c.nif.ok", { nif: datos.nif }) : datos.nif ? t("c.nif.error", { nif: datos.nif }) : t("c.nif.falta");
  if (clave === "duplicada") return estado === "ok" ? t("c.duplicada.ok") : t("c.duplicada.error", { id: datos.id });
  if (estado === "ok") return t("c.pedido.ok", { id: datos.id });
  return estado === "error" ? t("c.pedido.error", { id: datos.id, esperado: euros(datos.esperado) }) : t("c.pedido.aviso");
}

// Motivo de «pendiente de revisar», guardado como clave para que el ERP lo pinte en cada idioma.
function motivoDe(m) {
  if (!m) return null;
  return { k: m.clave === "pedido" ? `m.pedido.${m.estado}` : `m.${m.clave}`, v: { id: m.datos?.id || "" } };
}

function comprobar() {
  const c = leerFormulario();
  const v = validarFactura(c, { pedidos: PEDIDOS, registradas: registros("facturas") });
  checks.innerHTML = v.comprobaciones
    .map((x) => `<li class="check check-${x.estado}">${ICONO[x.estado]}<span>${escapar(textoCheck(x))}</span></li>`)
    .join("");
  botonRegistrar.querySelector("span").textContent = v.registrable ? t("boton.registrar") : t("boton.pendiente");
  botonRegistrar.classList.toggle("boton-aviso", !v.registrable);
  Object.assign(actual, { leido: c, validacion: v });
  return v;
}

async function escalonar() {
  form.querySelectorAll(".campo").forEach((el, i) => el.style.setProperty("--i", i));
  form.classList.add("campos-entran");
  await esperar(CAMPOS.length * 70 + 250);
}

// --- Proceso completo ----------------------------------------------------------------------------

async function procesar(archivo, tipo) {
  const r = ++ronda;
  reiniciar(true);
  hoja.classList.add("vista-leyendo");
  pieVista.textContent = t("vista", { archivo: archivo.name });
  mostrar(proceso);
  pasos.activo(0, t("det.leyendo", { archivo: archivo.name }));
  let res;
  try {
    res = tipo === "xml" ? await leerXml(archivo) : tipo === "imagen" ? await leerImagen(archivo, r) : await leerPdf(archivo, r);
  } catch (e) {
    if (r !== ronda) return;
    if (!(e instanceof Fallo)) console.warn("[demo facturas]", e);
    hoja.classList.remove("vista-leyendo");
    pasos.error(0, t("det.error"));
    subida.mostrarError(e instanceof Fallo ? e.message : t("error.pdf"));
    return;
  }
  if (r !== ronda || !res) return;
  pasos.hecho(0, res.detalle);
  await esperar(350);
  pasos.activo(1, "");
  await esperar(700);
  if (r !== ronda) return;
  const campos = res.campos || extraerCampos(res.lineas, { nifPropio: EMPRESA_DEMO.nif });
  hoja.classList.remove("vista-leyendo");
  const n = camposEncontrados(campos);
  (n >= OBLIGATORIOS.length ? pasos.hecho : pasos.aviso)(1, t("det.campos", { n, total: CAMPOS.length }));
  if (!pareceFactura(campos)) aviso(t("aviso.nofactura"), "aviso");
  actual = { campos, registrado: false };
  rellenar(campos);
  revision.hidden = false;
  await escalonar();
  if (r !== ronda) return;
  pasos.activo(2, "");
  await esperar(550);
  if (r !== ronda) return;
  const v = comprobar();
  const bien = v.comprobaciones.filter((x) => x.estado === "ok").length;
  (v.registrable ? pasos.hecho : pasos.aviso)(2, t("det.comprobaciones", { n: bien, total: v.comprobaciones.length }));
  pasos.activo(3, t("det.confirma"));
  mostrar(revision, "start");
  $("#t-paso3").focus({ preventScroll: true });
}

form.addEventListener("input", () => {
  if (actual && !actual.registrado) comprobar();
});
form.addEventListener("submit", (e) => e.preventDefault());

botonRegistrar.addEventListener("click", () => {
  if (!actual || actual.registrado) return;
  const v = comprobar();
  const c = actual.leido;
  const motivo = v.registrable ? null : motivoDe(v.motivo);
  const reg = anadir("facturas", {
    proveedor: c.proveedor || "—", nif: c.nif, numero: c.numero, total: c.total,
    estado: v.registrable ? "registrada" : "revisar", motivo,
  });
  actual.registrado = true;
  for (const el of form.elements) el.disabled = true;
  botonRegistrar.hidden = true;
  botonOtra.hidden = false;
  if (v.registrable) pasos.hecho(3, t("det.registrada", { id: reg.id }));
  else pasos.aviso(3, t("det.pendiente", { id: reg.id }));
  const texto = v.registrable ? t("aviso.registrada", { id: reg.id }) : t("aviso.pendiente", { id: reg.id, motivo: t(motivo.k, motivo.v) });
  final.dataset.tipo = v.registrable ? "ok" : "aviso";
  final.innerHTML = `${v.registrable ? OK_SVG : AVISO_SVG}<span>${escapar(texto)}</span>`;
  final.hidden = false;
  botonOtra.focus({ preventScroll: true });
  // En el móvil el ERP queda debajo: se baja hasta él para ver la fila nueva.
  if (matchMedia("(max-width: 979.98px)").matches) setTimeout(() => mostrar(erp.elemento, "start"), 400);
});

botonOtra.addEventListener("click", () => {
  ronda++;
  reiniciar(false);
  mostrar($("[data-subida]"), "center");
  $("#archivo").focus({ preventScroll: true });
});

// Ejemplos: se descargan de /demos/ejemplos/ y pasan por la misma comprobación que un archivo propio.
document.querySelectorAll("[data-ejemplo]").forEach((b) =>
  b.addEventListener("click", async () => {
    const url = b.dataset.ejemplo;
    const nombre = url.split("/").pop();
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(String(resp.status));
      const blob = await resp.blob();
      subida.comprobar(new File([blob], nombre, { type: nombre.endsWith(".xml") ? "application/xml" : "application/pdf" }));
    } catch {
      subida.mostrarError(t("error.ejemplo"));
    }
  }),
);

// --- Ahorro --------------------------------------------------------------------------------------
const num = (n, d = 0) => formatoNumero(n, idioma, d);
montarAhorro($("[data-ahorro]"), "facturas", {
  unidades: { facturasMes: ["a.facturasMes.v", "a.facturasMes.largo"], minFactura: ["unidad.min", "unidad.minLargo"], costeHora: ["unidad.eurHora", "unidad.eurHoraLargo"] },
  formula: (r, f) => {
    const v = r.valores;
    return t("a.formula", {
      facturasMes: num(v.facturasMes), minFactura: num(v.minFactura), parteAutomatica: num(v.parteAutomatica), horas: f.horas,
      costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), tiempo: formatoEuros(r.partes.tiempoMes, idioma),
      tasaError: num(v.tasaError, v.tasaError % 1 ? 1 : 0), costeError: formatoEuros(v.costeError, idioma), errores: formatoEuros(r.partes.erroresMes, idioma),
      mes: f.mes, año: f.año,
    });
  },
  mensaje: (r, f) => {
    const v = r.valores;
    return t("a.mensaje", { facturasMes: num(v.facturasMes), minFactura: num(v.minFactura), costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), mes: f.mes, año: f.año });
  },
});
