import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const codigo = readFileSync(new URL("../assets-banteq/web/procedencia.js", import.meta.url), "utf8");
const guia = "https://banteq.com/guias/aplicaciones-para-entrenadores-online";
const formulario = "https://banteq.com/desarrollo-web#hablemos";

function cargar(url, referrer = "") {
  const location = new URL(url);
  const window = {};
  let click;
  let navegacion;
  location.assign = href => { navegacion = href; };
  const document = { referrer, addEventListener: (nombre, fn) => { if (nombre === "click") click = fn; } };
  const history = { replaceState: (_, __, href) => { location.href = new URL(href, location).href; } };
  runInNewContext(codigo, { URL, URLSearchParams, window, document, location, history });
  return {
    entrada: { ...window.BANTEQ_ENTRADA }, location,
    abrirContacto() {
      click({ button: 0, preventDefault() {}, target: { closest: () => ({ href: formulario }) } });
      return navegacion;
    },
  };
}

test("mantiene el canal y la guía de entrada al pasar al formulario", () => {
  for (const [url, referrer, esperado] of [
    [guia, "https://www.google.es/", "google"],
    ["https://banteq.com/guias", "https://www.google.es/", "google"],
    ["https://banteq.com/guias/", "https://chatgpt.com/", "ai"],
    [guia + "?utm_source=chatgpt.com", "", "ai"],
    [guia + "?utm_source=chatgpt.com&utm_medium=email", "", "email"],
    [guia + "?gclid=demo", "https://www.google.com/", "paid"],
    [guia, "", "unknown"],
  ]) {
    const origen = cargar(url, referrer);
    const destino = cargar(origen.abrirContacto(), url);
    assert.deepEqual(destino.entrada, { sourceSignal: esperado, entryPath: new URL(url).pathname });
    assert.equal(destino.location.href, formulario);
  }
});

test("un enlace copiado fuera de la guía no hereda el canal del visitante anterior", () => {
  const copiado = formulario + "~bq-google";
  for (const referrer of ["", "https://example.com/guias/ejemplo", "https://banteq.com/privacidad"]) {
    const destino = cargar(copiado, referrer);
    assert.notEqual(destino.entrada.sourceSignal, "google");
    assert.equal(destino.entrada.entryPath, "/desarrollo-web");
    assert.equal(destino.location.href, formulario);
  }
});

test("la solicitud directa conserva la página y clasifica la señal disponible", () => {
  for (const [referrer, esperado] of [
    ["https://chatgpt.com/", "ai"], ["https://www.google.com/", "google"],
    ["https://www.google.com.example.org/", "referral"], ["", "unknown"],
  ]) {
    const visita = cargar("https://banteq.com/ca/automatitzacio-processos", referrer);
    assert.deepEqual(visita.entrada, { sourceSignal: esperado, entryPath: "/ca/automatitzacio-processos" });
  }
});
