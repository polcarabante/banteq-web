// Librerías pesadas, solo cuando hacen falta (nunca al abrir la página). Están copiadas en la web
// (/demos/vendor/, assets-banteq/vendor/): no se llama a ningún CDN ni se envía nada fuera.
//   pdf.js 6.5.438        leer y previsualizar PDF        ~0,5 MB comprimido
//   tesseract.js 7.0.0    OCR de imágenes y escaneos      ~3–5 MB (núcleo + modelo; solo con imágenes)
//   mammoth 1.13.0        leer documentos de Word (DOCX)  ~0,1 MB comprimido
//   SheetJS 0.20.3 (mini) leer Excel (.xlsx)              ~0,09 MB comprimido (de cdn.sheetjs.com:
//                         la versión de npm, 0.18.5, tiene fallos de seguridad conocidos)

const PDFJS = "/demos/vendor/pdfjs-6.5.438/";
const TESS = "/demos/vendor/tesseract-7.0.0/";
const MAMMOTH = "/demos/vendor/mammoth-1.13.0/mammoth.browser.min.js";
const SHEETJS = "/demos/vendor/sheetjs-0.20.3/xlsx.mini.min.js";

let pdfjs = null;
export function cargarPdfjs() {
  pdfjs ??= import(`${PDFJS}pdf.min.mjs`)
    .then((m) => {
      m.GlobalWorkerOptions.workerSrc = `${PDFJS}pdf.worker.min.mjs`;
      return m;
    })
    .catch((e) => {
      pdfjs = null;
      throw e;
    });
  return pdfjs;
}

function script(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = ok;
    s.onerror = () => {
      s.remove();
      ko(new Error(`no se pudo cargar ${src}`));
    };
    document.head.append(s);
  });
}

// Un solo trabajador de OCR (castellano) para toda la visita. alProgreso recibe 0–100.
let trabajador = null;
let progreso = () => {};
export async function reconocerTexto(imagen, alProgreso) {
  progreso = alProgreso || (() => {});
  trabajador ??= (async () => {
    if (!window.Tesseract) await script(`${TESS}tesseract.min.js`);
    return window.Tesseract.createWorker("spa", 1, {
      workerPath: `${TESS}worker.min.js`,
      corePath: `${TESS}core`,
      langPath: `${TESS}lang`,
      workerBlobURL: false,
      // El modelo de castellano se publica sin comprimir (3,4 MB): así no depende de que el
      // servidor entregue un .gz tal cual o lo descomprima por el camino.
      gzip: false,
      logger: (m) => {
        if (m && m.status === "recognizing text") progreso(Math.round((m.progress || 0) * 100));
      },
    });
  })().catch((e) => {
    trabajador = null;
    throw e;
  });
  const w = await trabajador;
  const { data } = await w.recognize(imagen);
  return data.text || "";
}

let mammoth = null;
export function cargarMammoth() {
  mammoth ??= (window.mammoth ? Promise.resolve() : script(MAMMOTH))
    .then(() => window.mammoth)
    .catch((e) => {
      mammoth = null;
      throw e;
    });
  return mammoth;
}

let sheetjs = null;
export function cargarSheetjs() {
  sheetjs ??= (window.XLSX ? Promise.resolve() : script(SHEETJS))
    .then(() => window.XLSX)
    .catch((e) => {
      sheetjs = null;
      throw e;
    });
  return sheetjs;
}
