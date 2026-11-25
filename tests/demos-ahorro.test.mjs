import assert from "node:assert/strict";
import { test } from "node:test";
import { AHORRO, calcularAhorro, formatoEuros, formatoNumero, valoresDe } from "../lib/demos-ahorro.mjs";

test("facturas: valores por defecto", () => {
  const r = calcularAhorro("facturas", {});
  // 150 facturas × 6 min × 90 % = 13,5 h; × 25 €/h = 337,50 €; errores 150 × 2 % × 30 € = 90 €.
  assert.equal(r.horasMes, 13.5);
  assert.equal(r.partes.tiempoMes, 337.5);
  assert.equal(r.partes.erroresMes, 90);
  assert.equal(r.euroMes, 427.5);
  assert.equal(r.euroAño, 5130);
});

test("valores fuera de rango o vacíos", () => {
  const v = valoresDe("facturas", { facturasMes: 99999, minFactura: "", costeHora: "abc" });
  assert.equal(v.facturasMes, 2000);
  assert.equal(v.minFactura, 6);
  assert.equal(v.costeHora, 25);
});

test("cada demostración tiene controles con el defecto dentro del rango", () => {
  for (const [id, d] of Object.entries(AHORRO)) {
    assert.ok(d.controles.length >= 2 && d.controles.length <= 3, id);
    for (const c of [...d.controles, ...d.supuestos]) assert.ok(c.defecto >= c.min && c.defecto <= c.max, `${id}.${c.clave}`);
  }
});

test("formato por idioma", () => {
  assert.equal(formatoNumero(1284.6, "es", 2), "1.284,60");
  assert.equal(formatoNumero(1330, "es"), "1.330");
  assert.equal(formatoEuros(1284.6, "es", 2), "1.284,60 €");
  assert.equal(formatoEuros(1284.6, "ca", 2), "1.284,60 €");
  assert.equal(formatoEuros(1284.6, "en", 2), "€1,284.60");
});

test("asistente: valores por defecto", () => {
  const r = calcularAhorro("asistente", {});
  // 10 empleados × 5 consultas × 52/12 semanas = 216,7 consultas; × 80 % × (12 − 2) min = 28,9 h; × 25 €/h.
  assert.equal(Math.round(r.partes.consultasMes * 10) / 10, 216.7);
  assert.equal(Math.round(r.horasMes * 10) / 10, 28.9);
  assert.equal(Math.round(r.euroMes), 722);
  assert.equal(Math.round(r.euroAño), 8667);
  assert.equal(calcularAhorro("asistente", { minBuscando: 2, minConAsistente: 5 }).euroMes, 0);
});

test("crm: valores por defecto", () => {
  const r = calcularAhorro("crm", {});
  // 40 × 15 min × 85 % = 8,5 h × 25 € = 212,50 €; 40 × 5 % × 20 % = 0,4 clientes × 400 € = 160 €.
  assert.equal(r.horasMes, 8.5);
  assert.equal(r.partes.tiempoMes, 212.5);
  assert.equal(Math.round(r.partes.clientesMes * 100) / 100, 0.4);
  assert.equal(Math.round(r.partes.ventasMes), 160);
  assert.equal(Math.round(r.euroMes * 100) / 100, 372.5);
  assert.equal(Math.round(r.euroAño), 4470);
});

test("informes: valores por defecto", () => {
  const r = calcularAhorro("informes", {});
  // 4 h a la semana × 52/12 × 90 % = 15,6 h al mes × 25 € = 390 €; al año, 4.680 €.
  assert.equal(Math.round(r.horasMes * 10) / 10, 15.6);
  assert.equal(Math.round(r.euroMes), 390);
  assert.equal(Math.round(r.euroAño), 4680);
});

test("reservas: valores por defecto", () => {
  const r = calcularAhorro("reservas", {});
  // 15 llamadas × 4 min × 22 días × 80 % = 17,6 h × 25 € = 440 €; 200 citas × 8 % × 50 % = 8 citas × 40 € = 320 €.
  assert.equal(Math.round(r.horasMes * 10) / 10, 17.6);
  assert.equal(Math.round(r.partes.tiempoMes), 440);
  assert.equal(Math.round(r.partes.citasRecuperadas), 8);
  assert.equal(Math.round(r.euroMes), 760);
  assert.equal(Math.round(r.euroAño), 9120);
});
