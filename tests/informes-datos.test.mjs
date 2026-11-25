import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularInforme, detectarColumnas, faltan, leerFecha, leerNumero, limpiar, semanaIso } from "../lib/informes-datos.mjs";

const iso = (f) => f && f.toISOString().slice(0, 10);

test("columnas por su nombre; las exportaciones con códigos no se reconocen", () => {
  assert.deepEqual(detectarColumnas(["Fecha", "Producto", "Unidades", "Importe (€)", "Stock actual", "Stock mínimo"]), { minimo: 5, stock: 4, fecha: 0, producto: 1, unidades: 2 });
  assert.deepEqual(detectarColumnas(["Fecha", "Producto", "Unidades", "Importe"]), { fecha: 0, producto: 1, unidades: 2, importe: 3 });
  assert.deepEqual(faltan(detectarColumnas(["FEC_DOC", "COD_ART", "CANT_UD", "IMP_NETO"])), ["fecha", "importe"]);
  assert.deepEqual(faltan({ fecha: 0, unidades: 1 }), []);
});

test("fechas y números en formato español", () => {
  assert.equal(iso(leerFecha("03/11/2026").fecha), "2026-11-03");
  assert.equal(iso(leerFecha("3-11-26").fecha), "2026-11-03");
  assert.equal(iso(leerFecha("2026-11-03").fecha), "2026-11-03");
  assert.equal(iso(leerFecha("3 de noviembre de 2026").fecha), "2026-11-03");
  assert.equal(iso(leerFecha(46329).fecha), "2026-11-03"); // número de serie de Excel
  assert.equal(leerFecha("31/02/2026").fecha, null);
  assert.deepEqual(leerNumero("1.234,50 €"), { valor: 1234.5, convertido: true });
  assert.deepEqual(leerNumero("12 uds"), { valor: 12, convertido: false });
  assert.equal(leerNumero("n/d").valor, null);
  assert.equal(semanaIso(new Date(Date.UTC(2026, 10, 22))).clave, "2026-W47");
  assert.equal(semanaIso(new Date(Date.UTC(2027, 0, 1))).clave, "2026-W53");
});

test("limpieza: filas vacías, fechas y números convertidos, filas descartadas", () => {
  const mapa = { fecha: 0, producto: 1, unidades: 2, importe: 3 };
  const { registros, stats } = limpiar([
    ["16/11/2026", "Tornillo", "10", "120,00 €"],
    ["", "", "", ""],
    ["2026-11-17", "Arandela", 5, 30],
    ["sin fecha", "Tornillo", 1, 12],
    ["18/11/2026", "Tornillo", 2, "n/d"],
  ], mapa);
  assert.equal(registros.length, 2);
  assert.deepEqual(stats, { leidas: 5, vacias: 1, fechas: 2, numeros: 1, descartadas: [{ fila: 5, motivo: "fecha" }, { fila: 6, motivo: "importe" }] });
});

test("informe: última semana frente a la anterior, top, stock bajo mínimo y serie", () => {
  const d = (y, m, dd) => new Date(Date.UTC(y, m - 1, dd));
  const reg = [
    { fecha: d(2026, 11, 10), producto: "A", unidades: 10, importe: 100, stock: 50, minimo: 20 },
    { fecha: d(2026, 11, 11), producto: "B", unidades: 5, importe: 100, stock: 30, minimo: 10 },
    { fecha: d(2026, 11, 17), producto: "A", unidades: 12, importe: 150, stock: 15, minimo: 20 },
    { fecha: d(2026, 11, 18), producto: "B", unidades: 2, importe: 60, stock: 28, minimo: 10 },
  ];
  const inf = calcularInforme(reg);
  assert.equal(inf.semana.clave, "2026-W47");
  assert.equal(inf.anterior.clave, "2026-W46");
  assert.equal(inf.importe.actual, 210);
  assert.equal(Math.round(inf.importe.variacion), 5);
  assert.equal(inf.ticketMedio, 105);
  assert.deepEqual(inf.top.map((p) => p.producto), ["A", "B"]);
  assert.deepEqual(inf.stockCritico, [{ producto: "A", stock: 15, minimo: 20 }]);
  assert.deepEqual(inf.serie.map((s) => s.valor), [200, 210]);
  assert.equal(calcularInforme([{ fecha: d(2026, 11, 17), producto: "A", unidades: 3 }]).metrica, "unidades");
  assert.equal(calcularInforme([{ fecha: d(2026, 11, 17), producto: "A", importe: 10 }]).hayUnidades, false);
});
