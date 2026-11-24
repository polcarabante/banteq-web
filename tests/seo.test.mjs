import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { test } from "node:test";

// SEO técnico sobre la web generada (public/): metadatos, JSON-LD, hreflang, sitemap, robots y llms-full.txt.
// El build (tools/seo_tecnico.py) ya lo comprueba al compilar; esto lo repite de forma independiente.
const raiz = new URL("../", import.meta.url);
const leer = ruta => readFileSync(new URL(`public/${ruta}`, raiz), "utf8");
const SITIO = "https://banteq.com";
const sitemap = leer("sitemap.xml");
const entradas = [...sitemap.matchAll(/<url>(.*?)<\/url>/gs)].map(m => m[1]);
const urls = entradas.map(e => e.match(/<loc>(.*?)<\/loc>/)[1]);
const archivo = url => `${url.slice(SITIO.length).replace(/^\/|\/$/g, "")}/index.html`.replace(/^\//, "");
const jsonld = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m => {
  const d = JSON.parse(m[1]); // lanza si no es JSON válido
  return d["@graph"] ?? [d];
});

test("cada página del sitemap tiene title, description, canónica absoluta propia y un solo h1", () => {
  assert.ok(urls.length >= 30);
  for (const url of urls) {
    const html = leer(archivo(url));
    const cabeza = html.slice(0, html.indexOf("</head>"));
    assert.match(cabeza, /<title>[^<]+<\/title>/, url);
    assert.match(cabeza, /<meta name="description" content="[^"]+"/, url);
    assert.ok(cabeza.includes(`<link rel="canonical" href="${url}">`), `${url}: canónica`);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${url}: h1`);
  }
});

test("todo el JSON-LD parsea y las subpáginas llevan BreadcrumbList con URLs absolutas", () => {
  for (const url of urls) {
    const nodos = jsonld(leer(archivo(url)));
    if (["", "/", "/ca", "/en"].includes(url.slice(SITIO.length))) continue;
    const migas = nodos.filter(n => n["@type"] === "BreadcrumbList");
    assert.equal(migas.length, 1, `${url}: BreadcrumbList`);
    for (const [i, p] of migas[0].itemListElement.entries()) {
      assert.equal(p.position, i + 1);
      assert.ok(p.name, `${url}: miga sin nombre`);
      if (p.item) assert.ok(p.item.startsWith(SITIO), `${url}: ${p.item}`);
    }
    const ultima = migas[0].itemListElement.at(-1);
    if (ultima.item) assert.equal(ultima.item.replace(/\/$/, ""), url, `${url}: última miga`);
  }
});

test("las migas de /ca y /en empiezan por la portada de su idioma", () => {
  for (const [ruta, inicio] of [["ca/automatitzacio-processos", `${SITIO}/ca`], ["en/process-automation", `${SITIO}/en`], ["en/projects/margon", `${SITIO}/en`]]) {
    const migas = jsonld(leer(`${ruta}/index.html`)).find(n => n["@type"] === "BreadcrumbList");
    assert.equal(migas.itemListElement[0].item, inicio, ruta);
  }
});

test("hreflang es recíproco, se repite en el sitemap y no hay URL no deseadas", () => {
  const alt = {};
  for (const url of urls) {
    const cabeza = leer(archivo(url));
    const mapa = Object.fromEntries([...cabeza.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));
    if (Object.keys(mapa).length) alt[url] = mapa;
  }
  assert.ok(Object.keys(alt).length >= 24);
  for (const [url, mapa] of Object.entries(alt)) {
    assert.ok(Object.values(mapa).includes(url), `${url}: sin autorreferencia`);
    for (const destino of Object.values(mapa)) assert.ok(Object.values(alt[destino] ?? {}).includes(url), `${url} ↔ ${destino}`);
    const entrada = entradas[urls.indexOf(url)];
    const enSitemap = Object.fromEntries([...entrada.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));
    assert.deepEqual(enSitemap, mapa, `${url}: xhtml:link`);
  }
  for (const url of urls) {
    assert.doesNotMatch(url, /\/api|diagnostico|\.html|\/index|\/contacto$/, url);
    assert.match(entradas[urls.indexOf(url)], /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, url);
  }
});

test("los enlaces internos de las páginas indexables existen en public/", () => {
  const vercel = JSON.parse(readFileSync(new URL("vercel.json", raiz), "utf8"));
  const conocidas = new Set([...vercel.rewrites, ...vercel.redirects].map(r => r.source));
  for (const url of urls) {
    for (const [, href] of leer(archivo(url)).matchAll(/<a\b[^>]*?\bhref="(\/[^"]*)"/g)) {
      const ruta = new URL(href, SITIO).pathname.replace(/\/$/, "");
      if (!ruta || ruta.startsWith("/api/") || conocidas.has(ruta)) continue;
      const rel = ruta.slice(1);
      const existe = existsSync(new URL(`public/${rel}`, raiz)) && statSync(new URL(`public/${rel}`, raiz)).isFile()
        || existsSync(new URL(`public/${rel}/index.html`, raiz)) || existsSync(new URL(`public/${rel}.html`, raiz));
      assert.ok(existe, `${url}: enlace roto ${href}`);
    }
  }
});

test("robots.txt permite a los rastreadores de buscadores e IA y solo bloquea /api/", () => {
  const robots = leer("robots.txt");
  for (const bot of ["*", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Google-Extended", "Applebot-Extended", "Bingbot"])
    assert.ok(robots.includes(`User-agent: ${bot}\nAllow: /\nDisallow: /api/\n`), bot);
  assert.equal([...robots.matchAll(/^Disallow: (.*)$/gm)].filter(m => m[1] !== "/api/").length, 0);
  assert.ok(robots.includes(`Sitemap: ${SITIO}/sitemap.xml`));
});

test("llms.txt enlaza llms-full.txt y este trae servicios, proyectos y guías con URL y fecha", () => {
  assert.ok(leer("llms.txt").includes(`${SITIO}/llms-full.txt`));
  const completo = leer("llms-full.txt");
  for (const ruta of ["automatizacion-procesos", "inteligencia-artificial", "automatizacion-n8n", "desarrollo-web", "mantenimiento-web", "proyectos/margon", "proyectos/rentup-capital", "guias/n8n-servidor-propio-rgpd"])
    assert.match(completo, new RegExp(`URL: ${SITIO}/${ruta}\\nActualizado: \\d{4}-\\d{2}-\\d{2}`), ruta);
  assert.doesNotMatch(completo, /Kairvia|<[a-z]+[ >]/i);
});

test("las FAQPage de las guías copian preguntas y respuestas visibles", () => {
  const guias = readdirSync(new URL("public/guias/", raiz)).filter(n => existsSync(new URL(`public/guias/${n}/index.html`, raiz)));
  let con = 0;
  for (const g of guias) {
    const html = leer(`guias/${g}/index.html`);
    const visible = html.slice(html.indexOf("</head>")).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
    for (const faq of jsonld(html).filter(n => n["@type"] === "FAQPage")) {
      con++;
      for (const q of faq.mainEntity) {
        assert.ok(visible.includes(q.name), `${g}: pregunta no visible ${q.name}`);
        assert.ok(visible.includes(q.acceptedAnswer.text.slice(0, 60)), `${g}: respuesta no visible`);
      }
    }
  }
  assert.ok(con >= 1);
});
