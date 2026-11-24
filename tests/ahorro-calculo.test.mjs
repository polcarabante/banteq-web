import assert from "node:assert/strict";
import { test } from "node:test";
import { calcular, formatoEuros, formatoNumero, herramientasMes, validarValores, VALORES_DEFECTO } from "../lib/ahorro-calculo.mjs";

test("valores por defecto: las cifras de comprobación de la calculadora", () => {
  const r = calcular(VALORES_DEFECTO);
  assert.equal(r.redondeado.horasAño, 997);
  assert.equal(r.redondeado.empleados, 0.57);
  assert.equal(r.redondeado.ahorroBrutoMes, 1330);
  assert.equal(r.redondeado.herramientasMes, 30);
  assert.equal(r.redondeado.ahorroMes, 1300);
  assert.equal(r.redondeado.implantacion, 1300);
  assert.equal(r.redondeado.mantenimientoMes, 325);
  assert.equal(r.redondeado.gananciaClienteMes, 975);
  assert.equal(r.redondeado.gananciaClienteAño, 11698);
  assert.equal(r.redondeado.gananciaPrimerAño, 10398);
  assert.equal(r.compensa, true);
  assert.equal(formatoEuros(r.gananciaClienteAño), "11.698\u00a0€");
  assert.equal(formatoNumero(r.empleados, 2), "0,57");
});

test("herramientas según el volumen", () => {
  assert.deepEqual([5, 50, 55, 150, 155, 300].map(herramientasMes), [30, 30, 60, 60, 100, 100]);
});

test("si el ahorro no cubre las herramientas, no compensa", () => {
  const r = calcular({ correosDia: 5, minCorreo: 1, minSeguimiento: 0, automatizable: 50, dias: 200, costeHora: 10 });
  assert.equal(r.ahorroMes, 0);
  assert.equal(r.redondeado.mantenimientoMes, 0);
  assert.equal(r.compensa, false);
});

test("solo acepta valores dentro de rango y en su paso", () => {
  assert.deepEqual(validarValores(VALORES_DEFECTO), VALORES_DEFECTO);
  assert.equal(validarValores({ ...VALORES_DEFECTO, correosDia: 42 }), null);
  assert.equal(validarValores({ ...VALORES_DEFECTO, costeHora: 41 }), null);
  assert.equal(validarValores({ ...VALORES_DEFECTO, dias: "abc" }), null);
  assert.equal(validarValores({}), null);
});
