// Revisión visual: recorre la página con scroll progresivo (dispara las animaciones de
// aparición de Framer) y guarda una captura de página completa, troceada en bloques.
// Uso: node tools/qa.mjs <url> <ancho> <salida-prefijo> [movil]
import { createRequire } from "node:module";

const require = createRequire("/Users/polcarabante/margon-web/package.json");
const puppeteer = require("puppeteer-core");

const [url, width = "1280", out = "qa", mobile] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
const w = Number(width);
const h = mobile ? 844 : 800;
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));

const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += Math.round(h * 0.6)) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 450));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 1500));

const full = await page.evaluate(() => document.documentElement.scrollHeight);
const chunk = 2400;
for (let i = 0, y = 0; y < full; i++, y += chunk) {
  await page.screenshot({
    path: `${out}-${String(i).padStart(2, "0")}.png`,
    clip: { x: 0, y, width: w, height: Math.min(chunk, full - y) },
    captureBeyondViewport: true,
  });
}
console.log(JSON.stringify({ height: full, chunks: Math.ceil(full / chunk), errors }));
await browser.close();
