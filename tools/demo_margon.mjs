// Demo de la tarjeta de Margon en el carrusel de proyectos: grabación REAL de la web de Margon.
//
// Abre la web de Margon en Chrome, mueve un cursor hasta «¿Qué hace Margon dentro de un tren?»,
// hace clic y deja correr la animación de la propia web (entrada al tren y llegada al interior).
// Guarda los fotogramas tal como los pinta el navegador y un guion (tiempos, cámara) en una
// carpeta temporal; tools/demo_margon.py los monta en el vídeo y el póster de la tarjeta.
//
// Uso (con la web de Margon sirviéndose en local, `npm run dev` en ~/margon-web):
//   node tools/demo_margon.mjs [carpeta]     → captura
//   python3 tools/demo_margon.py [carpeta]   → vídeo + póster en assets-banteq/generado/
// Otra dirección: MARGON_URL=https://… node tools/demo_margon.mjs
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire("/Users/polcarabante/margon-web/package.json");
const puppeteer = require("puppeteer-core");

const BASE = process.env.MARGON_URL || "http://localhost:4310";
const OUT = process.argv[2] || join(tmpdir(), "banteq-demo-margon");
const VW = 1440, VH = 900, DSF = 1.5;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "f"), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", `--window-size=${VW},${VH}`, `--force-device-scale-factor=${DSF}`],
});
const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });

// Cursor dibujado en la página (Chrome sin ventana no pinta el del sistema). Mantiene su tamaño
// en el vídeo aunque la cámara se acerque: se encoge lo mismo que la cámara amplía.
await page.evaluateOnNewDocument(() => {
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  window.__bqCam = [{ t: 0, z: 1 }];
  const zoomAt = (now) => {
    const k = window.__bqCam;
    if (now <= k[0].t) return k[0].z;
    for (let i = 1; i < k.length; i++) {
      if (now <= k[i].t) return k[i - 1].z + (k[i].z - k[i - 1].z) * ease((now - k[i - 1].t) / (k[i].t - k[i - 1].t));
    }
    return k[k.length - 1].z;
  };
  addEventListener("DOMContentLoaded", () => {
    const css = document.createElement("style");
    // El indicador de Next.js solo existe en desarrollo: no forma parte de la web.
    css.textContent = "nextjs-portal{display:none!important}#bq-cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform-origin:0 0;will-change:transform;opacity:0;transition:opacity .18s}#bq-cur svg{display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))}#bq-cur i{position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:6px solid rgba(255,255,255,.95);box-shadow:0 0 0 2px rgba(0,0,0,.22);opacity:0}";
    document.head.appendChild(css);
    const cur = document.createElement("div");
    cur.id = "bq-cur";
    cur.innerHTML = '<i></i><svg width="58" height="72" viewBox="0 0 17 21"><path d="M1.2 1.2v15.6l4.2-3.9 2.6 6.2 2.6-1.1-2.6-6.1h5.6z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(cur);
    let x = -100, y = -100, press = 1;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; cur.style.opacity = 1; }, true);
    addEventListener("mousedown", () => {
      press = 0.86;
      setTimeout(() => (press = 1), 130);
      cur.firstChild.animate([{ transform: "scale(.3)", opacity: 0.95 }, { transform: "scale(1)", opacity: 0 }], { duration: 560, easing: "cubic-bezier(.2,.7,.2,1)" });
    }, true);
    const tick = () => {
      const s = press / zoomAt(Date.now());
      cur.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await wait(1500);
const rect = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
const boton = await rect('[data-test="enter-train"]');

// Fotogramas tal como los compone el navegador, con su marca de tiempo.
const cdp = await page.createCDPSession();
const frames = [];
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const f = String(frames.length).padStart(5, "0") + ".jpg";
  frames.push({ ts: Math.round(metadata.timestamp * 1000), f });
  writeFileSync(join(OUT, "f", f), Buffer.from(data, "base64"));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

let mx = VW - 3, my = 668;
const glide = async (to, ms, arco = 0) => {
  const from = { x: mx, y: my }, t0 = Date.now();
  const c = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - arco };
  for (;;) {
    const p = Math.min(1, (Date.now() - t0) / ms), e = ease(p), u = 1 - e;
    mx = u * u * from.x + 2 * u * e * c.x + e * e * to.x;
    my = u * u * from.y + 2 * u * e * c.y + e * e * to.y;
    await page.mouse.move(mx, my);
    if (p >= 1) break;
    await wait(5);
  }
};
const cam = [];
const camTo = async (t, z, cx, cy) => { cam.push({ t, z, cx, cy }); await page.evaluate((k) => { window.__bqCam = k; }, cam.map((k) => ({ t: k.t, z: k.z }))); };

await cdp.send("Page.startScreencast", { format: "jpeg", quality: 93, everyNthFrame: 1 });
await wait(350);
const t0 = Date.now();
const ev = { t0 };
await camTo(t0, 1, VW / 2, VH / 2);
await wait(450);

// 1. El cursor entra por la derecha y va hasta el botón; la cámara se acerca a esa zona.
const destino = { x: boton.x + boton.w * 0.62, y: boton.y + boton.h * 0.56 };
const ZX = boton.x + boton.w / 2, ZY = boton.y + boton.h / 2 - 12; // la cámara no sale de la página: se ajusta al borde
const tMov = Date.now();
await camTo(tMov + 250, 1, VW / 2, VH / 2);
await camTo(tMov + 1500, 2.1, ZX, ZY);
await glide(destino, 1450, 70);
await wait(700); // el botón reacciona al cursor (y la web precarga su película)

// 2. Clic: la web lanza su animación. La cámara vuelve a plano completo.
ev.click = Date.now();
await camTo(ev.click + 140, 2.1, ZX, ZY);
await camTo(ev.click + 1050, 1, VW / 2, VH / 2);
await page.mouse.down();
await wait(90);
await page.mouse.up();

// 3. La película de la web termina sola y aparece el interior del coche.
await page.waitForFunction(() => [...document.querySelectorAll("video")].some((v) => v.ended), { timeout: 20000 });
ev.interior = Date.now();
await page.waitForFunction(() => { const d = document.querySelector('[data-test="cabin-door"]'); let o = 1; for (let e = d; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o > 0.98; }, { timeout: 10000 });
await wait(650);

// 4. El cursor se acerca a la puerta del aseo (la segunda animación de la web) y se queda encima.
const puerta = await rect('[data-test="cabin-door"]');
const tPuerta = Date.now();
await camTo(tPuerta, 1, VW / 2, VH / 2);
await camTo(tPuerta + 1300, 1.55, puerta.x + puerta.w / 2, puerta.y + puerta.h * 0.62);
await glide({ x: puerta.x + puerta.w * 0.5, y: puerta.y + puerta.h - 14 }, 1050, -40);
await wait(1350);
ev.fin = Date.now();

await cdp.send("Page.stopScreencast");
await wait(200);
await browser.close();

writeFileSync(join(OUT, "guion.json"), JSON.stringify({ base: BASE, vw: VW, vh: VH, dsf: DSF, ev, cam, frames }));
const span = (frames[frames.length - 1].ts - frames[0].ts) / 1000;
const gaps = frames.slice(1).map((f, i) => f.ts - frames[i].ts).sort((a, b) => a - b);
console.log(`${frames.length} fotogramas en ${span.toFixed(1)} s (${(frames.length / span).toFixed(1)} por segundo; hueco mediano ${gaps[gaps.length >> 1]} ms, máximo ${gaps[gaps.length - 1]} ms)`);
console.log(`clic a los ${((ev.click - t0) / 1000).toFixed(2)} s · interior a los ${((ev.interior - t0) / 1000).toFixed(2)} s · fin a los ${((ev.fin - t0) / 1000).toFixed(2)} s`);
console.log("→", OUT);
