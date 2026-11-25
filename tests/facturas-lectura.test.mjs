import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buscarNifs, extraerCampos, fechasDe, importesDe, leerFacturae, lineasDeItems, parseImporte, validarFactura, validarNif,
} from "../lib/facturas-lectura.mjs";
import { EMPRESA_DEMO, PEDIDOS, SEMILLAS } from "../lib/demos-erp-datos.mjs";

test("NIF, NIE y CIF con su control", () => {
  assert.equal(validarNif("12345678Z"), "nif");
  assert.equal(validarNif("12345678A"), null);
  assert.equal(validarNif("X1234567L"), "nie");
  assert.equal(validarNif("B-61.982.542"), "cif");
  assert.equal(validarNif("ESB61982542"), "cif");
  assert.equal(validarNif("B61982543"), null);
  assert.equal(validarNif("P0800000B"), validarNif("P0800000B")); // letra obligatoria: no lanza
  assert.deepEqual(buscarNifs("NIF: B61982542 · cliente 12345678Z").map((x) => x.nif), ["B61982542", "12345678Z"]);
});

test("importes y fechas en formato español", () => {
  assert.equal(parseImporte("1.284,60 €"), 1284.6);
  assert.equal(parseImporte("1284,6"), 1284.6);
  assert.equal(parseImporte("1,284.60"), 1284.6);
  assert.equal(parseImporte("abc"), null);
  assert.deepEqual(importesDe("IVA 21 % 1.061,65 € 222,95 €"), [1061.65, 222.95]);
  assert.deepEqual(importesDe("Fecha 28.10.2026 · 21,00 %"), []);
  assert.deepEqual(fechasDe("Fecha: 28/10/2026, vence el 27-11-26"), ["2026-10-28", "2026-11-27"]);
  assert.deepEqual(fechasDe("Emitida el 5 de noviembre de 2026"), ["2026-11-05"]);
  assert.deepEqual(fechasDe("31/02/2026"), []);
});

test("líneas de pdf.js: columnas separadas con tabulador", () => {
  const it = (str, x, y, width) => ({ str, transform: [10, 0, 0, 10, x, y], width, height: 10 });
  const lineas = lineasDeItems([it("FACTURA", 400, 800, 60), it("Aceros Vallès S.L.", 50, 801, 110), it("NIF:", 50, 780, 20), it("B65432189", 72, 780, 50)]);
  assert.deepEqual(lineas, ["Aceros Vallès S.L.\tFACTURA", "NIF: B65432189"]);
});

test("factura en texto con otras etiquetas y el total sin etiqueta de base", () => {
  const c = extraerCampos(`Talleres Ejemplo, S.L.
CIF B-61.982.542 · Tel. 938 000 000
Factura nº: 2026/0091
Data: 3 de novembre de 2026
Cliente: Talleres Riera S.L. NIF B08765430
Servicio de mantenimiento preventivo 250,00
IVA (21%) 52,50
TOTAL A PAGAR 302,50 €
Vencimiento: 03/12/2026`);
  assert.equal(c.nif, "B61982542");
  assert.equal(c.proveedor, "Talleres Ejemplo, S.L.");
  assert.equal(c.numero, "2026/0091");
  assert.equal(c.fecha, "2026-11-03");
  assert.equal(c.vencimiento, "2026-12-03");
  assert.equal(c.total, 302.5);
  assert.equal(c.iva, 52.5);
  assert.equal(c.base, 250);
  assert.equal(c.tipoIva, 21);
});

test("sin etiquetas de totales: se encuentra el trío base + IVA = total", () => {
  const c = extraerCampos(["Proveedor Demo S.L. B61982542", "Factura F-77 12/11/2026", "Concepto 1.000,00", "1.000,00 210,00 1.210,00"]);
  assert.deepEqual([c.base, c.iva, c.total, c.tipoIva], [1000, 210, 1210, 21]);
});

test("el NIF de la propia empresa no se toma como el del proveedor", () => {
  const c = extraerCampos(["Cliente: Talleres Riera S.L. B08765430\tProveedor: Suministros Besòs S.L. B61982542"], { nifPropio: EMPRESA_DEMO.nif });
  assert.equal(c.nif, "B61982542");
});

test("comprobaciones: cuadra, NIF, duplicada y pedido", () => {
  const buena = { proveedor: "Suministros Besòs S.L.", nif: "B61982542", numero: "SB-26-0457", fecha: "2026-11-18", base: 600, iva: 126, total: 726, pedido: "PC-124" };
  let r = validarFactura(buena, { pedidos: PEDIDOS, registradas: SEMILLAS.facturas });
  assert.equal(r.registrable, true);

  r = validarFactura({ ...buena, iva: 120 }, { pedidos: PEDIDOS, registradas: [] });
  assert.equal(r.motivo.clave, "cuadra");

  r = validarFactura(buena, { pedidos: PEDIDOS, registradas: [{ id: "F-0413", nif: "B-61982542", numero: "SB 26 0457" }] });
  assert.deepEqual([r.motivo.clave, r.motivo.datos.id], ["duplicada", "F-0413"]);

  r = validarFactura({ ...buena, nif: "B61982543" }, { pedidos: PEDIDOS, registradas: [] });
  assert.equal(r.motivo.clave, "nif");

  r = validarFactura({ ...buena, total: 1344.92, base: 1111.5, iva: 233.42, pedido: "PC-118" }, { pedidos: PEDIDOS, registradas: [] });
  assert.deepEqual([r.motivo.clave, r.motivo.datos.id], ["pedido", "PC-118"]);

  r = validarFactura({ ...buena, nif: "12345678Z", pedido: "" }, { pedidos: PEDIDOS, registradas: [] });
  assert.deepEqual([r.motivo.clave, r.motivo.estado], ["pedido", "aviso"]);

  r = validarFactura({ ...buena, numero: "" }, { pedidos: PEDIDOS, registradas: [] });
  assert.deepEqual(r.motivo.datos.faltan, ["numero"]);
});

test("Facturae de ejemplo: campos exactos y coincide con el pedido PC-126", () => {
  const xml = readFileSync(new URL("../assets-banteq/demos-interactivas/ejemplos/factura-facturae.xml", import.meta.url), "utf8");
  const c = leerFacturae(xml);
  assert.deepEqual(c, {
    proveedor: "Recambios Terrassa S.L.", nif: "B67329151", numero: "RT-2026-0388", fecha: "2026-11-19", vencimiento: "2026-12-19",
    base: 360, tipoIva: 21, iva: 75.6, total: 435.6, pedido: "PC-126",
  });
  assert.equal(validarFactura(c, { pedidos: PEDIDOS, registradas: SEMILLAS.facturas }).registrable, true);
  assert.equal(leerFacturae("<html></html>"), null);
});

test("texto de OCR: «N” factura», minúsculas y FACTURA en la línea del proveedor", () => {
  const c = extraerCampos([
    "Aceros Vallés S.L. FACTURA",
    "08202 Sabadell (Barcelona) N” factura: Av-2026/1203",
    "NIF: B65432189 Fecha: 20/11/2026",
    "Base imponible 1.111,50 €", "IVA 21 % 233,42 €", "Total factura 1.344,92 €",
  ]);
  assert.equal(c.proveedor, "Aceros Vallés S.L.");
  assert.equal(c.numero, "AV-2026/1203");
  assert.equal(extraerCampos(["Factura N.º 2026-15", "Total 121,00"]).numero, "2026-15");
  assert.equal(extraerCampos(["Nº de factura: F/0099", "Total 121,00"]).numero, "F/0099");
  assert.equal(extraerCampos(["Recambios Martín S.L.", "Total 121,00"]).numero, "");
});
