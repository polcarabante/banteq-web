// Ventas de ejemplo de la demostración «Informes y datos» (inventadas, siempre las mismas: generador
// con semilla fija). Nueve semanas, de la 39 a la 47 de 2026, de una empresa que vende suministros
// industriales; la última semana vende algo más que la anterior y dos productos acaban por debajo
// de su stock mínimo. tools/demos_ejemplos.mjs genera con esto tres archivos por idioma:
//   ventas-ejemplo.xlsx   Excel limpio (fechas y números de verdad)
//   ventas-ejemplo.csv    el mismo, «sucio»: filas vacías, fechas en dos formatos, «1.234,50 €», «12 uds», un «n/d»
//   exportacion-erp.csv   columnas con códigos de un ERP (FEC_DOC, COD_ART…): hay que elegirlas a mano

const PRODUCTOS = [
  // [castellano, catalán, inglés], precio, stock mínimo, stock inicial, unidades por línea [mín, máx], ¿se repone al final?
  [["Tornillo DIN 933 M8 (caja 100)", "Cargol DIN 933 M8 (capsa 100)", "DIN 933 M8 bolts (box of 100)"], 18.4, 40, 260, [2, 12], true],
  [["Rodamiento 6204-2RS", "Rodament 6204-2RS", "6204-2RS bearing"], 4.85, 60, 300, [10, 60], true],
  [["Correa trapezoidal SPZ 1250", "Corretja trapezoïdal SPZ 1250", "SPZ 1250 V-belt"], 18.5, 30, 60, [3, 9], false],
  [["Aceite hidráulico HLP 46 · 20 l", "Oli hidràulic HLP 46 · 20 l", "HLP 46 hydraulic oil · 20 l"], 46, 12, 50, [1, 5], true],
  [["Disco de corte 125 mm (caja 25)", "Disc de tall 125 mm (capsa 25)", "125 mm cutting discs (box of 25)"], 32.9, 30, 180, [2, 10], true],
  [["Guantes anticorte T9 (par)", "Guants anticorte T9 (parell)", "Cut-resistant gloves size 9 (pair)"], 6.2, 80, 200, [10, 40], false],
  [["Chapa de acero S235 2 mm", "Xapa d'acer S235 2 mm", "S235 steel sheet 2 mm"], 61.2, 15, 90, [2, 12], true],
  [["Brida de acero 40 mm", "Brida d'acer 40 mm", "40 mm steel clamp"], 3.75, 100, 600, [20, 120], true],
];

function generar() {
  let semilla = 20261125;
  const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
  const inicio = Date.UTC(2026, 8, 21); // lunes 21-09-2026, semana 39
  // Semanas 39 a 46: tres ventas por día laborable, de productos al azar.
  const lineas = [];
  for (let semana = 0; semana < 8; semana++) {
    for (let dia = 0; dia < 5; dia++) {
      for (let k = 0; k < 3; k++) {
        const i = entre(0, PRODUCTOS.length - 1);
        lineas.push({ fecha: new Date(inicio + (semana * 7 + dia) * 86400000), i, unidades: entre(...PRODUCTOS[i][4]) });
      }
    }
  }
  // Semana 47: como la 46, con algo más de unidades (sale un poco mejor que la anterior).
  for (const l of lineas.filter((x) => x.fecha.getTime() >= inicio + 7 * 7 * 86400000)) {
    lineas.push({ fecha: new Date(l.fecha.getTime() + 7 * 86400000), i: l.i, unidades: Math.round(l.unidades * 1.06) + (l.i % 3 === 0 ? 1 : 0) });
  }
  // Stock tras cada venta; si baja del mínimo se repone (dos productos dejan de reponerse en noviembre).
  const stock = PRODUCTOS.map((p) => p[3]);
  return lineas.map(({ fecha, i, unidades }) => {
    const [, precio, minimo, inicial, , repone] = PRODUCTOS[i];
    const semana = Math.floor((fecha.getTime() - inicio) / (7 * 86400000));
    if (stock[i] - unidades < minimo && (repone || semana < 6)) stock[i] = inicial;
    stock[i] = Math.max(0, stock[i] - unidades);
    return { fecha, i, unidades, importe: Math.round(unidades * precio * 100) / 100, stock: stock[i], minimo };
  });
}

const CABECERAS = {
  es: ["Fecha", "Producto", "Unidades", "Importe", "Stock actual", "Stock mínimo"],
  ca: ["Data", "Producte", "Unitats", "Import", "Stock actual", "Stock mínim"],
  en: ["Date", "Product", "Units", "Amount", "Stock", "Minimum stock"],
};
export const ARCHIVOS = { es: ["ventas-ejemplo", "exportacion-erp"], ca: ["vendes-exemple", "exportacio-erp"], en: ["sales-sample", "erp-export"] };
const IDX = { es: 0, ca: 1, en: 2 };

const dd = (f) => `${String(f.getUTCDate()).padStart(2, "0")}/${String(f.getUTCMonth() + 1).padStart(2, "0")}/${f.getUTCFullYear()}`;
const es = (n) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }).format(n);

// Filas de cada archivo, por idioma: { limpio (para el Excel), sucio (CSV), erp (CSV con códigos) }.
export function ventas(idioma) {
  const filas = generar();
  const nombre = (i) => PRODUCTOS[i][0][IDX[idioma]];
  const limpio = [CABECERAS[idioma], ...filas.map((r) => [new Date(r.fecha.getTime() + 12 * 3600000), nombre(r.i), r.unidades, r.importe, r.stock, r.minimo])];
  const sucio = [CABECERAS[idioma]];
  filas.forEach((r, k) => {
    if (k === 17 || k === 64 || k === 101) sucio.push(["", "", "", "", "", ""]);
    const fecha = k % 9 === 4 ? r.fecha.toISOString().slice(0, 10) : dd(r.fecha);
    const importe = k === 40 ? "n/d" : `${es(r.importe)} €`;
    const unidades = k % 7 === 3 ? `${r.unidades} uds` : String(r.unidades);
    sucio.push([fecha, nombre(r.i), unidades, importe, String(r.stock), String(r.minimo)]);
  });
  const erp = [["FEC_DOC", "COD_ART", "DESC_ART", "CANT_UD", "IMP_NETO", "EXIST", "PTO_PED"],
    ...filas.map((r) => [dd(r.fecha), `ART-${String(1040 + r.i * 7)}`, nombre(r.i), String(r.unidades), es(r.importe), String(r.stock), String(r.minimo)])];
  return { limpio, sucio, erp };
}
