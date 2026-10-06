// HTML inicial de las páginas que Framer pinta en el navegador (todas menos la home).
//
// Abre cada página en Chrome a tamaño de teléfono, espera a que React la pinte y guarda su HTML y
// los estilos que Framer añade al vuelo en assets-banteq/prerender/. tools/build.py los mete en el
// HTML de cada página: así el contenido está en el HTML desde el primer byte (buscadores) y, en
// móvil, se ve sin esperar al JavaScript.
//
// Uso (con la web ya generada):  npm run prerender   → captura y vuelve a generar la web.
// Hay que repetirlo cuando cambie el contenido de esas páginas (tools/contenido.py).
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/polcarabante/margon-web/package.json");
const puppeteer = require("puppeteer-core");

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = ROOT + "assets-banteq/prerender/";
const PORT = 4466;
const BASE = `http://127.0.0.1:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Páginas: las del sitemap menos la home (que ya viene pre-renderizada por Framer).
const sitemap = readFileSync(ROOT + "public/sitemap.xml", "utf8");
const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => p !== "/");

const server = spawn("node", [ROOT + "tools/servidor-local.mjs"], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
await wait(900);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"],
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const firma = createHash("sha1").update(readFileSync(ROOT + "tools/contenido.py")).digest("hex").slice(0, 12);

try {
  for (const path of paths) {
    const page = await browser.newPage();
    // Teléfono: la instantánea solo se enseña por debajo de 800 px (ver tools/build.py).
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => {
      window.BANTEQ_PRE = true; // mismas animaciones de entrada desactivadas que tendrá el móvil
      window.BANTEQ_CAPTURA = true; // no usar una instantánea anterior
      // Estilo en línea de cada elemento tal como React lo pinta la primera vez: las animaciones
      // que arrancan después (cabecera, tarjetas al entrar en pantalla) no deben quedar a medias
      // en la instantánea.
      const rec = (el) => {
        if (el.nodeType !== 1) return;
        if (!el.hasAttribute("data-bq-s0")) el.setAttribute("data-bq-s0", el.getAttribute("style") ?? "\u0000");
        for (const c of el.children) rec(c);
      };
      new MutationObserver((ms) => {
        for (const m of ms) for (const n of m.addedNodes) rec(n);
      }).observe(document, { childList: true, subtree: true });
      document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("bq-pre")?.remove();
        window.__bqHojas = [...document.styleSheets].map((s) => {
          try {
            return [s.ownerNode, s.cssRules.length];
          } catch {
            return [s.ownerNode, -1];
          }
        });
      });
    });
    await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    await wait(2500);
    const snap = await page.evaluate(() => {
      const main = document.getElementById("main");
      const clone = main.cloneNode(true);
      clone.querySelectorAll("[data-bq-s0]").forEach((el) => {
        const s = el.getAttribute("data-bq-s0");
        if (s === "\u0000") el.removeAttribute("style");
        else el.setAttribute("style", s);
        el.removeAttribute("data-bq-s0");
      });
      clone.querySelectorAll("script, canvas").forEach((el) => el.remove());
      // Vídeos: sin descargarlos dos veces (el de verdad lo pone React). Si el vídeo está en la
      // primera pantalla (el fondo de la página de contacto), su primer fotograma como póster.
      const reales = [...main.querySelectorAll("video")];
      clone.querySelectorAll("video").forEach((v, k) => {
        const real = reales[k];
        const r = real.getBoundingClientRect();
        const src = real.currentSrc || real.src || "";
        v.removeAttribute("src");
        v.removeAttribute("autoplay");
        v.setAttribute("preload", "none");
        v.querySelectorAll("source").forEach((s) => s.remove());
        if (r.width > 0 && r.bottom > 0 && r.top < innerHeight && /S4N88TVzCfxigg9YZYcSIYNPk4/.test(src)) v.setAttribute("poster", "/banteq/pie-video-poster.jpg");
      });
      // Formularios: sin envío nativo mientras no haya JavaScript.
      clone.querySelectorAll("form").forEach((f) => f.setAttribute("onsubmit", "return false"));
      // Los ids de la instantánea no deben chocar con los de la página que React monta debajo.
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      const origin = location.origin;
      const html = clone.innerHTML.split(origin).join("");
      // Estilos que Framer añade al vuelo (los de la página y sus componentes).
      const seen = new Set();
      const css = [];
      for (const sheet of document.styleSheets) {
        const node = sheet.ownerNode;
        if (!node || node.tagName !== "STYLE" || main.contains(node)) continue;
        let rules;
        try {
          rules = [...sheet.cssRules];
        } catch {
          continue;
        }
        const base = (window.__bqHojas || []).find(([n]) => n === node);
        const from = base ? base[1] : 0;
        if (from < 0) continue;
        for (const r of rules.slice(from)) {
          if (!seen.has(r.cssText)) {
            seen.add(r.cssText);
            css.push(r.cssText);
          }
        }
      }
      const text = main.innerText.replace(/\s+/g, " ").trim();
      return { html, css: css.join("\n").split(origin).join(""), h1: main.querySelector("h1")?.innerText.replace(/\s+/g, " ").trim() || "", palabras: text.split(" ").length, enlaces: main.querySelectorAll("a[href]").length };
    });
    if (!snap.h1) throw new Error(`${path}: la página no ha pintado su <h1>`);
    const name = path.replace(/^\//, "").replace(/\//g, "__");
    writeFileSync(OUT + name + ".json", JSON.stringify({ ruta: path, firma, html: snap.html, css: snap.css }));
    console.log(`${path.padEnd(28)} «${snap.h1.slice(0, 44)}» · ${snap.palabras} palabras · ${snap.enlaces} enlaces · HTML ${(snap.html.length / 1024).toFixed(0)} KB · CSS ${(snap.css.length / 1024).toFixed(0)} KB`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}

if (!process.argv.includes("--sin-build") && existsSync(ROOT + "tools/build.py")) {
  const r = spawnSync("python3", [ROOT + "tools/build.py"], { stdio: "inherit" });
  process.exit(r.status ?? 0);
}
