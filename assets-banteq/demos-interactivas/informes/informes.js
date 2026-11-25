// Demostración interactiva «Informes y datos»: un Excel o CSV de ventas (del visitante o de
// ejemplo) se lee, se limpia, se calculan los indicadores de la última semana frente a la anterior
// y queda listo el panel de dirección con su correo. Si las columnas no se reconocen, el visitante
// las elige. Todo en el navegador (lib/informes-datos.mjs): el archivo no sale de su equipo.
import { montarAhorro } from "../comun/ahorro.js";
import { cargarSheetjs } from "../comun/carga.js";
import { anadir, montarERP } from "../comun/erp.js";
import { crearPasos } from "../comun/pasos.js";
import { prepararSubida } from "../comun/subida.js";
import { escapar, esperar, formatoDia, idioma, mostrar, OK_SVG, t } from "../comun/textos.js";
import { leerCsv } from "../lib/crm-leads.mjs";
import { formatoEuros, formatoNumero } from "../lib/demos-ahorro.mjs";
import { CAMPOS, calcularInforme, detectarColumnas, faltan, limpiar } from "../lib/informes-datos.mjs";

const $ = (s, raiz = document) => raiz.querySelector(s);
montarERP($("[data-erp]"));
const proceso = $(".proceso");
const cuerpo = $(".proceso-cuerpo");
const vacio = $("[data-vacio]");
const avisoProceso = $("[data-aviso]");
const pasos = crearPasos($(".pasos"), $("#pasos-anuncio"));
const resultado = $(".resultado");
const panel = $("[data-panel]");
const formMapa = $("[data-mapa]");

const MAXIMO = 5000;
class Fallo extends Error {}
let ronda = 0;
let pendiente = null; // { archivo, cabecera, filas, r } mientras se eligen columnas

const num = (n, d = 0) => formatoNumero(n, idioma, d);
const euros = (n, d = 0) => formatoEuros(n, idioma, d);
const pct = (v) => `${num(Math.abs(v), Math.abs(v) < 10 ? 1 : 0)}${idioma === "en" ? "%" : " %"}`;
const flecha = (v) => (v >= 0 ? "▲" : "▼");

const subida = prepararSubida($("[data-subida]"), {
  tipos: {
    csv: { ext: [".csv"], mime: ["text/csv"] },
    xlsx: { ext: [".xlsx"], mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  },
  formatos: t("subida.formatos"),
  alElegir: (archivo, tipo) => procesar(archivo, tipo),
});

async function filasDe(archivo, tipo) {
  if (tipo === "csv") return leerCsv(await archivo.text(), { conVacias: true });
  let XLSX;
  try {
    XLSX = await cargarSheetjs();
  } catch {
    throw new Fallo(t("error.red"));
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Fallo(t("error.lista")); // un .xlsx es un ZIP
  try {
    const libro = XLSX.read(bytes, { type: "array", cellDates: true });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: "", blankrows: true });
  } catch {
    throw new Fallo(t("error.lista"));
  }
}

function reiniciar() {
  pasos.reiniciar();
  avisoProceso.hidden = true;
  vacio.hidden = true;
  cuerpo.hidden = false;
  resultado.hidden = true;
  panel.replaceChildren();
  formMapa.hidden = true;
  pendiente = null;
}

async function procesar(archivo, tipo) {
  const r = ++ronda;
  reiniciar();
  mostrar(proceso);
  pasos.activo(0, t("det.leyendo", { archivo: archivo.name }));
  let filas;
  try {
    filas = await filasDe(archivo, tipo);
  } catch (e) {
    if (r !== ronda) return;
    pasos.error(0, t("det.error"));
    subida.mostrarError(e instanceof Fallo ? e.message : t("error.lista"));
    return;
  }
  if (r !== ronda) return;
  const cabecera = (filas[0] || []).map((c) => String(c ?? "").trim());
  const datos = filas.slice(1, MAXIMO + 1);
  if (!datos.some((f) => f.some((c) => String(c ?? "").trim()))) {
    pasos.error(0, t("det.error"));
    subida.mostrarError(t("error.sinFilas"));
    return;
  }
  await esperar(500);
  pasos.hecho(0, t("det.filas", { n: num(datos.length) }));
  if (filas.length - 1 > MAXIMO) {
    avisoProceso.textContent = t("aviso.maximo", { n: num(MAXIMO), total: num(filas.length - 1) });
    avisoProceso.hidden = false;
  }
  const mapa = detectarColumnas(cabecera);
  if (faltan(mapa).length) {
    pendiente = { archivo, cabecera, datos, r };
    pedirColumnas(archivo, cabecera, datos, mapa);
    return;
  }
  continuar(archivo, datos, mapa, r);
}

// --- Elegir columnas ---------------------------------------------------------------------------------

function pedirColumnas(archivo, cabecera, datos, mapa) {
  pasos.activo(1, t("det.mapa"));
  $("[data-mapa-texto]").textContent = t("mapa.texto", { archivo: archivo.name });
  const opciones = (campo) =>
    `<option value="">${escapar(t("mapa.ninguna"))}</option>` +
    cabecera.map((c, i) => `<option value="${i}"${mapa[campo] === i ? " selected" : ""}>${escapar(c || `#${i + 1}`)}</option>`).join("");
  $("[data-mapa-filas]").innerHTML = CAMPOS.map(
    (campo) =>
      `<div class="mapa-fila"><label for="m-${campo}">${escapar(t(`mapa.campo.${campo}`))}</label>` +
      `<select id="m-${campo}" name="${campo}" aria-describedby="m-${campo}-ej">${opciones(campo)}</select>` +
      `<small id="m-${campo}-ej" class="mapa-ej"></small></div>`,
  ).join("");
  const ejemplo = (sel) => {
    const i = sel.value === "" ? null : Number(sel.value);
    const valores = i === null ? [] : datos.map((f) => f[i]).filter((v) => String(v ?? "").trim()).slice(0, 3)
      .map((v) => (v instanceof Date ? formatoDia(new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())), { day: "2-digit", month: "2-digit", year: "numeric" }) : String(v)));
    $(`#${sel.id}-ej`).textContent = valores.length ? t("mapa.ejemplo", { valores: valores.join(" · ") }) : "";
  };
  formMapa.querySelectorAll("select").forEach((s) => {
    ejemplo(s);
    s.addEventListener("change", () => ejemplo(s));
  });
  $(".form-error", formMapa).hidden = true;
  formMapa.hidden = false;
  mostrar(formMapa, "center");
  $("#t-mapa").focus({ preventScroll: true });
}

formMapa.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!pendiente) return;
  const mapa = {};
  for (const s of formMapa.querySelectorAll("select")) if (s.value !== "") mapa[s.name] = Number(s.value);
  const valores = Object.values(mapa);
  const error = faltan(mapa).length ? "mapa.falta" : new Set(valores).size !== valores.length ? "mapa.repetida" : null;
  const caja = $(".form-error", formMapa);
  if (error) {
    caja.textContent = t(error);
    caja.hidden = false;
    return;
  }
  const { archivo, datos, r } = pendiente;
  pendiente = null;
  formMapa.hidden = true;
  mostrar(proceso);
  continuar(archivo, datos, mapa, r);
});

// --- Limpieza, cálculo e informe -------------------------------------------------------------------

async function continuar(archivo, datos, mapa, r) {
  pasos.activo(1, "");
  await esperar(650);
  if (r !== ronda) return;
  const { registros, stats } = limpiar(datos, mapa);
  const d = stats.descartadas;
  const nada = !stats.vacias && !stats.fechas && !stats.numeros && !d.length;
  pasos[d.length ? "aviso" : "hecho"](1, nada ? t("det.limpio") : t("det.limpieza", { vacias: stats.vacias, fechas: num(stats.fechas), numeros: num(stats.numeros), descartadas: d.length }));
  if (d.length) {
    const lista = d.slice(0, 4).map((x) => t("descartada", { fila: x.fila, motivo: t(`descartada.${x.motivo}`) })).join(" · ");
    avisoProceso.textContent = d.length > 4 ? `${lista} ${t("descartadas.mas", { n: d.length - 4 })}` : lista;
    avisoProceso.hidden = false;
  }
  if (!registros.length) {
    pasos.error(2, t("det.error"));
    subida.mostrarError(t("error.sinValidas"));
    return;
  }
  await esperar(300);
  pasos.activo(2, "");
  await esperar(700);
  if (r !== ronda) return;
  const inf = calcularInforme(registros);
  pasos.hecho(2, inf.anterior ? t("det.calculo", { n: inf.semana.numero, m: inf.anterior.numero }) : t("det.calculoSolo", { n: inf.semana.numero }));
  await esperar(300);
  pasos.activo(3, "");
  await esperar(600);
  if (r !== ronda) return;
  const reg = anadir("informes", { nombre: archivo.name, periodo: t("grafico.s", { n: inf.semana.numero }), estado: "generado" });
  pasos.hecho(3, t("det.informe", { id: reg.id }));
  pintarPanel(inf);
  resultado.hidden = false;
  mostrar(resultado, "start");
  $("#t-paso3").focus({ preventScroll: true });
}

function variacionHtml(v, m) {
  if (v === null || v === undefined) return `<p class="kpi-var">${escapar(t("kpi.sinAnterior"))}</p>`;
  return `<p class="kpi-var ${v >= 0 ? "sube" : "baja"}">${escapar(t("kpi.vs", { flecha: flecha(v), pct: pct(v), m }))}</p>`;
}

// Barras verticales de las últimas semanas (la actual, destacada).
function graficoSemanas(inf) {
  const serie = inf.serie;
  const max = Math.max(...serie.map((s) => s.valor), 1);
  const ancho = 320;
  const alto = 150;
  const hueco = ancho / serie.length;
  const barras = serie.map((s, i) => {
    const h = Math.max(2, (s.valor / max) * (alto - 34));
    const x = i * hueco + hueco * 0.18;
    const ultima = i === serie.length - 1;
    return `<rect x="${x.toFixed(1)}" y="${(alto - 18 - h).toFixed(1)}" width="${(hueco * 0.64).toFixed(1)}" height="${h.toFixed(1)}" rx="4" class="${ultima ? "barra-actual" : "barra"}"></rect>` +
      `<text x="${(x + hueco * 0.32).toFixed(1)}" y="${alto - 4}" class="eje">${escapar(t("grafico.s", { n: s.numero }))}</text>` +
      (ultima ? `<text x="${(x + hueco * 0.32).toFixed(1)}" y="${(alto - 22 - h).toFixed(1)}" class="valor">${escapar(inf.metrica === "importe" ? euros(s.valor) : num(s.valor))}</text>` : "");
  }).join("");
  const titulo = t(inf.metrica === "importe" ? "grafico.semanas" : "grafico.semanasUd");
  const resumen = serie.map((s) => `${t("grafico.s", { n: s.numero })} ${inf.metrica === "importe" ? euros(s.valor) : num(s.valor)}`).join(", ");
  return `<figure class="grafico"><figcaption>${escapar(titulo)}</figcaption>` +
    `<svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${escapar(t("grafico.resumen", { titulo, datos: resumen }))}">${barras}</svg></figure>`;
}

// Barras horizontales de los productos más vendidos de la semana.
function graficoTop(inf) {
  const max = Math.max(...inf.top.map((p) => p[inf.metrica]), 1);
  const filas = inf.top.map((p) => {
    const v = p[inf.metrica];
    return `<li><span class="top-nombre">${escapar(p.producto)}</span><span class="top-barra"><i style="width:${((v / max) * 100).toFixed(1)}%"></i></span>` +
      `<span class="top-valor">${escapar(inf.metrica === "importe" ? euros(v) : num(v))}</span></li>`;
  }).join("");
  return `<figure class="grafico"><figcaption>${escapar(t("grafico.top"))}</figcaption><ol class="top">${filas}</ol></figure>`;
}

function correo(inf, desde, hasta) {
  const vs = (v) => (v === null || v === undefined || !inf.anterior ? "" : t("email.vs", { flecha: flecha(v), pct: pct(v), m: inf.anterior.numero }));
  const listaY = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")}${t("email.y")}${xs[xs.length - 1]}` : xs[0] || "");
  const lineas = [
    t("email.saludo"), "",
    t("email.intro", { n: inf.semana.numero, desde, hasta }),
    ...(inf.metrica === "importe" ? [t("email.ventas", { valor: euros(inf.importe.actual), vs: vs(inf.importe.variacion) })] : []),
    ...(inf.hayUnidades ? [t("email.unidades", { valor: num(inf.unidades.actual), vs: vs(inf.unidades.variacion) })] : []),
    t("email.top", { lista: listaY(inf.top.slice(0, 3).map((p) => `${p.producto} (${inf.metrica === "importe" ? euros(p.importe) : num(p.unidades)})`)) }),
    ...(inf.hayStock ? [inf.stockCritico.length
      ? t("email.stock", { lista: listaY(inf.stockCritico.map((s) => t("stock.fila", { producto: s.producto, stock: num(s.stock), minimo: num(s.minimo) }))) })
      : t("email.stockBien")] : []),
    "", t("email.adjunto"), "", t("email.firma"),
  ];
  return (
    `<div class="correo"><div class="chat-barra"><i></i><i></i><i></i><b>${escapar(t("correo.ventana"))}</b></div>` +
    `<div class="correo-cab"><small>${escapar(t("correo.para"))}</small><span>${escapar(t("correo.direccion"))}</span></div>` +
    `<div class="correo-cab"><small>${escapar(t("correo.asunto"))}</small><span>${escapar(t("email.asunto", { n: inf.semana.numero }))}</span></div>` +
    `<div class="correo-cuerpo">${escapar(lineas.join("\n"))}<span class="adjunto">📎 ${escapar(`informe-${t("grafico.s", { n: inf.semana.numero })}.pdf`)}</span></div>` +
    `<p class="correo-estado">${OK_SVG}${escapar(t("correo.estado"))}</p></div>`
  );
}

function pintarPanel(inf) {
  const lunes = inf.semana.lunes;
  const domingo = new Date(lunes.getTime() + 6 * 86400000);
  const desde = formatoDia(lunes, { day: "numeric", month: "short" });
  const hasta = formatoDia(domingo, { day: "numeric", month: "short" });
  const m = inf.anterior?.numero;
  const stock = !inf.hayStock ? `<p class="kpi-valor kpi-gris">—</p><p class="kpi-var">${escapar(t("kpi.stockNada"))}</p>`
    : inf.stockCritico.length ? `<p class="kpi-valor kpi-alerta">${escapar(t("kpi.stockValor", { n: inf.stockCritico.length }))}</p><p class="kpi-var">${escapar(inf.stockCritico.map((s) => s.producto).join(" · "))}</p>`
    : `<p class="kpi-valor">0</p><p class="kpi-var sube">${escapar(t("kpi.stockBien"))}</p>`;
  const kpis = [
    ...(inf.metrica === "importe" ? [`<li class="kpi"><h3>${escapar(t("kpi.ventas"))}</h3><p class="kpi-valor">${escapar(euros(inf.importe.actual))}</p>${variacionHtml(inf.importe.variacion, m)}</li>`] : []),
    ...(inf.hayUnidades ? [`<li class="kpi"><h3>${escapar(t("kpi.unidades"))}</h3><p class="kpi-valor">${escapar(num(inf.unidades.actual))}</p>${variacionHtml(inf.unidades.variacion, m)}</li>`] : []),
    ...(inf.metrica === "importe" ? [`<li class="kpi"><h3>${escapar(t("kpi.ticket"))}</h3><p class="kpi-valor">${escapar(euros(inf.ticketMedio))}</p><p class="kpi-var">${escapar(inf.lineas === 1 ? t("kpi.linea") : t("kpi.lineas", { n: num(inf.lineas) }))}</p></li>`] : []),
    `<li class="kpi${inf.stockCritico.length ? " kpi-aviso" : ""}"><h3>${escapar(t("kpi.stock"))}</h3>${stock}</li>`,
  ].join("");
  const listaStock = inf.stockCritico.length
    ? `<div class="stock-critico"><h3>${escapar(t("stock.titulo"))}</h3><ul>${inf.stockCritico.map((s) => `<li>${escapar(t("stock.fila", { producto: s.producto, stock: num(s.stock), minimo: num(s.minimo) }))}<span class="stock-barra"><i style="width:${Math.min(100, (s.stock / s.minimo) * 100).toFixed(0)}%"></i></span></li>`).join("")}</ul></div>`
    : "";
  panel.innerHTML =
    `<p class="panel-periodo">${escapar(t("panel.titulo", { n: inf.semana.numero, desde, hasta }))}</p>` +
    `<ul class="kpis">${kpis}</ul><div class="graficos">${graficoSemanas(inf)}${graficoTop(inf)}</div>${listaStock}${correo(inf, desde, hasta)}`;
}

document.querySelectorAll("[data-ejemplo]").forEach((b) =>
  b.addEventListener("click", async () => {
    const url = b.dataset.ejemplo;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(String(resp.status));
      const xlsx = url.endsWith(".xlsx");
      subida.comprobar(new File([await resp.blob()], url.split("/").pop(), { type: xlsx ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv" }));
    } catch {
      subida.mostrarError(t("error.ejemplo"));
    }
  }),
);

// --- Ahorro --------------------------------------------------------------------------------------
montarAhorro($("[data-ahorro]"), "informes", {
  unidades: { horasSemana: ["unidad.h", "a.horasSemana.largo"], costeHora: ["unidad.eurHora", "unidad.eurHoraLargo"] },
  formula: (r, f) => {
    const v = r.valores;
    return t("a.formula", {
      horasSemana: t("unidad.h", { v: num(v.horasSemana, v.horasSemana % 1 ? 1 : 0) }), parteAutomatica: num(v.parteAutomatica),
      horas: f.horas, costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), mes: f.mes, año: f.año,
    });
  },
  mensaje: (r, f) => t("a.mensaje", {
    horasSemana: t("unidad.h", { v: num(r.valores.horasSemana, r.valores.horasSemana % 1 ? 1 : 0) }),
    costeHora: t("unidad.eurHora", { v: num(r.valores.costeHora) }), mes: f.mes, año: f.año,
  }),
});
