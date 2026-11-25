// Asistente de la demostración «Asistentes de IA» (/automatizaciones/asistente): responde con el
// documento que sube el visitante, citando la sección y la página, y dice que no lo sabe cuando la
// respuesta no está. Todo en el navegador; este módulo no usa nada del navegador y se prueba con
// node (tests/asistente-busqueda.test.mjs).
//
// Cómo funciona: el texto se divide en secciones (por sus títulos) y frases; cada pregunta se
// compara con ellas por palabras clave (BM25; «cambia» y «cambio» o «presión» y «presiones»
// cuentan como la misma palabra, también en catalán e inglés). La respuesta son las
// frases del documento, tal cual: no se redacta nada ni se inventa nada.

// Palabras vacías (sin tildes) en castellano, catalán e inglés: no cuentan para buscar.
const VACIAS = new Set(`
a al algo algun alguna algunas alguno algunos ante antes aqui asi como con contra cual cuales cuando cuanto cuanta cuantos cuantas
de del desde donde dos el ella ellas ellos en entre era es esa esas ese eso esos esta estas este esto estos estan esta fue ha han
hay haya hace hacer hago hacemos hacen la las le les lo los mas me mi mis muy ni no nos o os otra otro otros para pero poco por
porque puede pueden puedo pues que quien quienes se segun ser si sin sobre son su sus tambien te tiene tienen tengo tener todo
todos tu tus un una unas uno unos usted y ya yo cada debo debe deben debemos hay se sea seria tan solo sino mucho mucha
amb aquest aquesta aquests aquestes com els en es les per perque quan quant quanta quants quantes quina quin quines quins i
dels cal fer faig fan hi seva seu seus seves teu teva te tenen pot puc puguem cap res sobre son molt mes dins
the an and are as at be by can could do does did for from how if in into is it its of on or that the this these those to
what when where which who whom why with you your yours my me we our us should would need needs much many often every each
there their them they was were will about than then so not no yes i im ive
lleva llevar llevo llevan usar usa uso usan utiliza utilizar necesito necesita necesitan necesitar sirve sirven pasa hago
poner pone dice decir saber se quiero quieres hay porto portar cal calen necessito serveix use uses used using need wear
take put get does say know want
`.split(/\s+/).filter(Boolean));

export function normalizar(texto) {
  return String(texto ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

// Palabra útil normalizada: sin tildes, en minúsculas y sin plural.
export function raiz(palabra) {
  return palabra.length > 4 && /[^s]s$/.test(palabra) ? palabra.slice(0, -1) : palabra;
}

// Palabras útiles de un texto (sin palabras vacías); los números se conservan («180», «2000»).
export function raices(texto) {
  return (normalizar(texto).replace(/(\d)[.,](\d{3})\b/g, "$1$2").match(/[a-z0-9·]+/g) || [])
    .map((t) => t.replace(/·/g, ""))
    .filter((t) => t && !VACIAS.has(t) && (t.length > 1 || /\d/.test(t)))
    .map(raiz);
}

// Dos formas de una misma palabra comparten el principio: «cambia», «cambio» y «cambiando»;
// «presión» y «presiones»; «mantenimiento» y «mantener». Se exige un prefijo común de al menos
// el 75 % de la más corta (y 4 letras), para que «presión» no case con «presidente».
export function coinciden(a, b) {
  if (a === b) return true;
  const corta = Math.min(a.length, b.length);
  if (corta < 4 || /\d/.test(a) || /\d/.test(b)) return false;
  let i = 0;
  while (i < corta && a[i] === b[i]) i++;
  return i >= Math.max(4, Math.ceil(corta * 0.75));
}

// --- Del documento a bloques y secciones -----------------------------------------------------------

const RE_NUMERADO = /^\d{1,2}(?:\.\d{1,2}){0,3}\.?\s+\p{L}/u;

function esTitulo(texto, alto, mediana) {
  const t = texto.trim();
  if (t.length < 3 || t.length > 90 || /[.;,]$/.test(t)) return false;
  const palabras = t.split(/\s+/).length;
  if (palabras > 12) return false;
  if (RE_NUMERADO.test(t)) return true;
  if (alto && mediana && alto >= mediana * 1.15) return true;
  const letras = t.replace(/[^\p{L}]/gu, "");
  return letras.length >= 4 && palabras <= 8 && t === t.toUpperCase();
}

// Líneas ({ texto, alto?, pagina? }) de un PDF o un TXT → bloques de título y de párrafo. Las líneas
// que siguen una frase sin terminar se unen en el mismo párrafo.
export function bloquesDeLineas(lineas) {
  const ls = lineas.map((l) => (typeof l === "string" ? { texto: l } : l)).map((l) => ({ ...l, texto: String(l.texto || "").replace(/\s+/g, " ").trim() }));
  const altos = ls.filter((l) => l.texto && l.alto).map((l) => l.alto).sort((a, b) => a - b);
  const mediana = altos.length ? altos[Math.floor(altos.length / 2)] : 0;
  const bloques = [];
  let parrafo = null;
  for (const l of ls) {
    if (!l.texto) {
      parrafo = null;
      continue;
    }
    if (esTitulo(l.texto, l.alto, mediana)) {
      const previo = bloques[bloques.length - 1];
      // Un título largo partido en dos líneas: se une si ninguna de las dos va numerada.
      if (previo && previo.tipo === "titulo" && !parrafo && !RE_NUMERADO.test(previo.texto) && !RE_NUMERADO.test(l.texto) && previo.pagina === l.pagina) {
        previo.texto += " " + l.texto;
        continue;
      }
      bloques.push({ tipo: "titulo", texto: l.texto, pagina: l.pagina });
      parrafo = null;
      continue;
    }
    // Un elemento de lista («1. …», «- …», «• …») empieza siempre un párrafo nuevo.
    const lista = /^(\d{1,2}[.)]|[-–•·*])\s+/.test(l.texto);
    if (parrafo && !lista && !/[.!?:]$/.test(parrafo.texto)) parrafo.texto += " " + l.texto;
    else {
      parrafo = { tipo: "texto", texto: l.texto, pagina: l.pagina };
      bloques.push(parrafo);
    }
  }
  return bloques;
}

function frasesDe(texto) {
  if (/^(\d{1,2}[.)]|[-–•·*])\s+/.test(texto)) return [texto.trim()]; // un paso de una lista
  return texto.split(/(?<=[.!?])\s+(?=[\p{Lu}\d¿¡"«(])/u).map((f) => f.trim()).filter(Boolean);
}

// Bloques → secciones { titulo, pagina, frases: [{ texto, pagina }] }. Los títulos sin texto
// propio (un capítulo seguido de su primer apartado) no cuentan como sección. Un documento sin
// títulos se divide en fragmentos de unas ocho frases (titulo: null, n).
export function seccionar(bloques) {
  const secciones = [];
  let actual = { titulo: null, pagina: bloques[0]?.pagina, frases: [] };
  const cerrar = () => {
    if (actual.frases.length) secciones.push(actual);
  };
  for (const b of bloques) {
    if (b.tipo === "titulo") {
      cerrar();
      actual = { titulo: b.texto, pagina: b.pagina, frases: [] };
    } else {
      for (const f of frasesDe(b.texto)) actual.frases.push({ texto: f, pagina: b.pagina });
    }
  }
  cerrar();
  if (secciones.length === 1 && !secciones[0].titulo && secciones[0].frases.length > 10) {
    const todas = secciones[0].frases;
    secciones.length = 0;
    for (let i = 0; i < todas.length; i += 8) secciones.push({ titulo: null, n: i / 8 + 1, pagina: todas[i].pagina, frases: todas.slice(i, i + 8) });
  }
  return secciones;
}

// --- Índice y búsqueda --------------------------------------------------------------------------

export function indexar(secciones) {
  const frases = [];
  const enSeccion = [];
  const vocabulario = new Set();
  secciones.forEach((s, i) => {
    const deTitulo = s.titulo ? raices(s.titulo) : [];
    const vistas = new Set(deTitulo);
    s.frases.forEach((f, j) => {
      const r = raices(f.texto);
      r.forEach((x) => vistas.add(x));
      frases.push({ s: i, j, r, titulo: deTitulo });
    });
    vistas.forEach((x) => vocabulario.add(x));
    enSeccion.push(vistas);
  });
  const media = frases.reduce((a, f) => a + f.r.length, 0) / Math.max(1, frases.length);
  return { secciones, frases, enSeccion, vocabulario: [...vocabulario], n: secciones.length, media };
}

// Formas del documento que valen por una palabra de la pregunta, y en cuántas secciones salen.
function termino(ind, q) {
  const formas = new Set(ind.vocabulario.filter((v) => coinciden(q, v)));
  const df = ind.enSeccion.filter((s) => [...formas].some((f) => s.has(f))).length;
  return { q, formas, df, idf: Math.log(1 + (ind.n - df + 0.5) / (df + 0.5)) };
}

// Busca la sección que responde. Devuelve { encontrada, seccion, frases (índices dentro de la
// sección, en orden), destacada, terminos (palabras de la pregunta que aparecen), cobertura }.
// Se da por encontrada si la sección contiene al menos la mitad de lo que se pregunta (ponderado
// por lo raro que es cada palabra en el documento), o la mitad de las palabras y alguna de ellas
// es poco común (sale en una o dos secciones). Si no, el asistente dice que no lo encuentra.
export function buscar(ind, pregunta, { umbral = 0.5 } = {}) {
  const qs = [...new Set(raices(pregunta))];
  if (!qs.length || !ind.frases.length) return { encontrada: false, vacia: !qs.length, terminos: [], cobertura: 0 };
  const ts = qs.map((q) => termino(ind, q));
  // Preguntas de cantidad («¿cuántos…?», «¿cada cuánto…?», «how many…»): mejor las frases con cifras.
  const pideCifra = /\b(cu[aá]nt[oa]s?|quant[ae]?s?|how (many|much|often|long)|qu[eé] cantidad|cada cu[aá]nto)\b/i.test(pregunta);
  const k1 = 1.2;
  const b = 0.75;
  const porSeccion = new Map();
  for (const f of ind.frases) {
    let p = 0;
    let propia = 0; // sin contar el título: para elegir la frase que se resalta
    let distintas = 0;
    for (const t of ts) {
      if (!t.formas.size) continue;
      const enFrase = f.r.filter((x) => t.formas.has(x)).length;
      const tf = enFrase + (f.titulo.some((x) => t.formas.has(x)) ? 1.5 : 0);
      const norma = k1 * (1 - b + (b * f.r.length) / ind.media);
      if (tf) p += t.idf * ((tf * (k1 + 1)) / (tf + norma));
      if (enFrase) {
        propia += t.idf * ((enFrase * (k1 + 1)) / (enFrase + norma));
        distintas++;
      }
    }
    if (p > 0 && pideCifra && f.r.some((x) => /\d/.test(x))) p *= 1.35;
    if (p > 0) {
      if (!porSeccion.has(f.s)) porSeccion.set(f.s, []);
      porSeccion.get(f.s).push({ j: f.j, p, propia, distintas });
    }
  }
  if (!porSeccion.size) return { encontrada: false, terminos: [], cobertura: 0 };
  let mejor = null;
  for (const [s, fs] of porSeccion) {
    fs.sort((x, y) => y.p - x.p);
    const puntos = fs[0].p + 0.35 * (fs[1]?.p || 0);
    if (!mejor || puntos > mejor.puntos) mejor = { s, fs, puntos };
  }
  const vistas = ind.enSeccion[mejor.s];
  const dentro = ts.filter((t) => [...t.formas].some((f) => vistas.has(f)));
  const total = ts.reduce((a, t) => a + t.idf, 0);
  const cobertura = dentro.reduce((a, t) => a + t.idf, 0) / total;
  const rara = dentro.some((t) => t.df <= 2);
  const encontrada = cobertura >= umbral || (rara && dentro.length * 2 >= ts.length);
  const sec = ind.secciones[mejor.s];
  // Frases de la respuesta: la sección entera si es corta; si no, las tres mejores en su orden.
  const frases = sec.frases.length <= 5 ? sec.frases.map((_, j) => j) : mejor.fs.slice(0, 3).map((x) => x.j).sort((x, y) => x - y);
  // La frase que se resalta: la que contiene más palabras distintas de la pregunta.
  const destacada = [...mejor.fs].sort((x, y) => y.distintas - x.distintas || y.propia - x.propia || x.j - y.j)[0].j;
  return { encontrada, seccion: mejor.s, frases, destacada, terminos: dentro.map((t) => t.q), cobertura };
}

// Trozos de una frase para pintar con <mark> las palabras de la pregunta: [{ texto, marca }].
export function resaltar(texto, terminos) {
  const out = [];
  for (const parte of String(texto).split(/([\p{L}\p{N}·]+)/u)) {
    if (!parte) continue;
    const r = raices(parte)[0];
    const marca = Boolean(r && terminos.some((q) => coinciden(q, r)) && /[\p{L}\p{N}]/u.test(parte));
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.marca === marca) ultimo.texto += parte;
    else out.push({ texto: parte, marca });
  }
  return out;
}
