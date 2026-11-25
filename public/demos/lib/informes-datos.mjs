// Datos de la demostración «Informes y datos» (/automatizaciones/informes): de un Excel o CSV de
// ventas (o producción, o stock) al informe semanal para dirección. Reconoce las columnas por su
// nombre (y si no, el visitante las elige), limpia el archivo (filas vacías, fechas y números en
// formato español) y calcula los indicadores de la última semana frente a la anterior.
// Sin nada del navegador: se prueba con node (tests/informes-datos.test.mjs).
import { parseImporte } from "./facturas-lectura.mjs?v=0eb1ca2fdd";

const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9%€]+/g, " ").trim();

export const CAMPOS = ["fecha", "producto", "unidades", "importe", "stock", "minimo"];

// Nombres habituales de cada columna (sin tildes, en minúsculas), en castellano, catalán e inglés.
const SINONIMOS = {
  fecha: ["fecha", "data", "date", "dia", "fecha venta", "fecha pedido", "fecha factura", "fecha de venta", "order date", "dia de venda"],
  producto: ["producto", "producte", "product", "articulo", "article", "item", "referencia", "ref", "descripcion", "descripcio", "description", "sku", "modelo"],
  unidades: ["unidades", "unitats", "units", "cantidad", "quantitat", "quantity", "qty", "uds", "cant", "piezas", "peces"],
  importe: ["importe", "import", "amount", "total", "ventas", "vendes", "sales", "facturacion", "facturacio", "revenue", "importe total", "total linea", "importe neto", "neto", "base imponible", "€", "eur"],
  stock: ["stock", "stock actual", "existencias", "existencies", "inventario", "inventari", "inventory", "on hand"],
  minimo: ["minimo", "minim", "stock minimo", "stock minim", "min", "minimum", "minimum stock", "reorder point", "punto de pedido", "punt de comanda"],
};

// Columnas reconocidas: { campo: índice }. Cada columna se usa una vez.
export function detectarColumnas(cabeceras) {
  const cab = cabeceras.map(normalizar);
  const mapa = {};
  const usadas = new Set();
  for (const campo of ["minimo", "stock", "fecha", "producto", "unidades", "importe"]) {
    const i = cab.findIndex((c, j) => !usadas.has(j) && SINONIMOS[campo].includes(c));
    if (i >= 0) {
      mapa[campo] = i;
      usadas.add(i);
    }
  }
  return mapa;
}

// Hace falta la fecha y, al menos, el importe o las unidades.
export function faltan(mapa) {
  const f = [];
  if (mapa.fecha === undefined) f.push("fecha");
  if (mapa.importe === undefined && mapa.unidades === undefined) f.push("importe");
  return f;
}

// --- Limpieza -----------------------------------------------------------------------------------------

const dia = (a, m, d) => {
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d && a > 1990 && a < 2100 ? f : null;
};

const MESES = { ene: 1, gen: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, mai: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, des: 12, dec: 12 };

// Fecha de una celda: objeto Date (Excel con cellDates), número de serie de Excel, o texto en
// formato español (dd/mm/aaaa, d-m-aa, «3 nov 2026») o ISO (aaaa-mm-dd). { fecha, convertida }.
export function leerFecha(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return { fecha: dia(v.getFullYear(), v.getMonth() + 1, v.getDate()), convertida: false };
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const f = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return { fecha: f, convertida: true };
  }
  const s = String(v ?? "").trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s);
  if (m) return { fecha: dia(+m[1], +m[2], +m[3]), convertida: false };
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})$/.exec(s);
  if (m) return { fecha: dia(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]), convertida: true };
  m = /^(\d{1,2})[\s\-/](?:de\s+)?([a-zç]{3})[a-zç.]*[\s\-/](?:de\s+)?(\d{4})$/i.exec(normalizar(s).replace(/ /g, " "));
  if (m && MESES[m[2]]) return { fecha: dia(+m[3], MESES[m[2]], +m[1]), convertida: true };
  return { fecha: null, convertida: false };
}

// Número de una celda: número, o texto «1.234,50 €», «1,234.50», «12 uds». { valor, convertido }.
export function leerNumero(v) {
  if (typeof v === "number" && Number.isFinite(v)) return { valor: v, convertido: false };
  const s = String(v ?? "").replace(/(€|eur|euros|uds?\.?|unidades|unitats|units|pcs|und\.?)\s*$/i, "").replace(/^(€|eur)\s*/i, "").trim();
  if (!s) return { valor: null, convertido: false };
  const n = parseImporte(s);
  if (n === null) return { valor: null, convertido: false };
  return { valor: n, convertido: /,|\.\d{3}|€/.test(String(v)) };
}

// Filas (sin la cabecera) → registros limpios y lo que se ha hecho para limpiarlos.
export function limpiar(filas, mapa) {
  const stats = { leidas: filas.length, vacias: 0, fechas: 0, numeros: 0, descartadas: [] };
  const registros = [];
  filas.forEach((fila, i) => {
    const n = i + 2; // número de fila en la hoja (la 1 es la cabecera)
    if (!fila.some((c) => String(c ?? "").trim())) {
      stats.vacias++;
      return;
    }
    const celda = (campo) => (mapa[campo] === undefined ? undefined : fila[mapa[campo]]);
    const { fecha, convertida } = leerFecha(celda("fecha"));
    if (!fecha) return stats.descartadas.push({ fila: n, motivo: "fecha" });
    if (convertida) stats.fechas++;
    const r = { fecha, producto: String(celda("producto") ?? "").trim() || "—" };
    for (const campo of ["unidades", "importe", "stock", "minimo"]) {
      if (mapa[campo] === undefined) continue;
      const { valor, convertido } = leerNumero(celda(campo));
      r[campo] = valor;
      if (convertido) stats.numeros++;
    }
    const principal = mapa.importe !== undefined ? "importe" : "unidades";
    if (r[principal] === null || r[principal] === undefined) return stats.descartadas.push({ fila: n, motivo: principal });
    registros.push(r);
  });
  registros.sort((a, b) => a.fecha - b.fecha);
  return { registros, stats };
}

// --- Indicadores --------------------------------------------------------------------------------------

// Semana ISO de una fecha (UTC): { año, semana, clave: "2026-W47", lunes: Date }.
export function semanaIso(f) {
  const d = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()));
  const diaSemana = d.getUTCDay() || 7;
  const lunes = new Date(d.getTime() - (diaSemana - 1) * 86400000);
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const año = d.getUTCFullYear();
  const semana = Math.ceil(((d - Date.UTC(año, 0, 1)) / 86400000 + 1) / 7);
  return { año, semana, clave: `${año}-W${String(semana).padStart(2, "0")}`, lunes };
}

const variacion = (a, b) => (b ? ((a - b) / b) * 100 : null);

// Informe de la última semana con datos frente a la anterior: totales y variación, ticket medio,
// los cinco productos que más venden, el stock bajo mínimo (última existencia de cada producto) y
// la evolución de las últimas ocho semanas.
export function calcularInforme(registros) {
  if (!registros.length) return null;
  const metrica = registros.some((r) => typeof r.importe === "number") ? "importe" : "unidades";
  const semanas = new Map();
  for (const r of registros) {
    const s = semanaIso(r.fecha);
    if (!semanas.has(s.clave)) semanas.set(s.clave, { ...s, importe: 0, unidades: 0, lineas: 0, productos: new Map() });
    const w = semanas.get(s.clave);
    w.importe += r.importe || 0;
    w.unidades += r.unidades || 0;
    w.lineas++;
    const p = w.productos.get(r.producto) || { producto: r.producto, importe: 0, unidades: 0 };
    p.importe += r.importe || 0;
    p.unidades += r.unidades || 0;
    w.productos.set(r.producto, p);
  }
  const orden = [...semanas.values()].sort((a, b) => a.lunes - b.lunes);
  const actual = orden[orden.length - 1];
  const anteriorClave = semanaIso(new Date(actual.lunes.getTime() - 7 * 86400000)).clave;
  const anterior = semanas.get(anteriorClave) || null;
  const ultimo = new Map();
  for (const r of registros) if (typeof r.stock === "number") ultimo.set(r.producto, r);
  const stockCritico = [...ultimo.values()]
    .filter((r) => typeof r.minimo === "number" && r.stock < r.minimo)
    .map((r) => ({ producto: r.producto, stock: r.stock, minimo: r.minimo }))
    .sort((a, b) => a.stock / (a.minimo || 1) - b.stock / (b.minimo || 1));
  const redondea = (n) => Math.round(n * 100) / 100;
  return {
    metrica,
    semana: { clave: actual.clave, numero: actual.semana, año: actual.año, lunes: actual.lunes },
    anterior: anterior ? { clave: anterior.clave, numero: anterior.semana } : null,
    importe: { actual: redondea(actual.importe), anterior: anterior ? redondea(anterior.importe) : null, variacion: anterior ? variacion(actual.importe, anterior.importe) : null },
    unidades: { actual: actual.unidades, anterior: anterior ? anterior.unidades : null, variacion: anterior ? variacion(actual.unidades, anterior.unidades) : null },
    lineas: actual.lineas,
    ticketMedio: actual.lineas ? redondea(actual.importe / actual.lineas) : 0,
    top: [...actual.productos.values()].sort((a, b) => b[metrica] - a[metrica]).slice(0, 5),
    stockCritico,
    hayStock: ultimo.size > 0,
    hayUnidades: registros.some((r) => typeof r.unidades === "number"),
    serie: orden.slice(-8).map((w) => ({ clave: w.clave, numero: w.semana, valor: redondea(w[metrica]) })),
  };
}
