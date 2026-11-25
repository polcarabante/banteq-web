// api/reservas.js y api/reservas-recordatorios.js en modo simulado (sin Brevo): reservas en un JSON
// y correos como HTML en una carpeta temporal.
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.RESERVAS_SIMULAR = "1";
process.env.RESERVAS_SIMULAR_DIR = await mkdtemp(join(tmpdir(), "banteq-reservas-test-"));
process.env.VIDEOLLAMADA_URL = "https://meet.example.com/banteq";
const { default: reservas } = await import("../api/reservas.js");
const { default: recordatorios } = await import("../api/reservas-recordatorios.js");

let ip = 0; // una IP distinta por llamada: el límite de 5 reservas cada 10 min es por IP
function llamar(handler, { method = "GET", body, headers = {} } = {}) {
  return new Promise((ok) => {
    const res = {
      statusCode: 200, cabeceras: {},
      setHeader(k, v) { this.cabeceras[k] = v; },
      end(cuerpo) { ok({ status: this.statusCode, datos: JSON.parse(cuerpo || "{}") }); },
    };
    handler({ method, headers: { origin: "http://localhost:4410", "x-forwarded-for": `10.0.0.${++ip}`, ...headers }, body: body ? JSON.stringify(body) : undefined, socket: {} }, res);
  });
}

const base = { nombre: "Ana Prueba", email: "ana@example.com", empresa: "Prueba S.L.", acceptTerms: true, elapsedMs: 9000, idioma: "es", origen: "demo-reservas" };

test("huecos, reserva, hueco ocupado, errores y recordatorios", async () => {
  const g = await llamar(reservas);
  assert.equal(g.status, 200);
  assert.equal(g.datos.activo, true);
  assert.equal(g.datos.dias.length, 3);
  const hueco = g.datos.dias[0].horas[2]; // primer día, 11:00

  const r = await llamar(reservas, { method: "POST", body: { ...base, inicio: hueco.inicio } });
  assert.equal(r.status, 200, JSON.stringify(r.datos));
  assert.match(r.datos.ref, /^VC-\d{8}-1100$/);

  const g2 = await llamar(reservas);
  assert.equal(g2.datos.dias[0].horas[2].libre, false);

  const otro = await llamar(reservas, { method: "POST", body: { ...base, email: "otro@example.com", inicio: hueco.inicio } });
  assert.equal(otro.status, 409);
  assert.equal(otro.datos.code, "ocupado");

  const mal = await llamar(reservas, { method: "POST", body: { ...base, nombre: "", email: "x@", acceptTerms: false, inicio: hueco.inicio } });
  assert.equal(mal.status, 400);
  assert.deepEqual(Object.keys(mal.datos.fields).sort(), ["acepto", "email", "nombre"]);

  const fuera = await llamar(reservas, { method: "POST", body: { ...base, email: "b@example.com", inicio: "2020-01-01T09:00:00Z" } });
  assert.equal(fuera.datos.code, "hueco");

  const spam = await llamar(reservas, { method: "POST", body: { ...base, email: "c@example.com", inicio: g.datos.dias[1].horas[0].inicio, hp: "x" } });
  assert.equal(spam.status, 200);
  assert.equal((await llamar(reservas)).datos.dias[1].horas[0].libre, true); // el spam no reserva

  // Una reserva al tercer día: el recordatorio puede quedar pendiente (más de 72 h); el cron lo programa
  // en cuanto cabe y no repite los ya programados.
  const tercera = await llamar(reservas, { method: "POST", body: { ...base, email: "d@example.com", nombre: "Dani", idioma: "en", inicio: g.datos.dias[2].horas[13].inicio } });
  assert.equal(tercera.status, 200);
  assert.ok(["programado", "pendiente"].includes(tercera.datos.recordatorio));
  assert.equal((await llamar(recordatorios)).status, 401);
  const cron = await llamar(recordatorios, { headers: { "user-agent": "vercel-cron/1.0" } });
  assert.equal(cron.status, 200);
  assert.equal(cron.datos.errores, 0);

  // Ventana «Quiero mejorar»: sin casilla de privacidad (lleva el aviso informativo) y con la opción
  // de no hacer videollamada, que solo avisa a Banteq.
  const qm = await llamar(reservas, { method: "POST", body: { ...base, acceptTerms: undefined, origen: "quiero-mejorar", email: "e@example.com", inicio: g.datos.dias[1].horas[5].inicio } });
  assert.equal(qm.status, 200, JSON.stringify(qm.datos));
  const sin = await llamar(reservas, { method: "POST", body: { nombre: "Eva", empresa: "Eva S.L.", telefono: "+34600000111", accion: "sin-videollamada", origen: "quiero-mejorar", elapsedMs: 9000 } });
  assert.equal(sin.status, 200);
  const sinMal = await llamar(reservas, { method: "POST", body: { nombre: "", accion: "sin-videollamada", elapsedMs: 9000 } });
  assert.equal(sinMal.status, 400);
  const demoSinCasilla = await llamar(reservas, { method: "POST", body: { ...base, acceptTerms: undefined, email: "f@example.com", inicio: g.datos.dias[1].horas[6].inicio } });
  assert.equal(demoSinCasilla.status, 400);

  const archivos = await readdir(process.env.RESERVAS_SIMULAR_DIR);
  assert.ok(archivos.some((a) => a.includes("sin-videollamada-Eva")));
  // Y el límite por IP sí corta a la sexta reserva seguida desde la misma dirección.
  let ultima;
  for (let i = 0; i < 6; i++) ultima = await llamar(reservas, { method: "POST", headers: { "x-forwarded-for": "10.9.9.9" }, body: { ...base, email: `l${i}@example.com`, inicio: "2020-01-01T09:00:00Z" } });
  assert.equal(ultima.status, 429);
  const confirmacion = archivos.find((a) => a.includes("Videollamada-con-Banteq-confirmada") && a.endsWith(".html"));
  assert.ok(confirmacion, archivos.join(", "));
  const html = await readFile(join(process.env.RESERVAS_SIMULAR_DIR, confirmacion), "utf8");
  assert.match(html, /meet\.example\.com\/banteq/);
  assert.ok(archivos.some((a) => a.endsWith(".ics")));
  assert.ok(archivos.some((a) => a.includes("Video-call-with-Banteq-confirmed")));
  assert.ok(archivos.some((a) => a.includes("Nueva-videollamada")));
});
