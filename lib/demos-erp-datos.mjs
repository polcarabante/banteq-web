// Datos del «ERP Banteq» de las demostraciones interactivas: una empresa ficticia, sus proveedores,
// pedidos de compra abiertos y los registros que ya tiene cada pestaña al entrar. Todo inventado
// (mismos nombres que las animaciones de la home); ningún dato es de un cliente real.
// Lo usan el navegador (comun/erp.js, la demo de facturas) y tools/demos_ejemplos.mjs, que genera
// las facturas de ejemplo con estos mismos proveedores, NIF y pedidos.

// La empresa que «usa» el ERP: es el cliente que aparece en las facturas de ejemplo.
export const EMPRESA_DEMO = { nombre: "Talleres Riera S.L.", nif: "B08765430" };

export const PROVEEDORES = {
  aceros: { nombre: "Aceros Vallès S.L.", nif: "B65432189" },
  besos: { nombre: "Suministros Besòs S.L.", nif: "B61982542" },
  terrassa: { nombre: "Recambios Terrassa S.L.", nif: "B67329151" },
  ribas: { nombre: "Transportes Ribas S.L.", nif: "B08127367" },
  marti: { nombre: "Gestoría Martí S.L.", nif: "B64219736" },
};

// Pedidos de compra abiertos contra los que se cruza cada factura.
export const PEDIDOS = [
  { id: "PC-118", nif: PROVEEDORES.aceros.nif, proveedor: PROVEEDORES.aceros.nombre, total: 1284.6 },
  { id: "PC-124", nif: PROVEEDORES.besos.nif, proveedor: PROVEEDORES.besos.nombre, total: 726 },
  { id: "PC-126", nif: PROVEEDORES.terrassa.nif, proveedor: PROVEEDORES.terrassa.nombre, total: 435.6 },
];

// Registros que el ERP ya tiene (no se guardan: lo que añade el visitante va encima).
// Estados y textos se traducen en la página (claves «erp.estado.*»).
export const SEMILLAS = {
  facturas: [
    { id: "F-0412", proveedor: PROVEEDORES.marti.nombre, nif: PROVEEDORES.marti.nif, numero: "GM-2026-311", total: 121, estado: "pagada" },
    { id: "F-0411", proveedor: PROVEEDORES.ribas.nombre, nif: PROVEEDORES.ribas.nif, numero: "TR-2291", total: 412, estado: "pagada" },
    { id: "F-0410", proveedor: PROVEEDORES.aceros.nombre, nif: PROVEEDORES.aceros.nif, numero: "AV-2026/1102", total: 2057, estado: "pagada" },
  ],
  conocimiento: [
    { id: "DOC-0011", nombre: "Normas de seguridad.pdf", secciones: 12, estado: "indexado" },
    { id: "DOC-0010", nombre: "Plan de mantenimiento 2026.xlsx", secciones: 9, estado: "indexado" },
  ],
  // accion.enDias: días laborables desde hoy (las semillas no tienen fecha fija).
  crm: [
    { id: "LEAD-0086", contacto: "Laura Gómez", empresa: "Talleres Gómez", email: "laura@talleresgomez.es", telefono: "", origen: "web", estado: "contactado",
      prioridad: "alta", accion: { tipo: "llamar", comercial: "Marta", enDias: 1 } },
    { id: "LEAD-0085", contacto: "Núria Puig", empresa: "Ferretería Puig", email: "compras@ferreteriapuig.es", telefono: "", origen: "telefono", estado: "propuesta",
      prioridad: "media", accion: { tipo: "email", comercial: "Jordi", enDias: 3 } },
  ],
  informes: [
    { id: "INF-0030", nombre: "Informe semanal", periodo: "S47", estado: "enviado" },
    { id: "INF-0029", nombre: "Informe semanal", periodo: "S46", estado: "enviado" },
  ],
  // Videollamadas de ejemplo (enDias: días hábiles desde hoy). Solo se ven en el ERP: los huecos
  // libres de verdad los da api/reservas.js.
  reservas: [
    { id: "R-1048", nombre: "Marta Soler", enDias: 1, hora: "10:00", estado: "confirmada" },
    { id: "R-1047", nombre: "Pau Ribas", enDias: 1, hora: "16:30", estado: "confirmada" },
  ],
};

// Primer número libre de cada tipo de registro (lo siguiente a las semillas).
export const PRIMER_ID = { facturas: ["F-", 413, 4], conocimiento: ["DOC-", 12, 4], consultas: ["Q-", 231, 4], crm: ["LEAD-", 87, 4], informes: ["INF-", 31, 4], reservas: ["R-", 1049, 4] };
