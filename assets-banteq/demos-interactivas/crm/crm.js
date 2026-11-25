// Demostración interactiva «Ventas y CRM»: un contacto del formulario web de prueba o una lista
// (CSV o Excel) entra en el CRM del ERP de la demostración, se comprueba si ya existía, se clasifica
// (sector, prioridad, origen), se le prepara el correo de bienvenida y se crea la tarea de
// seguimiento para un comercial. Todo en el navegador (lib/crm-leads.mjs); no se envía nada.
import { montarAhorro } from "../comun/ahorro.js";
import { cargarSheetjs } from "../comun/carga.js";
import { anadir, montarERP, registros } from "../comun/erp.js";
import { crearPasos } from "../comun/pasos.js";
import { prepararSubida } from "../comun/subida.js";
import { AVISO_SVG, escapar, esperar, fechaCorta, fechaLarga, idioma, mostrar, OK_SVG, t } from "../comun/textos.js";
import { EMAIL, contactosDeFilas, iniciales, leerCsv, procesarContactos, telefonoCifras } from "../lib/crm-leads.mjs";
import { formatoEuros, formatoNumero } from "../lib/demos-ahorro.mjs";
import { EMPRESA_DEMO } from "../lib/demos-erp-datos.mjs";

const $ = (s, raiz = document) => raiz.querySelector(s);
montarERP($("[data-erp]"));
const proceso = $(".proceso");
const cuerpo = $(".proceso-cuerpo");
const vacio = $("[data-vacio]");
const avisoProceso = $("[data-aviso]");
const pasos = crearPasos($(".pasos"), $("#pasos-anuncio"));
const resultado = $(".resultado");
const resumen = $("[data-resumen]");
const detalle = $("[data-detalle]");
const form = $("[data-form]");
const errorForm = $(".form-error");

const MAXIMO = 200;
class Fallo extends Error {}
let ronda = 0;

// --- Pestañas: formulario o lista ------------------------------------------------------------------
const modos = [...document.querySelectorAll('.modos [role="tab"]')];
function elegirModo(boton, foco) {
  for (const b of modos) {
    const sel = b === boton;
    b.setAttribute("aria-selected", String(sel));
    b.tabIndex = sel ? 0 : -1;
    document.getElementById(b.getAttribute("aria-controls")).hidden = !sel;
  }
  if (foco) boton.focus();
}
modos.forEach((b, i) => {
  b.addEventListener("click", () => elegirModo(b, false));
  b.addEventListener("keydown", (e) => {
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: modos.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    elegirModo(modos[(destino + modos.length) % modos.length], true);
  });
});

// --- Formulario web de prueba ---------------------------------------------------------------------
const EJEMPLOS = [
  { nombre: "Marc Vidal", empresa: "Mecanizados Rubí S.L.", email: "marc.vidal@mecanizadosrubi.es", telefono: "600 000 112", mensaje: "ej.1", origen: "web" },
  { nombre: "Laura Gómez", empresa: "Talleres Gómez", email: "laura@talleresgomez.es", telefono: "", mensaje: "ej.2", origen: "recomendacion" },
  { nombre: "Jordi Serra", empresa: "", email: "jserra.info@gmail.com", telefono: "", mensaje: "ej.3", origen: "redes" },
];
let ejemplo = 0;
$("[data-rellenar]").addEventListener("click", () => {
  const e = EJEMPLOS[ejemplo++ % EJEMPLOS.length];
  for (const [k, v] of Object.entries(e)) form.elements[k].value = k === "mensaje" ? t(v) : v;
  errorForm.hidden = true;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const c = Object.fromEntries(["nombre", "empresa", "email", "telefono", "mensaje"].map((k) => [k, form.elements[k].value.trim()]));
  const error = !c.nombre && !c.empresa ? ["form.faltaNombre", "nombre"]
    : !c.email && telefonoCifras(c.telefono).length < 9 ? ["form.faltaContacto", "email"]
    : c.email && !EMAIL.test(c.email) ? ["form.emailMal", "email"] : null;
  for (const k of ["nombre", "email"]) form.elements[k].removeAttribute("aria-invalid");
  if (error) {
    errorForm.textContent = t(error[0]);
    errorForm.hidden = false;
    form.elements[error[1]].setAttribute("aria-invalid", "true");
    form.elements[error[1]].focus();
    return;
  }
  errorForm.hidden = true;
  c.origenFijo = form.elements.origen.value;
  procesar([c], { modo: "form", nombre: c.nombre || c.empresa });
  form.reset();
});

// --- Lista (CSV o Excel) ------------------------------------------------------------------------------
const subida = prepararSubida($("[data-subida]"), {
  tipos: {
    csv: { ext: [".csv"], mime: ["text/csv"] },
    xlsx: { ext: [".xlsx"], mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  },
  formatos: t("subida.formatos"),
  alElegir: (archivo, tipo) => leerLista(archivo, tipo),
});

async function filasDe(archivo, tipo) {
  if (tipo === "csv") return leerCsv(await archivo.text());
  let XLSX;
  try {
    XLSX = await cargarSheetjs();
  } catch {
    throw new Fallo(t("error.red"));
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  // Un .xlsx es un ZIP (empieza por «PK»); si no, SheetJS lo leería como texto y daría basura.
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Fallo(t("error.lista"));
  try {
    const libro = XLSX.read(bytes, { type: "array", cellDates: false });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: "", blankrows: false }).map((f) => f.map((x) => String(x ?? "").trim()));
  } catch {
    throw new Fallo(t("error.lista"));
  }
}

async function leerLista(archivo, tipo) {
  let filas;
  try {
    filas = await filasDe(archivo, tipo);
  } catch (e) {
    subida.mostrarError(e instanceof Fallo ? e.message : t("error.lista"));
    return;
  }
  const { contactos, faltan, total } = contactosDeFilas(filas, { maximo: MAXIMO });
  if (faltan.length) return subida.mostrarError(t("error.columnas"));
  if (!contactos.length) return subida.mostrarError(t("error.sinFilas"));
  procesar(contactos, { modo: "lista", archivo: archivo.name, total });
}

document.querySelectorAll("[data-ejemplo]").forEach((b) =>
  b.addEventListener("click", async () => {
    const url = b.dataset.ejemplo;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(String(resp.status));
      subida.comprobar(new File([await resp.blob()], url.split("/").pop(), { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    } catch {
      subida.mostrarError(t("error.ejemplo"));
    }
  }),
);

// --- Proceso ----------------------------------------------------------------------------------------

const nombreDe = (c) => c.nombre || c.empresa;
const pila = (c) => (c.nombre || c.empresa || "").split(/\s+/)[0];

function textoTarea(r) {
  return t(`tarea.${r.accion.tipo}`, { nombre: nombreDe(r.contacto) });
}

async function procesar(contactos, { modo, archivo, total }) {
  const r0 = ++ronda;
  pasos.reiniciar();
  avisoProceso.hidden = true;
  vacio.hidden = true;
  cuerpo.hidden = false;
  resultado.hidden = true;
  resumen.replaceChildren();
  detalle.replaceChildren();
  mostrar(proceso);
  const uno = modo === "form";
  // Se compara con los contactos del CRM que no son duplicados, del más antiguo al más nuevo: así un
  // repetido apunta siempre al original.
  const existentes = registros("crm").filter((r) => r.estado !== "duplicado").sort((a, b) => a.id.localeCompare(b.id));
  const res = procesarContactos(contactos, existentes, { origenPorDefecto: uno ? "web" : "importacion" });

  // 1. Alta: se registran en el CRM (los duplicados, marcados para unir; los incompletos, no).
  pasos.activo(0, uno ? t("det.recibido", { nombre: nombreDe(contactos[0]) }) : t("det.leyendo", { archivo }));
  await esperar(650);
  if (r0 !== ronda) return;
  const idPorFila = {};
  for (const r of res.filter((x) => x.valido)) {
    const c = r.contacto;
    const base = { contacto: c.nombre, empresa: c.empresa, email: c.email, telefono: c.telefono, origen: r.origen, prioridad: r.prioridad, sector: r.sector };
    const con = r.duplicado ? r.duplicado.id || idPorFila[r.duplicado.fila] : null;
    const reg = anadir("crm", r.duplicado ? { ...base, estado: "duplicado", accion: { tipo: "fusionar", con } } : { ...base, estado: "nuevo", accion: r.accion });
    r.id = reg.id;
    r.con = con;
    if (c.fila) idPorFila[c.fila] = reg.id;
  }
  if (total > MAXIMO) {
    avisoProceso.textContent = t("aviso.maximo", { n: MAXIMO, total });
    avisoProceso.hidden = false;
  }
  pasos.hecho(0, uno ? `${res[0].id} · ${nombreDe(contactos[0])}` : t("det.leidos", { n: res.length }));

  // 2. Duplicados.
  await esperar(350);
  pasos.activo(1, "");
  await esperar(650);
  if (r0 !== ronda) return;
  const dups = res.filter((r) => r.duplicado);
  if (uno) (dups.length ? pasos.aviso : pasos.hecho)(1, dups.length ? t("det.dup", { con: res[0].con }) : t("det.sinDup"));
  else (dups.length ? pasos.aviso : pasos.hecho)(1, t("det.dups", { n: dups.length }));

  // 3. Clasificación.
  await esperar(300);
  pasos.activo(2, "");
  await esperar(650);
  if (r0 !== ronda) return;
  const validos = res.filter((r) => r.valido);
  if (uno) {
    const r = res[0];
    pasos.hecho(2, t("det.clasif", { sector: t(`sector.${r.sector}`), prioridad: t(`erp.prioridad.${r.prioridad}`), origen: t(`erp.origen.${r.origen}`) }));
  } else {
    const n = (p) => validos.filter((r) => r.prioridad === p).length;
    pasos.hecho(2, t("det.clasifLista", { alta: n("alta"), media: n("media"), baja: n("baja") }));
  }

  // 4 y 5. Bienvenida y tarea (solo los nuevos).
  const nuevos = validos.filter((r) => !r.duplicado);
  for (const [i, clave, n1] of [[3, "det.correo", "det.correos"], [4, "det.tarea", "det.tareas"]]) {
    await esperar(300);
    pasos.activo(i, "");
    await esperar(650);
    if (r0 !== ronda) return;
    if (uno && !nuevos.length) pasos.hecho(i, t("det.noAplica"));
    else if (uno) {
      const clave1 = i === 3 && nuevos[0].canal === "whatsapp" ? "det.correoWa" : clave;
      pasos.hecho(i, t(clave1, { nombre: nombreDe(nuevos[0].contacto), tarea: `${textoTarea(nuevos[0])} · ${fechaCorta(new Date(nuevos[0].accion.fecha))}` }));
    }
    else pasos.hecho(i, t(n1, { n: nuevos.length }));
  }

  pintarResultado(res, uno);
  resultado.hidden = false;
  mostrar(resultado, "start");
  $("#t-paso3").focus({ preventScroll: true });
}

// --- Resultado ----------------------------------------------------------------------------------------

function ficha(r) {
  const c = r.contacto;
  const motivos = r.motivos.length ? r.motivos.map((m) => t(`motivo.${m}`)).join(" · ") : t("res.porqueNada");
  return (
    `<div class="ficha"><span class="ficha-ava" aria-hidden="true">${escapar(iniciales(nombreDe(c)))}</span><div class="ficha-datos">` +
    `<b>${escapar(nombreDe(c))}</b><small>${escapar([c.nombre ? c.empresa : "", c.email || c.telefono].filter(Boolean).join(" · "))}</small>` +
    `<div class="chips"><span class="chip">${escapar(t(`sector.${r.sector}`))}</span><span class="chip chip-${r.prioridad}">${escapar(t(`erp.prioridad.${r.prioridad}`))}</span>` +
    `<span class="chip">${escapar(t(`erp.origen.${r.origen}`))}</span></div>` +
    `<p class="ficha-porque"><b>${escapar(t("res.porque"))}</b> ${escapar(motivos)}</p></div>` +
    `<span class="ficha-id">${escapar(r.id)}</span></div>`
  );
}

function correo(r) {
  const c = r.contacto;
  const fecha = fechaLarga(new Date(r.accion.fecha));
  const resumenMsg = (c.mensaje || "").replace(/\s+/g, " ").trim();
  const sobre = resumenMsg ? t("email.sobre", { resumen: resumenMsg.length > 70 ? `${resumenMsg.slice(0, 67).trim()}…` : resumenMsg }) : "";
  const lineas = [
    t("email.saludo", { nombre: pila(c) }),
    "",
    t("email.recibido", { empresa: EMPRESA_DEMO.nombre, sobre }),
    t(r.accion.tipo === "llamar" ? "email.llamar" : "email.escribir", { comercial: r.accion.comercial, fecha }),
    ...(r.sector !== "otros" ? [t("email.sector", { sector: t(`sector.${r.sector}`).toLowerCase() })] : []),
    "",
    t("email.cierre"),
    "",
    t("email.firma"),
    r.accion.comercial,
    EMPRESA_DEMO.nombre,
  ];
  return (
    `<div class="correo"><div class="chat-barra"><i></i><i></i><i></i><b>${escapar(t(r.canal === "whatsapp" ? "correo.ventanaWa" : "correo.ventana"))}</b></div>` +
    `<div class="correo-cab"><small>${escapar(t("correo.para"))}</small><span>${escapar(c.email || c.telefono)}</span></div>` +
    (r.canal === "whatsapp" ? "" : `<div class="correo-cab"><small>${escapar(t("correo.asunto"))}</small><span>${escapar(t("email.asunto", { nombre: pila(c) }))}</span></div>`) +
    `<div class="correo-cuerpo">${escapar(lineas.join("\n"))}</div>` +
    `<p class="correo-estado">${OK_SVG}${escapar(t("correo.estado"))}</p></div>`
  );
}

function tarea(r) {
  const fecha = fechaCorta(new Date(r.accion.fecha));
  return (
    `<div class="tarea"><span class="tarea-ico" aria-hidden="true">${r.accion.tipo === "llamar" ? "☎" : "@"}</span>` +
    `<span><b>${escapar(textoTarea(r))}</b><small>${escapar(t("tarea.detalle", { fecha, comercial: r.accion.comercial }))}</small></span>` +
    `<span class="chip">${escapar(t("tarea.ventana"))}</span></div>`
  );
}

function pintarDetalle(r) {
  if (!r) return detalle.replaceChildren();
  detalle.innerHTML = r.duplicado
    ? ficha(r) + `<p class="aviso-final" data-tipo="aviso">${AVISO_SVG}<span>${escapar(t("res.dupAviso", { con: r.con }))}</span></p>`
    : ficha(r) + correo(r) + tarea(r);
}

function pintarResultado(res, uno) {
  if (uno) return pintarDetalle(res[0]);
  const nuevos = res.filter((r) => r.valido && !r.duplicado);
  const cuenta = { n: res.length, nuevos: nuevos.length, dups: res.filter((r) => r.duplicado).length, mal: res.filter((r) => !r.valido).length };
  const filas = res.map((r) => {
    const c = r.contacto;
    const resultadoTxt = !r.valido ? `<span class="res-mal">${escapar(t(`res.problema.${r.problema}`))}</span>`
      : r.duplicado ? `<span class="res-dup">${escapar(r.duplicado.id ? t("res.dupCrm", { id: r.duplicado.id }) : t("res.dupFila", { fila: r.duplicado.fila }))}</span>`
      : escapar(t("res.nuevo", { id: r.id }));
    return `<tr><td>${escapar(nombreDe(c) || "—")}<small>${escapar(c.nombre ? c.empresa || "" : "")}</small></td>` +
      `<td>${r.valido ? escapar(t(`sector.${r.sector}`)) : "—"}</td>` +
      `<td>${r.valido ? `<span class="chip chip-${r.prioridad}">${escapar(t(`erp.prioridad.${r.prioridad}`))}</span>` : "—"}</td><td>${resultadoTxt}</td></tr>`;
  }).join("");
  const opciones = nuevos.map((r, i) => `<option value="${i}">${escapar(`${r.id} · ${nombreDe(r.contacto)}`)}</option>`).join("");
  resumen.innerHTML =
    `<p class="res-resumen">${escapar(t("res.resumen", cuenta))}</p>` +
    `<div class="erp-tabla-caja"><table class="erp-tabla tabla-res"><thead><tr><th scope="col">${escapar(t("res.col.contacto"))}</th><th scope="col">${escapar(t("res.col.sector"))}</th>` +
    `<th scope="col">${escapar(t("res.col.prioridad"))}</th><th scope="col">${escapar(t("res.col.resultado"))}</th></tr></thead><tbody>${filas}</tbody></table></div>` +
    (nuevos.length ? `<div class="res-ver"><label for="res-ver">${escapar(t("res.ver"))}</label><select id="res-ver">${opciones}</select></div>` : "");
  const sel = $("#res-ver");
  // Primero, el de prioridad más alta.
  const orden = { alta: 0, media: 1, baja: 2 };
  const primero = nuevos.reduce((m, r, i) => (orden[r.prioridad] < orden[nuevos[m].prioridad] ? i : m), 0);
  if (sel) {
    sel.value = String(primero);
    sel.addEventListener("change", () => pintarDetalle(nuevos[Number(sel.value)]));
  }
  pintarDetalle(nuevos[primero]);
}

// --- Ahorro --------------------------------------------------------------------------------------
const num = (n, d = 0) => formatoNumero(n, idioma, d);
montarAhorro($("[data-ahorro]"), "crm", {
  unidades: { leadsMes: ["{v}", "a.leadsMes.largo"], minGestion: ["unidad.min", "unidad.minLargo"] },
  formula: (r, f) => {
    const v = r.valores;
    return t("a.formula", {
      leadsMes: num(v.leadsMes), minGestion: num(v.minGestion), parteAutomatica: num(v.parteAutomatica), horas: f.horas,
      costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), tiempo: formatoEuros(r.partes.tiempoMes, idioma),
      tasaRecuperados: num(v.tasaRecuperados), tasaCierre: num(v.tasaCierre), clientes: num(r.partes.clientesMes, 1),
      beneficioCliente: formatoEuros(v.beneficioCliente, idioma), ventas: formatoEuros(r.partes.ventasMes, idioma), mes: f.mes, año: f.año,
    });
  },
  mensaje: (r, f) => t("a.mensaje", { leadsMes: num(r.valores.leadsMes), minGestion: num(r.valores.minGestion), mes: f.mes, año: f.año }),
});
