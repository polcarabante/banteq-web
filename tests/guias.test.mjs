import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

// Recorrido guía → formulario: el CTA que conserva la procedencia (assets-banteq/web/procedencia.js)
// solo actúa en enlaces con data-bq-contacto-guia cuyo hash sea exactamente #hablemos.
const raiz = new URL("../", import.meta.url);
const carpeta = new URL("assets-banteq/guias/", raiz);
const guias = readdirSync(carpeta).filter(n => n.endsWith(".html")).map(nombre => {
  const html = readFileSync(new URL(nombre, carpeta), "utf8");
  return { nombre, html, idioma: html.match(/<html lang="([^"]+)"/)[1] };
});
const ctas = html => [...html.matchAll(/<a data-bq-contacto-guia href="([^"]+)"/g)].map(m => m[1]);
const publicada = ruta => readFileSync(new URL(`public${ruta}/index.html`, raiz), "utf8");

test("cada guía lleva al formulario de una página existente y en su idioma", () => {
  for (const { nombre, html, idioma } of guias) {
    const enlaces = ctas(html);
    assert.ok(enlaces.length > 0, `${nombre}: sin CTA al formulario`);
    for (const href of enlaces) {
      const url = new URL(href, "https://banteq.com");
      assert.equal(url.hash, "#hablemos", `${nombre}: ${href}`);
      assert.ok(existsSync(new URL(`public${url.pathname}/index.html`, raiz)), `${nombre}: no existe ${url.pathname}`);
      assert.equal(url.pathname.startsWith("/ca/"), idioma === "ca", `${nombre}: ${href} no es de su idioma`);
    }
  }
});

test("las guías de compra terminan con un CTA y dejan aparte los enlaces informativos", () => {
  for (const nombre of ["como-pedir-presupuesto-web-a-medida.html", "com-triar-empresa-automatitzacio-processos.html"]) {
    const { html } = guias.find(g => g.nombre === nombre);
    const ultima = html.slice(html.lastIndexOf("<section"), html.indexOf("</article>"));
    assert.equal(ctas(ultima).length, 1, `${nombre}: la última sección no tiene un CTA`);
    // Los enlaces de información van sin data-bq-contacto-guia ni #hablemos.
    const informativos = [...ultima.matchAll(/<a href="([^"]+)"/g)].map(m => m[1]);
    assert.ok(informativos.length > 0, `${nombre}: sin enlaces informativos aparte`);
    assert.ok(informativos.every(href => !href.includes("#hablemos")), nombre);
  }
});

test("las páginas de servicio enlazan su guía de compra", () => {
  for (const [ruta, guia] of [
    ["/ca/automatitzacio-processos", "/guias/com-triar-empresa-automatitzacio-processos"],
    ["/desarrollo-web", "/guias/como-pedir-presupuesto-web-a-medida"],
  ]) {
    const html = publicada(ruta);
    // En el HTML inicial (instantánea) y en el módulo de Framer que pinta la página.
    assert.ok(html.includes(`href="${guia}"`), `${ruta}: el HTML inicial no enlaza ${guia}`);
    const sitios = new URL("public/framerusercontent.com/sites/", raiz);
    const modulo = `bq-servicio-${ruta.slice(1).replace("/", "-")}.mjs`;
    const modulos = readdirSync(sitios).map(s => new URL(`${s}/${modulo}`, sitios)).filter(existsSync);
    assert.equal(modulos.length, 1, `${ruta}: no se encuentra ${modulo}`);
    assert.ok(readFileSync(modulos[0], "utf8").includes(`href:\`${guia}\``), `${ruta}: el módulo no enlaza ${guia}`);
  }
});
