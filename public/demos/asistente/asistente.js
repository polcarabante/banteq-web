// Demostración interactiva «Asistentes de IA»: el visitante sube un documento (PDF, Word o TXT) o
// usa el manual de ejemplo, el asistente lo lee y lo divide en secciones, y responde a sus
// preguntas con frases del documento, citando sección y página. Si la respuesta no está, lo dice.
// Todo en el navegador (lib/asistente-busqueda.mjs): el documento no sale del equipo del visitante.
import { montarAhorro } from "../comun/ahorro.js?v=b860c75e88";
import { cargarMammoth, cargarPdfjs } from "../comun/carga.js?v=a4ae5b4595";
import { anadir, montarERP } from "../comun/erp.js?v=494fabfa89";
import { crearPasos } from "../comun/pasos.js?v=eb663277c1";
import { prepararSubida } from "../comun/subida.js?v=0f014d39f5";
import { escapar, esperar, idioma, mostrar, t } from "../comun/textos.js?v=792941e660";
import { bloquesDeLineas, buscar, indexar, resaltar, seccionar } from "../lib/asistente-busqueda.mjs?v=f83d2018a6";
import { formatoNumero } from "../lib/demos-ahorro.mjs?v=6c69fafb8a";
import { lineasConAltura } from "../lib/facturas-lectura.mjs?v=0eb1ca2fdd";

const $ = (s, raiz = document) => raiz.querySelector(s);
montarERP($("[data-erp]"));
const proceso = $(".proceso");
const cuerpo = $(".proceso-cuerpo");
const vacio = $("[data-vacio]");
const hoja = $(".vista-hoja");
const pieVista = $(".vista figcaption");
const avisoProceso = $("[data-aviso]");
const pasos = crearPasos($(".pasos"), $("#pasos-anuncio"));
const conversacion = $(".conversacion");
const mensajes = $("[data-mensajes]");
const formPregunta = $("[data-pregunta]");
const campo = $("#pregunta");

const MAX_PAGINAS = 60;
const DOC_SVG = '<svg class="i-doc" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13" fill="none"/></svg>';

class Fallo extends Error {}

let ronda = 0;
let actual = null; // { nombre, id, indice }
let ocupado = false;

const subida = prepararSubida($("[data-subida]"), {
  tipos: {
    pdf: { ext: [".pdf"], mime: ["application/pdf"] },
    docx: { ext: [".docx"], mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
    txt: { ext: [".txt"], mime: ["text/plain"] },
  },
  formatos: t("subida.formatos"),
  alElegir: (archivo, tipo) => procesar(archivo, tipo),
});

function aviso(texto) {
  avisoProceso.textContent = texto || "";
  avisoProceso.hidden = !texto;
}

function reiniciar() {
  pasos.reiniciar();
  aviso("");
  hoja.replaceChildren();
  hoja.className = "vista-hoja";
  vacio.hidden = true;
  cuerpo.hidden = false;
  conversacion.hidden = true;
  mensajes.replaceChildren();
  actual = null;
}

// --- Lectura ---------------------------------------------------------------------------------------

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
    const n = Math.min(doc.numPages, MAX_PAGINAS);
    const lineas = [];
    for (let p = 1; p <= n; p++) {
      const pagina = await doc.getPage(p);
      for (const l of lineasConAltura((await pagina.getTextContent()).items)) lineas.push({ ...l, pagina: p });
      if (p === 1 && r === ronda) {
        const vp = pagina.getViewport({ scale: 1.4 });
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.ceil(vp.width);
        lienzo.height = Math.ceil(vp.height);
        await pagina.render({ canvasContext: lienzo.getContext("2d"), canvas: lienzo, viewport: vp }).promise;
        hoja.replaceChildren(lienzo);
      }
    }
    if (lineas.map((l) => l.texto).join("").replace(/\s/g, "").length < 40) throw new Fallo(t("error.escaneado"));
    if (doc.numPages > MAX_PAGINAS) aviso(t("aviso.largo", { n: MAX_PAGINAS }));
    return { bloques: bloquesDeLineas(lineas), detalle: t("det.paginas", { n }) };
  } catch (e) {
    if (e instanceof Fallo) throw e;
    console.warn("[demo asistente] PDF:", e);
    throw new Fallo(t("error.pdf"));
  } finally {
    tarea.destroy();
  }
}

// Word: mammoth lo convierte en HTML; los h1–h6 son títulos y los párrafos, listas y tablas, texto.
async function leerDocx(archivo) {
  let mammoth;
  try {
    mammoth = await cargarMammoth();
  } catch {
    throw new Fallo(t("error.red"));
  }
  let html;
  try {
    ({ value: html } = await mammoth.convertToHtml({ arrayBuffer: await archivo.arrayBuffer() }));
  } catch {
    throw new Fallo(t("error.docx"));
  }
  const dom = new DOMParser().parseFromString(html, "text/html");
  const bloques = [];
  for (const el of dom.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,tr")) {
    if (el.closest("li,tr") && el.closest("li,tr") !== el) continue;
    const texto = (el.tagName === "TR" ? [...el.cells].map((c) => c.textContent.trim()).join(" · ") : el.textContent).replace(/\s+/g, " ").trim();
    if (!texto) continue;
    bloques.push({ tipo: /^H\d$/.test(el.tagName) ? "titulo" : "texto", texto: el.tagName === "LI" ? `- ${texto}` : texto });
  }
  // Sin estilos de título en el Word: se reconocen como en un TXT (numeración, mayúsculas).
  const conTitulos = bloques.some((b) => b.tipo === "titulo") ? bloques : bloquesDeLineas(bloques.map((b) => b.texto));
  vistaTexto(bloques.slice(0, 30).map((b) => b.texto));
  return { bloques: conTitulos, detalle: t("det.word") };
}

async function leerTxt(archivo) {
  const texto = await archivo.text();
  const lineas = texto.replace(/\r\n?/g, "\n").split("\n");
  vistaTexto(lineas.slice(0, 40));
  return { bloques: bloquesDeLineas(lineas), detalle: t("det.texto") };
}

function vistaTexto(lineas) {
  const pre = document.createElement("div");
  pre.className = "vista-texto";
  pre.textContent = lineas.join("\n");
  hoja.replaceChildren(pre);
}

// --- Proceso ----------------------------------------------------------------------------------------

async function procesar(archivo, tipo) {
  const r = ++ronda;
  reiniciar();
  hoja.classList.add("vista-leyendo");
  pieVista.textContent = t("vista", { archivo: archivo.name });
  mostrar(proceso);
  pasos.activo(0, t("det.leyendo", { archivo: archivo.name }));
  let res;
  try {
    res = tipo === "pdf" ? await leerPdf(archivo, r) : tipo === "docx" ? await leerDocx(archivo) : await leerTxt(archivo);
  } catch (e) {
    if (r !== ronda) return;
    if (!(e instanceof Fallo)) console.warn("[demo asistente]", e);
    hoja.classList.remove("vista-leyendo");
    pasos.error(0, t("det.error"));
    subida.mostrarError(e instanceof Fallo ? e.message : t("error.pdf"));
    return;
  }
  if (r !== ronda) return;
  pasos.hecho(0, res.detalle);
  await esperar(300);
  pasos.activo(1, "");
  const secciones = seccionar(res.bloques);
  if (!secciones.length) {
    hoja.classList.remove("vista-leyendo");
    pasos.error(1, t("det.error"));
    subida.mostrarError(t("error.sinTexto"));
    return;
  }
  const indice = indexar(secciones);
  // Se cuentan las secciones de una en una, para que se vea que el documento se está recorriendo.
  const n = secciones.length;
  const pasosCuenta = Math.min(n, 12);
  for (let i = 1; i <= pasosCuenta; i++) {
    pasos.detalle(1, t("det.secciones", { n: Math.round((n * i) / pasosCuenta) }));
    await esperar(70);
    if (r !== ronda) return;
  }
  hoja.classList.remove("vista-leyendo");
  pasos.hecho(1, t("det.secciones", { n }));
  const reg = anadir("conocimiento", { nombre: archivo.name, secciones: n, estado: "indexado" });
  actual = { nombre: archivo.name, id: reg.id, indice };
  $("[data-chat-titulo]").textContent = t("chat.titulo", { doc: archivo.name });
  burbuja("ia", `<p>${escapar(t("chat.hola", { doc: archivo.name, n }))}</p>`);
  conversacion.hidden = false;
  pasos.activo(2, t("det.escribe"));
  mostrar(conversacion, "start");
  campo.focus({ preventScroll: true });
}

function burbuja(quien, html) {
  const div = document.createElement("div");
  div.className = `burbuja burbuja-${quien}`;
  const nombre = quien === "yo" ? t("chat.tu") : t("chat.asistente");
  div.innerHTML = `<span class="oculto">${escapar(nombre)}: </span>${html}`;
  mensajes.append(div);
  mensajes.scrollTop = mensajes.scrollHeight;
  return div;
}

const marcado = (texto, terminos) =>
  resaltar(texto, terminos).map((p) => (p.marca ? `<mark>${escapar(p.texto)}</mark>` : escapar(p.texto))).join("");

function nombreSeccion(s) {
  const titulo = s.titulo || t("chat.fragmento", { n: s.n || 1 });
  return s.pagina ? `${titulo} · ${t("chat.pagina", { n: s.pagina })}` : titulo;
}

async function preguntar(texto) {
  const pregunta = texto.trim().slice(0, 300);
  if (!pregunta || !actual || ocupado) return;
  ocupado = true;
  formPregunta.querySelector("button").disabled = true;
  burbuja("yo", `<p>${escapar(pregunta)}</p>`);
  campo.value = "";
  pasos.hecho(2, `«${pregunta}»`);
  pasos.activo(3, t("det.buscando", { n: actual.indice.n }));
  const pensando = burbuja("ia pensando", '<span class="puntos" aria-hidden="true"><i></i><i></i><i></i></span>');
  await esperar(650);
  pensando.remove();
  const r = buscar(actual.indice, pregunta);
  const sec = r.encontrada ? actual.indice.secciones[r.seccion] : null;
  if (sec) {
    const frase = (texto, j) => (j === r.destacada ? `<p class="frase-clave"><span>${marcado(texto, r.terminos)}</span></p>` : `<p>${marcado(texto, r.terminos)}</p>`);
    const frases = r.frases.map((j) => frase(sec.frases[j].texto, j)).join("");
    const completa = sec.frases.length > r.frases.length
      ? `<details class="seccion-completa"><summary>${escapar(t("chat.verSeccion"))}</summary>${sec.frases.map((f, j) => frase(f.texto, j)).join("")}</details>`
      : "";
    burbuja("ia",
      `<p class="burbuja-intro">${escapar(t("chat.segun"))}</p><blockquote class="cita">${frases}</blockquote>` +
      `<p class="fuente">${DOC_SVG}${escapar(t("chat.fuente", { doc: actual.nombre, seccion: nombreSeccion(sec) }))}</p>${completa}`);
    pasos.hecho(3, t("det.fuente", { seccion: sec.titulo || t("chat.fragmento", { n: sec.n || 1 }) }));
  } else {
    burbuja("ia no-esta", `<p>${escapar(r.vacia ? t("chat.vacia") : t("chat.noEsta", { doc: actual.nombre }))}</p>`);
    pasos.aviso(3, t("det.noEsta"));
  }
  anadir("consultas", {
    pregunta, encontrada: Boolean(sec), doc: actual.id,
    fuente: sec ? `${sec.titulo || t("chat.fragmento", { n: sec.n || 1 })}${sec.pagina ? ` · ${t("chat.pagina", { n: sec.pagina })}` : ""}` : "",
  });
  pasos.activo(2, t("det.escribe"));
  ocupado = false;
  formPregunta.querySelector("button").disabled = false;
}

formPregunta.addEventListener("submit", (e) => {
  e.preventDefault();
  preguntar(campo.value);
});
document.querySelectorAll(".sugerencia").forEach((b) => b.addEventListener("click", () => preguntar(b.textContent)));

document.querySelectorAll("[data-ejemplo]").forEach((b) =>
  b.addEventListener("click", async () => {
    const url = b.dataset.ejemplo;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(String(resp.status));
      subida.comprobar(new File([await resp.blob()], url.split("/").pop(), { type: "application/pdf" }));
    } catch {
      subida.mostrarError(t("error.ejemplo"));
    }
  }),
);

// --- Ahorro --------------------------------------------------------------------------------------
const num = (n, d = 0) => formatoNumero(n, idioma, d);
montarAhorro($("[data-ahorro]"), "asistente", {
  unidades: {
    empleados: ["{v}", "a.empleados.largo"], consultasSemana: ["{v}", "a.consultasSemana.largo"], minBuscando: ["unidad.min", "unidad.minLargo"],
  },
  formula: (r, f) => {
    const v = r.valores;
    return t("a.formula", {
      empleados: num(v.empleados), consultasSemana: num(v.consultasSemana), consultasMes: num(r.partes.consultasMes), parteResuelta: num(v.parteResuelta),
      minBuscando: num(v.minBuscando), minConAsistente: num(v.minConAsistente), horas: f.horas,
      costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), mes: f.mes, año: f.año,
    });
  },
  mensaje: (r, f) => {
    const v = r.valores;
    return t("a.mensaje", { empleados: num(v.empleados), consultasSemana: num(v.consultasSemana), minBuscando: num(v.minBuscando), mes: f.mes, año: f.año });
  },
});
