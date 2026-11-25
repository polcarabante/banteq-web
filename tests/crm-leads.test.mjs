import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buscarDuplicado, contactosDeFilas, correoDeEmpresa, diaLaborable, empresaClave, iniciales, leerCsv, origenDe, prioridadDe, procesarContactos, sectorDe,
} from "../lib/crm-leads.mjs";
import { SEMILLAS } from "../lib/demos-erp-datos.mjs";

test("CSV con punto y coma, comillas y BOM; columnas por su nombre en tres idiomas", () => {
  const filas = leerCsv('﻿Nombre;Empresa;Correo electrónico;Teléfono;Comentarios\r\n"Pérez, Ana";Clínica Sol;ana@clinicasol.es;600 111 222;"Quiero ""presupuesto"""\r\n\r\n');
  assert.deepEqual(filas[1], ["Pérez, Ana", "Clínica Sol", "ana@clinicasol.es", "600 111 222", 'Quiero "presupuesto"']);
  const { contactos, faltan } = contactosDeFilas(filas);
  assert.deepEqual(faltan, []);
  assert.equal(contactos[0].email, "ana@clinicasol.es");
  assert.equal(contactos[0].mensaje, 'Quiero "presupuesto"');
  assert.deepEqual(contactosDeFilas(leerCsv("Name,Company,E-mail\nJo,Acme,jo@acme.com")).contactos[0], { fila: 2, nombre: "Jo", empresa: "Acme", email: "jo@acme.com" });
  assert.deepEqual(contactosDeFilas(leerCsv("Producto;Precio\nTornillo;0,10")).faltan, ["nombre", "email"]);
  // Las cabeceras de las tres plantillas de ejemplo se reconocen enteras.
  for (const cab of ["Nombre;Empresa;Email;Teléfono;Comentarios;Origen", "Nom;Empresa;Correu;Telèfon;Comentaris;Origen", "Name,Company,Email,Phone,Notes,Source"]) {
    assert.deepEqual(Object.keys(contactosDeFilas(leerCsv(cab + "\nA;B;c@d.es;600000000;m;Web")).columnas).length, 6, cab);
  }
});

test("duplicados por email, teléfono o empresa y nombre de pila", () => {
  const existentes = SEMILLAS.crm;
  assert.equal(buscarDuplicado({ email: "LAURA@talleresgomez.es" }, existentes).con.id, "LEAD-0086");
  assert.equal(buscarDuplicado({ nombre: "Núria Soler", empresa: "Ferreteria Puig S.L." }, existentes)?.con.id, "LEAD-0085");
  assert.equal(buscarDuplicado({ nombre: "Pau", empresa: "Ferretería Puig" }, existentes), null);
  assert.equal(empresaClave("Talleres Gómez, S.L.U."), "talleres gomez");
});

test("clasificación: sector, prioridad con motivos y origen", () => {
  assert.equal(sectorDe({ empresa: "Clínica Dental Sant Joan" }), "salud");
  assert.equal(sectorDe({ empresa: "Mecanizados Rubí", email: "x@mecarubi.es" }), "industria");
  assert.equal(sectorDe({ empresa: "Lo que sea" }), "otros");
  assert.equal(sectorDe({ mensaje: "Información general", email: "x@gmail.com" }), "otros"); // «información» no es «formación»
  assert.equal(sectorDe({ empresa: "Gestoría de Barcelona" }), "servicios"); // «Barcelona» no es «bar»
  assert.deepEqual(prioridadDe({ empresa: "Acme", email: "a@acme.es", telefono: "600111222", mensaje: "Necesito presupuesto esta semana" }), { prioridad: "alta", motivos: ["empresa", "correoEmpresa", "telefono", "intencion"] });
  assert.equal(prioridadDe({ email: "x@gmail.com" }).prioridad, "baja");
  assert.equal(correoDeEmpresa("x@hotmail.es"), false);
  assert.equal(origenDe("LinkedIn"), "redes");
  assert.equal(origenDe(""), "importacion");
});

test("seguimiento en días laborables y reparto entre comerciales", () => {
  const viernes = new Date(2026, 10, 27, 16, 0); // viernes 27-11-2026
  assert.equal(diaLaborable(viernes, 1).getDay(), 1); // lunes
  const r = procesarContactos([
    { nombre: "Ana", empresa: "Acme", email: "ana@acme.es", telefono: "600111222", mensaje: "presupuesto" },
    { nombre: "Ana", empresa: "Acme", email: "ana@acme.es" },
    { nombre: "Luis", email: "luis@gmail.com" },
    { nombre: "", empresa: "", email: "x@x.es" },
    { nombre: "Eva", email: "eva@@mal" },
  ], SEMILLAS.crm, { desde: viernes });
  assert.equal(r[0].prioridad, "alta");
  assert.equal(r[0].accion.tipo, "llamar");
  assert.equal(new Date(r[0].accion.fecha).getDay(), 1);
  assert.deepEqual(r[1].duplicado, { id: null, fila: null, motivo: "email" });
  assert.equal(r[1].accion, undefined);
  assert.equal(r[2].accion.tipo, "email");
  assert.notEqual(r[0].accion.comercial, r[2].accion.comercial);
  assert.deepEqual([r[3].problema, r[4].problema], ["sinNombre", "emailMal"]);
  assert.equal(iniciales("Laura Gómez"), "LG");
  const [soloTel] = procesarContactos([{ nombre: "Ana", telefono: "600 000 999" }], [], { desde: viernes });
  assert.deepEqual([soloTel.prioridad, soloTel.accion.tipo, soloTel.canal], ["baja", "llamar", "whatsapp"]);
});
