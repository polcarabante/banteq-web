import assert from "node:assert/strict";
import { test } from "node:test";
import { bloquesDeLineas, buscar, coinciden, indexar, raices, resaltar, seccionar } from "../lib/asistente-busqueda.mjs";
import { MANUAL } from "../tools/demos_manual_p12.mjs";

// Líneas como las daría pdf.js del manual de ejemplo: títulos más altos que el texto.
function lineas(m) {
  const out = [{ texto: m.titulo, alto: 20, pagina: 1 }, { texto: m.subtitulo, alto: 10, pagina: 1 }];
  for (const [capitulo, apartados] of m.capitulos) {
    out.push({ texto: capitulo, alto: 15, pagina: 1 });
    for (const [apartado, parrafos] of apartados) {
      out.push({ texto: apartado, alto: 12, pagina: 2 });
      for (const p of parrafos) out.push({ texto: p, alto: 10.5, pagina: 2 });
    }
  }
  return out;
}

test("palabras: normalización, plurales y formas de una misma palabra", () => {
  assert.deepEqual(raices("¿Cada cuánto se cambia el aceite?"), ["cambia", "aceite"]);
  assert.ok(coinciden("cambia", "cambio") && coinciden("presion", "presione") && coinciden("mantenimiento", "mantener"));
  assert.ok(!coinciden("presion", "presidente") && !coinciden("180", "1800"));
});

test("el manual de ejemplo: 23 apartados más la portada, con títulos", () => {
  const sec = seccionar(bloquesDeLineas(lineas(MANUAL.es)));
  assert.equal(sec.length, 24);
  assert.equal(sec[0].titulo, MANUAL.es.titulo);
  assert.equal(sec.find((s) => s.titulo === "5.4 Mantenimiento trimestral").frases.length, 4);
});

for (const [idioma, m] of Object.entries(MANUAL)) {
  test(`sugerencias en ${idioma}: dos respuestas con su apartado y una que no está`, () => {
    const ind = indexar(seccionar(bloquesDeLineas(lineas(m))));
    const [aceite, presion, precio] = m.sugerencias.map((q) => buscar(ind, q));
    assert.equal(aceite.encontrada, true);
    assert.match(ind.secciones[aceite.seccion].titulo, /^4\.3 /);
    assert.equal(presion.encontrada, true);
    assert.match(ind.secciones[presion.seccion].titulo, /^6\.1 /);
    assert.equal(presion.destacada, 0); // «Si la prensa pierde presión, …», no «No toques la válvula…»
    assert.equal(precio.encontrada, false);
  });
}

test("preguntas que no están en el documento", () => {
  const ind = indexar(seccionar(bloquesDeLineas(lineas(MANUAL.es))));
  for (const q of ["¿Quién es el presidente?", "horario de la cantina", "¿?", "y de qué"]) assert.equal(buscar(ind, q).encontrada, false, q);
  const r = buscar(ind, "¿Qué presión de trabajo tiene?");
  assert.equal(ind.secciones[r.seccion].titulo, "1.2 Características técnicas");
});

test("texto sin títulos: fragmentos, y resaltado de las palabras de la pregunta", () => {
  const texto = Array.from({ length: 20 }, (_, i) => `Frase número ${i + 1} del documento.`).join(" ");
  const sec = seccionar(bloquesDeLineas([texto]));
  assert.equal(sec.length, 3);
  assert.equal(sec[1].n, 2);
  assert.deepEqual(resaltar("Cambia el aceite.", ["cambio", "aceite"]).filter((x) => x.marca).map((x) => x.texto), ["Cambia", "aceite"]);
});

test("preguntas de cantidad: prefiere la frase con la cifra", () => {
  const ind = indexar(seccionar([
    { tipo: "titulo", texto: "Cómo pedir vacaciones" }, { tipo: "texto", texto: "Las vacaciones se piden con quince días de antelación." },
    { tipo: "titulo", texto: "Días disponibles" }, { tipo: "texto", texto: "Cada persona tiene 23 días laborables de vacaciones al año." },
    { tipo: "titulo", texto: "Teletrabajo" }, { tipo: "texto", texto: "Se puede teletrabajar dos días por semana." },
  ]));
  assert.equal(ind.secciones[buscar(ind, "¿Cuántos días de vacaciones tengo?").seccion].titulo, "Días disponibles");
});
