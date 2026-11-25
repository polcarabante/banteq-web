import assert from "node:assert/strict";
import { test } from "node:test";
import { diasHabiles, enMadrid, esHueco, horasDelDia, huecos, ics, madridAUtc } from "../lib/agenda.mjs";

test("hora de Madrid en invierno y en verano", () => {
  assert.equal(madridAUtc("2026-11-26", "10:00").toISOString(), "2026-11-26T09:00:00.000Z");
  assert.equal(madridAUtc("2026-07-15", "10:00").toISOString(), "2026-07-15T08:00:00.000Z");
  assert.equal(madridAUtc("2026-03-30", "16:30").toISOString(), "2026-03-30T14:30:00.000Z"); // día después del cambio
  assert.deepEqual(enMadrid(new Date("2026-11-25T23:30:00Z")), { dia: "2026-11-26", hora: "00:30" });
});

test("14 huecos de 30 min al día: 10:00–13:30 y 16:00–18:30", () => {
  const h = horasDelDia();
  assert.equal(h.length, 14);
  assert.deepEqual([h[0], h[7], h[8], h[13]], ["10:00", "13:30", "16:00", "18:30"]);
});

test("tres días hábiles sin contar hoy, sin fines de semana ni festivos", () => {
  assert.deepEqual(diasHabiles(new Date("2026-11-25T10:00:00Z")), ["2026-11-26", "2026-11-27", "2026-11-30"]); // miércoles
  assert.deepEqual(diasHabiles(new Date("2026-11-27T18:00:00Z")), ["2026-11-30", "2026-12-01", "2026-12-02"]); // viernes
  assert.deepEqual(diasHabiles(new Date("2026-12-04T09:00:00Z")), ["2026-12-07", "2026-12-09", "2026-12-10"]); // 8-dic festivo
  assert.deepEqual(diasHabiles(new Date("2026-11-25T23:30:00Z")), ["2026-11-27", "2026-11-30", "2026-12-01"]); // ya es jueves en Madrid
});

test("huecos ocupados y comprobación de un inicio", () => {
  const ahora = new Date("2026-11-25T10:00:00Z");
  const ocupado = madridAUtc("2026-11-26", "10:30").toISOString();
  const d = huecos(ahora, [ocupado]);
  assert.equal(d.length, 3);
  assert.equal(d[0].horas.find((h) => h.hora === "10:30").libre, false);
  assert.equal(d[0].horas.find((h) => h.hora === "11:00").libre, true);
  assert.equal(esHueco(ocupado, ahora), true);
  assert.equal(esHueco(madridAUtc("2026-11-26", "10:15").toISOString(), ahora), false); // no alineado
  assert.equal(esHueco(madridAUtc("2026-11-26", "14:00").toISOString(), ahora), false); // fuera de franja
  assert.equal(esHueco(madridAUtc("2026-12-02", "10:00").toISOString(), ahora), false); // fuera de la ventana
  assert.equal(esHueco("mañana", ahora), false);
});

test("archivo .ics con su aviso", () => {
  const t = ics({ uid: "R-1049@banteq.com", inicio: "2026-11-26T09:30:00.000Z", titulo: "Videollamada con Banteq", descripcion: "Hola, qué tal; bien", url: "https://meet.example/abc" });
  assert.match(t, /DTSTART:20261126T093000Z\r\nDTEND:20261126T100000Z/);
  assert.ok(t.includes("DESCRIPTION:Hola\\, qué tal\\; bien"));
  assert.match(t, /TRIGGER:-PT60M/);
});
