// Captura pantallas reales de las webs de clientes (y renderiza ilustraciones HTML) con Chrome.
// Uso: node tools/capture.mjs <config.json>
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const require = createRequire("/Users/polcarabante/margon-web/package.json");
const puppeteer = require("puppeteer-core");

const jobs = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"],
});

for (const job of jobs) {
  const page = await browser.newPage();
  await page.setViewport({
    width: job.width,
    height: job.height,
    deviceScaleFactor: job.scale || 1,
    isMobile: !!job.mobile,
    hasTouch: !!job.mobile,
  });
  if (job.mobile) {
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
  }
  await page.goto(job.url, { waitUntil: "networkidle2", timeout: 90000 });
  if (job.scrollTo) {
    await page.evaluate((y) => window.scrollTo(0, y), job.scrollTo);
  }
  if (job.eval) await page.evaluate(job.eval);
  await new Promise((r) => setTimeout(r, job.wait ?? 2500));
  if (job.eval) await page.evaluate(job.eval);
  await mkdir(dirname(job.out), { recursive: true });
  await page.screenshot({ path: job.out, fullPage: !!job.fullPage, omitBackground: !!job.transparent });
  console.log("ok", job.out);
  await page.close();
}
await browser.close();
