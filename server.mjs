// Servidor estático para revisar la web de Banteq en local.
// Uso: npm run dev (o node server.mjs)  →  http://localhost:4400
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const PORT = Number(process.env.PORT) || 4400;

if (!existsSync(join(ROOT, "index.html"))) {
  console.error("No existe public/index.html. Genera la web con: npm run build");
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".framercms": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

const resolveFile = async (urlPath) => {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [join(ROOT, clean), join(ROOT, clean, "index.html"), join(ROOT, `${clean}.html`)];
  for (const file of candidates) {
    if (!file.startsWith(ROOT)) continue;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {}
  }
  return null;
};

const handler = async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  // En local no hay backend: los formularios responden OK para poder probar el flujo.
  if (url.pathname === "/api/leads" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    console.log("[api/leads] (local, no se envía nada)", body);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, local: true }));
    return;
  }

  const file = await resolveFile(url.pathname);
  if (!file) {
    const notFound = await resolveFile("/404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    res.end(notFound ? await readFile(notFound) : "404");
    return;
  }

  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  const data = await readFile(file);
  const range = req.headers.range;

  // Los vídeos necesitan peticiones por rango para que Safari los reproduzca.
  if (range && type === "video/mp4") {
    const [startRaw, endRaw] = range.replace(/bytes=/, "").split("-");
    const start = Number(startRaw);
    const end = endRaw ? Number(endRaw) : data.length - 1;
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Range": `bytes ${start}-${end}/${data.length}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    res.end(data.subarray(start, end + 1));
    return;
  }

  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
  res.end(data);
};

// En macOS "localhost" se resuelve primero a ::1 (IPv6), así que se escucha en las dos
// direcciones de loopback. Solo es accesible desde este ordenador.
const listen = (host) =>
  new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.once("error", reject);
    server.listen(PORT, host, () => resolve(server));
  });

try {
  await listen("127.0.0.1");
} catch (error) {
  if (error.code === "EADDRINUSE") {
    console.error(
      `El puerto ${PORT} ya está en uso. Si ya tienes la web abierta, sigue en http://localhost:${PORT}.\n` +
        `Si es otro programa, arranca en otro puerto: PORT=4401 npm run dev`,
    );
    process.exit(1);
  }
  throw error;
}
await listen("::1").catch(() => {}); // Sin IPv6 basta con 127.0.0.1.
console.log(`Banteq en local → http://localhost:${PORT}`);
