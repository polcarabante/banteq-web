// Lectura de facturas de la demostración interactiva «Automatización de procesos»
// (/automatizaciones/facturas). Todo corre en el navegador del visitante: este módulo recibe el
// texto ya extraído (pdf.js, OCR o el XML de Facturae) y devuelve los campos y las comprobaciones.
// No usa nada del navegador, así que se prueba con node (tests/facturas-lectura.test.mjs).
//
// Es una lectura con reglas (etiquetas habituales, formatos españoles de fecha e importe y dígitos
// de control del NIF), no un modelo de IA: acierta con facturas normales y, cuando duda, deja el
// campo vacío para que el visitante lo corrija antes de registrar.

// --- NIF, NIE y CIF ------------------------------------------------------------------------------

const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";

export function normalizarNif(texto) {
  return String(texto || "").toUpperCase().replace(/[\s.\-]/g, "").replace(/^ES(?=[A-Z0-9]{9}$)/, "");
}

// Tipo de identificador si el dígito o la letra de control cuadran («nif», «nie», «cif»); si no, null.
export function validarNif(texto) {
  const n = normalizarNif(texto);
  if (/^\d{8}[A-Z]$/.test(n)) return LETRAS_DNI[Number(n.slice(0, 8)) % 23] === n[8] ? "nif" : null;
  if (/^[XYZ]\d{7}[A-Z]$/.test(n)) {
    const numero = Number("XYZ".indexOf(n[0]) + n.slice(1, 8));
    return LETRAS_DNI[numero % 23] === n[8] ? "nie" : null;
  }
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(n)) {
    const control = controlCif(n.slice(1, 8));
    const c = n[8];
    const letra = "JABCDEFGHI"[control];
    if ("NPQRSW".includes(n[0])) return c === letra ? "cif" : null; // control siempre letra
    if ("ABEH".includes(n[0])) return c === String(control) ? "cif" : null; // control siempre número
    return c === String(control) || c === letra ? "cif" : null;
  }
  return null;
}

// Dígito de control de un CIF a partir de sus siete cifras centrales.
export function controlCif(siete) {
  let suma = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(siete[i]);
    if (i % 2 === 0) {
      const doble = d * 2;
      suma += Math.floor(doble / 10) + (doble % 10);
    } else suma += d;
  }
  return (10 - (suma % 10)) % 10;
}

// Identificadores con forma de NIF/NIE/CIF (válidos o no) que aparecen en un texto.
const RE_NIF = /(?<![A-Z0-9])(?:ES[\s-]?)?([A-HJ-NP-SUVW][\s-]?\d{2}\.?\d{3}\.?\d{3}|[NPQRSW][\s-]?\d{7}[\s-]?[A-J]|[XYZ][\s-]?\d{7}[\s-]?[A-Z]|\d{2}\.?\d{3}\.?\d{3}[\s-]?[A-Z])(?![A-Z0-9])/g;

export function buscarNifs(texto) {
  return [...String(texto).matchAll(RE_NIF)].map((m) => ({ nif: normalizarNif(m[1]), valido: Boolean(validarNif(m[1])) }));
}

// --- Importes y fechas ---------------------------------------------------------------------------

// «1.284,60», «1284,60», «1 284,60», «1,284.60» o «1284.60» → 1284.6 (null si no es un importe).
export function parseImporte(texto) {
  const s = String(texto ?? "").replace(/[€\s ]|EUR/gi, "");
  if (!s) return null;
  let n;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s) || /^-?\d+(,\d+)?$/.test(s)) n = Number(s.replace(/\./g, "").replace(",", "."));
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) || /^-?\d+\.\d{1,2}$/.test(s)) n = Number(s.replace(/,/g, ""));
  else return null;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

// Importes con dos decimales de una línea (sin porcentajes, fechas ni cifras de un código).
const RE_IMPORTE = /(?<![\d.,/:\-A-Za-z])(-?\d{1,3}(?:[.  ]\d{3})+|-?\d+)([.,]\d{2})(?![\d.,/]\d|\d)(\s*%)?/g;

export function importesDe(linea) {
  const out = [];
  for (const m of String(linea).matchAll(RE_IMPORTE)) {
    if (m[3]) continue;
    const entero = m[1].replace(/[.  ]/g, "");
    const n = Number(`${entero}.${m[2].slice(1)}`);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  gener: 1, febrer: 2, març: 3, maig: 5, juny: 6, juliol: 7, agost: 8, setembre: 9, novembre: 11, desembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const iso = (a, m, d) => {
  const año = a < 100 ? 2000 + a : a;
  const f = new Date(Date.UTC(año, m - 1, d));
  if (f.getUTCFullYear() !== año || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d || año < 1990 || año > 2100) return null;
  return `${año}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

// Fechas de una línea, en formato ISO (aaaa-mm-dd).
export function fechasDe(linea) {
  const out = [];
  const s = String(linea);
  const re = /(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)|(?<!\d)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})(?!\d)|(?<!\d)(\d{1,2})\s+(?:de\s+|d')?([a-zç]+)\s+(?:de\s+|del\s+)?(\d{4})/gi;
  for (const m of s.matchAll(re)) {
    let f = null;
    if (m[1]) f = iso(Number(m[1]), Number(m[2]), Number(m[3]));
    else if (m[4]) f = iso(Number(m[6]), Number(m[5]), Number(m[4]));
    else if (m[7]) {
      const mes = MESES[m[8].toLowerCase()];
      if (mes) f = iso(Number(m[9]), mes, Number(m[7]));
    }
    if (f) out.push(f);
  }
  return out;
}

// --- Texto de pdf.js en líneas --------------------------------------------------------------------

// pdf.js devuelve trozos de texto con su posición (transform[4] = x, transform[5] = y). Se agrupan
// en líneas por su altura en la página, de arriba abajo y de izquierda a derecha.
export function lineasDeItems(items) {
  return lineasConAltura(items).map((l) => l.texto);
}

// Igual, pero cada línea con la altura de su letra (el asistente la usa para reconocer títulos).
export function lineasConAltura(items) {
  const trozos = items
    .filter((it) => it && typeof it.str === "string" && it.str.trim())
    .map((it) => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0, h: Math.abs(it.height || it.transform[3] || 10) }));
  trozos.sort((a, b) => b.y - a.y || a.x - b.x);
  const lineas = [];
  for (const t of trozos) {
    const l = lineas.find((x) => Math.abs(x.y - t.y) <= Math.max(2, Math.min(x.h, t.h) * 0.45));
    if (l) l.trozos.push(t);
    else lineas.push({ y: t.y, h: t.h, trozos: [t] });
  }
  lineas.sort((a, b) => b.y - a.y);
  // Columnas separadas (cabeceras a dos lados, tablas): un hueco grande se marca con un tabulador
  // para no mezclar, por ejemplo, el nombre del proveedor con la palabra FACTURA de la derecha.
  return lineas.map((l) => {
    const ts = l.trozos.sort((a, b) => a.x - b.x);
    let s = "";
    ts.forEach((t, i) => {
      const prev = ts[i - 1];
      const hueco = prev ? t.x - (prev.x + prev.w) : 0;
      s += (i === 0 ? "" : prev.w && hueco > Math.max(18, t.h * 2.2) ? "\t" : " ") + t.s.trim();
    });
    return { texto: s.replace(/[^\S\t]+/g, " ").replace(/ ?\t ?/g, "\t").trim(), alto: Math.max(...ts.map((x) => x.h)) };
  });
}

// --- Campos de la factura ---------------------------------------------------------------------------

const RE_CLIENTE = /\b(cliente|destinatari[oa]|facturar\s+a|datos\s+del\s+cliente|bill\s+to|customer|client)\b/i;
const RE_SOCIEDAD = /\b(S\.?\s?L\.?\s?U\.?|S\.?\s?L\.?|S\.?\s?A\.?|S\.?\s?C\.?\s?C\.?\s?L\.?|S\.?\s?Coop\.?|SLU|SLL|S\.?\s?L\.?\s?P\.?)(?=$|[\s,.;)])/;
const ETIQUETA_NOMBRE = /^(proveedor|emisor|razón\s+social|raó\s+social|empresa|de|from)\s*:\s*/i;
const RE_NO_NOMBRE = /^(factura|invoice|fecha|data|date|n[º°o]\.?|nif|cif|tel|telf|teléfono|email|correo|www\.|http|c\/|calle|avda|avenida|pol\.|polígono|página|pág)/i;

function nombreProveedor(lineas, iNif, iCliente) {
  const fueraCliente = (i) => iCliente < 0 || i < iCliente;
  // Sin la palabra FACTURA que a veces queda en la misma línea (cabeceras a dos columnas leídas con OCR).
  const candidato = (l) => l.replace(/\s+(factura|invoice)(\s+(simplificada|rectificativa))?\b.*$/i, "").replace(ETIQUETA_NOMBRE, "").replace(RE_NIF, "").replace(/\b(NIF|CIF|N\.I\.F\.|C\.I\.F\.)\s*:?/gi, "").replace(/[\s:·|,-]+$/g, "").trim();
  if (iNif >= 0) {
    for (let d = 0; d <= 3; d++) {
      for (const i of [iNif - d, iNif + d]) {
        if (i < 0 || i >= lineas.length || !fueraCliente(i)) continue;
        const trozo = lineas[i].split("\t").find((x) => RE_SOCIEDAD.test(x));
        if (trozo) {
          const n = candidato(trozo);
          if (n.length >= 3) return n.slice(0, 80);
        }
      }
    }
  }
  for (let i = 0; i < Math.min(lineas.length, 8); i++) {
    if (!fueraCliente(i)) break;
    const n = candidato(lineas[i].split("\t")[0]);
    if (n.length >= 3 && /[a-záéíóúñç]{3}/i.test(n) && !RE_NO_NOMBRE.test(n) && !/\d{3}/.test(n)) return n.slice(0, 80);
  }
  return "";
}

// «Nº» llega de muchas formas: N.º, Nº, N°, No, y con OCR también N” o N*.
const NUM = "(?<![a-záéíóúñç])n\\s*[º°o”\"'*]?\\.?\\s*º?";
const RE_NUMERO = new RegExp(`(?:${NUM}\\s*(?:de\\s+)?factura|factura\\s*(?:${NUM}|n[úu]m(?:ero)?\\.?|#)|n[úu]m(?:ero)?\\.?\\s*(?:de\\s+)?factura|invoice\\s*(?:no\\.?|number|#))\\s*[:#]?\\s*([A-Z0-9][A-Z0-9\\-/._]{0,24})`, "i");
const RE_NUMERO_SUELTO = /^(?:factura|invoice)\s*[:\s]\s*([A-Z]{0,5}[-/]?\d[A-Z0-9\-/._]{1,20})\b/i;

function numeroFactura(lineas) {
  for (const [i, l] of lineas.entries()) {
    const m = RE_NUMERO.exec(l) || RE_NUMERO_SUELTO.exec(l);
    let v = m && m[1];
    // Etiqueta sola en su línea y el número en la siguiente.
    if (!v && /^(n[º°o]\.?\s*(de\s+)?factura|n[úu]mero(\s+de\s+factura)?|invoice\s+no\.?)\s*:?$/i.test(l) && lineas[i + 1]) v = lineas[i + 1].split(/\s+/)[0];
    if (v && /\d/.test(v) && !fechasDe(v).length) return v.replace(/[.,;:]+$/, "").toUpperCase();
  }
  return "";
}

const RE_VENCIMIENTO = /(vencimiento|venciment|vto\.?|fecha\s+de\s+pago|data\s+de\s+pagament|due\s+date)/i;
const RE_FECHA = /(fecha|data|date|emitida|emisi[oó]n|expedici[oó]n)/i;

function fecha(lineas, re, excluir) {
  for (const [i, l] of lineas.entries()) {
    if (!re.test(l) || (excluir && excluir.test(l))) continue;
    const [despues] = fechasDe(l.slice(l.search(re)));
    if (despues) return despues;
    const [siguiente] = fechasDe(lineas[i + 1] || "");
    if (siguiente) return siguiente;
  }
  return "";
}

const TIPOS_IVA = [21, 10, 5, 4, 0];
const cuadra = (base, iva, total) => Math.abs(base + iva - total) <= 0.02;

// Base, IVA y total con las etiquetas habituales. Si falta alguno, se busca entre todos los importes
// del documento un trío base + IVA = total con un tipo de IVA español (21, 10, 5 o 4 %).
function importes(lineas) {
  const ultimo = (re, excluir) => {
    for (const [i, l] of lineas.entries()) {
      if (!re.test(l) || (excluir && excluir.test(l))) continue;
      const tras = importesDe(l.slice(l.search(re)));
      if (tras.length) return tras[tras.length - 1];
      const sig = importesDe(lineas[i + 1] || "");
      if (sig.length === 1) return sig[0];
    }
    return null;
  };
  const base = ultimo(/(base\s+imponible|subtotal|base\s+i\.?v\.?a|total\s+base|taxable\s+base|^base\b)/i);
  let iva = null;
  let tipoIva = null;
  for (const [i, l] of lineas.entries()) {
    if (!/\b(i\.?v\.?a\.?|vat|cuota)\b/i.test(l) || /\b(total\s+factura|incluido|incl\.|sin\s+iva|base\s+imponible)\b/i.test(l)) continue;
    const pos = l.search(/\b(i\.?v\.?a\.?|vat|cuota)\b/i);
    const tipo = /(\d{1,2}(?:[.,]\d{1,2})?)\s*%/.exec(l.slice(pos));
    let cifras = importesDe(l.slice(pos));
    if (!cifras.length) cifras = importesDe(lineas[i + 1] || "");
    if (!cifras.length) continue;
    iva = (iva || 0) + cifras[cifras.length - 1];
    if (tipo && tipoIva === null) tipoIva = Number(tipo[1].replace(",", "."));
  }
  const totales = [];
  for (const [i, l] of lineas.entries()) {
    if (!/\b(total|importe\s+total|a\s+pagar|amount\s+due)\b/i.test(l) || /(subtotal|total\s+base|base\s+imponible|total\s+i\.?v\.?a|total\s+impuestos|unidades|cantidad|total\s+l[ií]nea)/i.test(l)) continue;
    const tras = importesDe(l.slice(l.search(/\b(total|importe\s+total|a\s+pagar|amount\s+due)\b/i)));
    const cifras = tras.length ? tras : importesDe(lineas[i + 1] || "");
    if (cifras.length) totales.push(cifras[cifras.length - 1]);
  }
  let total = totales.length ? Math.max(...totales) : null;
  let b = base;
  if (b === null && total !== null && iva !== null) b = Math.round((total - iva) * 100) / 100;
  if (iva === null && total !== null && b !== null) iva = Math.round((total - b) * 100) / 100;

  if (b === null || iva === null || total === null) {
    const todos = [...new Set(lineas.flatMap((l) => importesDe(l)))].filter((n) => n > 0).sort((x, y) => y - x);
    for (const t of todos) {
      if (total !== null && t !== total) continue;
      let hallado = null;
      for (const tipo of TIPOS_IVA.filter((x) => x > 0)) {
        const bb = Math.round((t / (1 + tipo / 100)) * 100) / 100;
        const ii = Math.round((t - bb) * 100) / 100;
        const encaja = (x, y) => Math.abs(x - y) <= 0.02;
        if (todos.some((x) => encaja(x, bb)) && todos.some((x) => encaja(x, ii))) {
          hallado = { b: todos.find((x) => encaja(x, bb)), i: todos.find((x) => encaja(x, ii)), tipo };
          break;
        }
      }
      if (hallado) {
        b = hallado.b;
        iva = hallado.i;
        total = t;
        tipoIva = tipoIva ?? hallado.tipo;
        break;
      }
    }
  }
  if (tipoIva === null && b && iva !== null) {
    const calc = Math.round((iva / b) * 1000) / 10;
    tipoIva = TIPOS_IVA.find((x) => Math.abs(x - calc) <= 0.3) ?? calc;
  }
  return { base: b, iva, total, tipoIva };
}

// Campos de una factura a partir de sus líneas de texto. Los que no se encuentran quedan vacíos
// ("" o null) y la página los pide al visitante.
export function extraerCampos(lineasOTexto, { nifPropio } = {}) {
  const lineas = (Array.isArray(lineasOTexto) ? lineasOTexto : String(lineasOTexto).split(/\r?\n/))
    .map((l) => String(l).replace(/[^\S\t]+/g, " ").trim())
    .filter(Boolean);
  const iCliente = lineas.findIndex((l) => RE_CLIENTE.test(l));
  const propio = nifPropio ? normalizarNif(nifPropio) : null;
  // NIF del proveedor: el primero que no sea del bloque del cliente ni el de la propia empresa.
  let nif = "";
  let iNif = -1;
  for (const [i, l] of lineas.entries()) {
    for (const { nif: n } of buscarNifs(l)) {
      const enCliente = iCliente >= 0 && i >= iCliente && i <= iCliente + 5;
      if (n === propio || enCliente) continue;
      nif = n;
      iNif = i;
      break;
    }
    if (nif) break;
  }
  // Cabeceras con proveedor y cliente lado a lado: si todo cae «en el bloque del cliente», el primero
  // que no sea el propio.
  if (!nif) {
    const i = lineas.findIndex((l) => buscarNifs(l).some((x) => x.nif !== propio));
    if (i >= 0) {
      nif = buscarNifs(lineas[i]).find((x) => x.nif !== propio).nif;
      iNif = i;
    }
  }
  const { base, iva, total, tipoIva } = importes(lineas);
  const pedido = (lineas.join("\n").match(/\b(PC-\d{2,6})\b/) || lineas.join("\n").match(/(?:su\s+pedido|n[º°o]\.?\s*pedido|pedido|purchase\s+order|order)\s*[:nº°#]*\s*([A-Z]{1,4}-?\d{2,8})/i) || [])[1] || "";
  const campos = {
    proveedor: nombreProveedor(lineas, iNif, iCliente),
    nif,
    numero: numeroFactura(lineas),
    fecha: fecha(lineas, RE_FECHA, RE_VENCIMIENTO),
    vencimiento: fecha(lineas, RE_VENCIMIENTO),
    base,
    tipoIva,
    iva,
    total,
    pedido: pedido.toUpperCase(),
  };
  if (!campos.fecha) campos.fecha = lineas.filter((l) => !RE_VENCIMIENTO.test(l)).flatMap((l) => fechasDe(l))[0] || "";
  return campos;
}

export const CAMPOS = ["proveedor", "nif", "numero", "fecha", "base", "iva", "total", "vencimiento"];
export const OBLIGATORIOS = ["proveedor", "nif", "numero", "fecha", "total"];

export function camposEncontrados(c) {
  return CAMPOS.filter((k) => c[k] !== "" && c[k] !== null && c[k] !== undefined).length;
}

export function pareceFactura(c) {
  return Boolean(c.total !== null || c.nif || c.numero);
}

// --- Facturae (XML de la factura electrónica española) ---------------------------------------------

const desescapar = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();

function etiqueta(nombre, xml) {
  const m = new RegExp(`<(?:[\\w-]+:)?${nombre}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${nombre}>`).exec(xml || "");
  return m ? desescapar(m[1]) : "";
}

export function esFacturae(xml) {
  return /<(?:[\w-]+:)?Facturae\b/.test(String(xml));
}

// Campos de un Facturae 3.x: datos exactos, sin interpretar texto. null si no es un Facturae.
export function leerFacturae(xml) {
  if (!esFacturae(xml)) return null;
  const vendedor = etiqueta("SellerParty", xml);
  const factura = etiqueta("Invoice", xml);
  const nombre = etiqueta("CorporateName", vendedor) || [etiqueta("Name", vendedor), etiqueta("FirstSurname", vendedor), etiqueta("SecondSurname", vendedor)].filter(Boolean).join(" ");
  const serie = etiqueta("InvoiceSeriesCode", factura);
  const num = etiqueta("InvoiceNumber", factura);
  const impuestos = etiqueta("TaxesOutputs", factura);
  const tipo = etiqueta("TaxRate", impuestos);
  const n = (s) => (s === "" ? null : Math.round(Number(s) * 100) / 100);
  const fechaIso = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fechasDe(s)[0] || "");
  const ref = etiqueta("ReceiverTransactionReference", factura) || etiqueta("FileReference", factura) || etiqueta("ReceiverContractReference", factura);
  return {
    proveedor: nombre,
    nif: normalizarNif(etiqueta("TaxIdentificationNumber", vendedor)),
    numero: serie ? (/[-/]$/.test(serie) ? serie + num : `${serie}-${num}`) : num,
    fecha: fechaIso(etiqueta("IssueDate", factura)),
    vencimiento: fechaIso(etiqueta("InstallmentDueDate", factura)),
    base: n(etiqueta("TotalGrossAmountBeforeTaxes", factura)),
    tipoIva: tipo === "" ? null : Number(tipo),
    iva: n(etiqueta("TotalTaxOutputs", factura)),
    total: n(etiqueta("InvoiceTotal", factura) || etiqueta("TotalExecutableAmount", factura)),
    pedido: (/\bPC-\d{2,6}\b/.exec(ref) || [ref])[0].toUpperCase(),
  };
}

// --- Comprobaciones antes de registrar --------------------------------------------------------------

const normNumero = (s) => String(s || "").toUpperCase().replace(/[\s\-/._]/g, "");

// Comprobaciones de la factura contra el ERP de la demostración: campos obligatorios, que base + IVA
// sumen el total, NIF válido, que no esté ya registrada y que coincida con un pedido de compra.
// Cada una: { clave, estado: "ok" | "aviso" | "error", datos }. La factura se registra si todas
// están en «ok»; si no, queda «pendiente de revisar» con el primer motivo.
export function validarFactura(c, { pedidos = [], registradas = [] } = {}) {
  const res = [];
  const faltan = OBLIGATORIOS.filter((k) => c[k] === "" || c[k] === null || c[k] === undefined);
  res.push({ clave: "campos", estado: faltan.length ? "error" : "ok", datos: { faltan } });

  if (c.base !== null && c.iva !== null && c.total !== null && c.base !== undefined && c.iva !== undefined) {
    const suma = Math.round((c.base + c.iva) * 100) / 100;
    res.push({ clave: "cuadra", estado: cuadra(c.base, c.iva, c.total) ? "ok" : "error", datos: { base: c.base, iva: c.iva, suma, total: c.total } });
  } else {
    res.push({ clave: "cuadra", estado: "aviso", datos: { incompleto: true } });
  }

  const tipoNif = c.nif ? validarNif(c.nif) : null;
  res.push({ clave: "nif", estado: tipoNif ? "ok" : "error", datos: { nif: c.nif, tipo: tipoNif } });

  const nif = normalizarNif(c.nif);
  const repetida = registradas.find((r) => normalizarNif(r.nif) === nif && normNumero(r.numero) === normNumero(c.numero) && nif && c.numero);
  res.push({ clave: "duplicada", estado: repetida ? "error" : "ok", datos: { id: repetida?.id } });

  let pedido = c.pedido ? pedidos.find((p) => p.id === String(c.pedido).toUpperCase()) : null;
  if (!pedido && nif) pedido = pedidos.find((p) => normalizarNif(p.nif) === nif);
  if (!pedido) res.push({ clave: "pedido", estado: "aviso", datos: { sin: true, referencia: c.pedido || "" } });
  else if (c.total === null || Math.abs(pedido.total - c.total) > 0.01) res.push({ clave: "pedido", estado: "error", datos: { id: pedido.id, esperado: pedido.total, total: c.total } });
  else res.push({ clave: "pedido", estado: "ok", datos: { id: pedido.id } });

  const motivo = res.find((r) => r.estado !== "ok") || null;
  return { comprobaciones: res, registrable: !motivo, motivo };
}
