// Cron diario (vercel.json, «crons»): programa en Brevo los recordatorios de una hora antes que no
// se pudieron programar al reservar porque la llamada quedaba a más de 72 h (el máximo de Brevo).
// Vercel lo llama con «Authorization: Bearer <CRON_SECRET>» si CRON_SECRET existe; si no existe, solo
// se acepta la llamada del propio cron de Vercel (agente «vercel-cron»).
import { marcarRecordatorio, programarRecordatorio, reservasFuturas, activo } from "../lib/reservas-servidor.mjs";

const responder = (res, status, datos) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(datos));
};

export default async function handler(req, res) {
  const secreto = process.env.CRON_SECRET;
  const autorizado = secreto ? req.headers.authorization === `Bearer ${secreto}` : /vercel-cron/i.test(String(req.headers["user-agent"] || ""));
  if (!autorizado) return responder(res, 401, { error: "No autorizado." });
  if (!activo()) return responder(res, 200, { ok: true, activo: false });
  const ahora = new Date();
  const resultado = { programados: 0, pendientes: 0, errores: 0 };
  try {
    for (const r of await reservasFuturas(ahora)) {
      if (r.recordatorio === "programado") continue;
      try {
        if (await programarRecordatorio(r, ahora)) {
          await marcarRecordatorio(r.email, "programado");
          resultado.programados++;
        } else resultado.pendientes++;
      } catch (e) {
        resultado.errores++;
        console.error("Recordatorios: fallo al programar", JSON.stringify({ ref: r.ref, status: e.status || null, detalle: e.detalle || e.message }));
      }
    }
    return responder(res, 200, { ok: true, ...resultado });
  } catch (e) {
    console.error("Recordatorios: error", JSON.stringify({ status: e.status || null, detalle: e.detalle || e.message }));
    return responder(res, 502, { ok: false });
  }
}
