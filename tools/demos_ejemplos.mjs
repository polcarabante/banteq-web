// Genera los documentos de ejemplo de las demostraciones interactivas en
// assets-banteq/demos-interactivas/ejemplos/ (se publican en /demos/ejemplos/). Datos inventados,
// con los proveedores, NIF y pedidos del ERP de la demostración (lib/demos-erp-datos.mjs).
//
//   factura-correcta.pdf   Suministros Besòs: cuadra y coincide con el pedido PC-124.
//   factura-con-error.pdf  Aceros Vallès: el total no coincide con el pedido PC-118 (error a propósito).
//   factura-facturae.xml   Recambios Terrassa en Facturae 3.2.2: coincide con el pedido PC-126.
//   manual-prensa-P-12.pdf (y en catalán e inglés) Manual de mantenimiento para el asistente de IA
//                          (texto en tools/demos_manual_p12.mjs).
//   contactos-ejemplo.csv/.xlsx (y en catalán e inglés) Contactos para el CRM (tools/demos_contactos.mjs).
//   ventas-ejemplo.xlsx/.csv y exportacion-erp.csv (y en catalán e inglés) Ventas para los informes
//                          (tools/demos_ventas.mjs).
//
// Uso: node tools/demos_ejemplos.mjs   (los archivos generados se guardan en git)
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { EMPRESA_DEMO, PROVEEDORES } from "../lib/demos-erp-datos.mjs";
import { MANUAL } from "./demos_manual_p12.mjs";
import { CONTACTOS } from "./demos_contactos.mjs";
import { ARCHIVOS, ventas } from "./demos_ventas.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const DESTINO = fileURLToPath(new URL("../assets-banteq/demos-interactivas/ejemplos/", import.meta.url));

const euros = (n) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }).format(n) + " €";
const FECHA = new Date("2026-11-25T09:00:00Z"); // fija: los PDF no cambian si no cambia su contenido
const r2 = (n) => Math.round(n * 100) / 100;

const FACTURAS = [
  {
    archivo: "factura-correcta.pdf",
    proveedor: { ...PROVEEDORES.besos, direccion: ["C/ de la Indústria, 42", "08930 Sant Adrià de Besòs (Barcelona)"], contacto: "administracion@suministrosbesos.es" },
    numero: "SB-26-0457", fecha: "18/11/2026", vencimiento: "18/12/2026", pedido: "PC-124",
    lineas: [
      ["Rodamiento rígido de bolas 6204-2RS", 40, 4.85],
      ["Correa trapezoidal SPZ 1250", 12, 18.5],
      ["Aceite hidráulico HLP 46 · garrafa 20 l", 4, 46],
    ],
  },
  {
    archivo: "factura-con-error.pdf",
    proveedor: { ...PROVEEDORES.aceros, direccion: ["Pol. Ind. Can Roqueta, nave 7", "08202 Sabadell (Barcelona)"], contacto: "facturacion@acerosvalles.es" },
    numero: "AV-2026/1203", fecha: "20/11/2026", vencimiento: "20/12/2026", pedido: "PC-118",
    lineas: [
      ["Chapa de acero S235 2 mm · 1000 × 2000", 12, 61.2],
      ["Pletina laminada 40 × 5 · barra 6 m", 30, 12.57],
    ],
  },
];

function pdf(f) {
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Factura ${f.numero}`, Author: f.proveedor.nombre, Producer: "Banteq · documento de ejemplo", CreationDate: FECHA } });
  const fin = new Promise((ok, ko) => {
    const salida = createWriteStream(DESTINO + f.archivo);
    salida.on("finish", ok).on("error", ko);
    doc.pipe(salida);
  });
  const tinta = "#1a1a1a";
  const gris = "#666666";
  const base = r2(f.lineas.reduce((s, [, c, p]) => s + c * p, 0));
  const iva = r2(base * 0.21);
  const total = r2(base + iva);

  // Cabecera: proveedor a la izquierda, datos de la factura a la derecha.
  doc.fillColor(tinta).font("Helvetica-Bold").fontSize(17).text(f.proveedor.nombre, 50, 52);
  doc.font("Helvetica").fontSize(9.5).fillColor(gris);
  doc.text(f.proveedor.direccion[0], 50, 76).text(f.proveedor.direccion[1], 50, 89).text(`NIF: ${f.proveedor.nif}`, 50, 102).text(f.proveedor.contacto, 50, 115);
  doc.fillColor(tinta).font("Helvetica-Bold").fontSize(22).text("FACTURA", 380, 50, { width: 165, align: "right" });
  doc.font("Helvetica").fontSize(10);
  const meta = [["Nº factura:", f.numero], ["Fecha:", f.fecha], ["Vencimiento:", f.vencimiento], ["Su pedido:", f.pedido]];
  meta.forEach(([k, v], i) => {
    doc.fillColor(gris).text(k, 380, 84 + i * 15, { width: 75 });
    doc.fillColor(tinta).text(v, 455, 84 + i * 15, { width: 90, align: "right" });
  });

  // Cliente
  doc.roundedRect(50, 160, 260, 70, 6).fillColor("#f4f4f6").fill();
  doc.fillColor(gris).fontSize(8.5).text("CLIENTE", 64, 170);
  doc.fillColor(tinta).font("Helvetica-Bold").fontSize(11).text(EMPRESA_DEMO.nombre, 64, 184);
  doc.font("Helvetica").fontSize(9.5).fillColor(gris).text(`NIF: ${EMPRESA_DEMO.nif}`, 64, 199).text("C/ del Vallès, 118 · 08130 Santa Perpètua de Mogoda", 64, 212);

  // Líneas
  let y = 262;
  const col = { desc: 50, cant: 330, precio: 390, imp: 465 };
  doc.fillColor(gris).fontSize(8.5).font("Helvetica-Bold");
  doc.text("DESCRIPCIÓN", col.desc, y).text("CANT.", col.cant, y, { width: 45, align: "right" }).text("PRECIO", col.precio, y, { width: 65, align: "right" }).text("IMPORTE", col.imp, y, { width: 80, align: "right" });
  y += 16;
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.6).strokeColor("#dddddd").stroke();
  doc.font("Helvetica").fontSize(10).fillColor(tinta);
  for (const [d, c, p] of f.lineas) {
    y += 10;
    doc.text(d, col.desc, y, { width: 270 }).text(String(c), col.cant, y, { width: 45, align: "right" })
      .text(euros(p), col.precio, y, { width: 65, align: "right" }).text(euros(r2(c * p)), col.imp, y, { width: 80, align: "right" });
    y += 16;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#eeeeee").stroke();
  }

  // Totales
  y += 26;
  const filas = [["Base imponible", euros(base)], ["IVA 21 %", euros(iva)]];
  doc.fontSize(10);
  for (const [k, v] of filas) {
    doc.fillColor(gris).text(k, 340, y, { width: 120 }).fillColor(tinta).text(v, 455, y, { width: 90, align: "right" });
    y += 17;
  }
  doc.moveTo(340, y).lineTo(545, y).strokeColor("#cccccc").stroke();
  y += 9;
  doc.font("Helvetica-Bold").fontSize(12).text("Total factura", 340, y, { width: 120 }).text(euros(total), 435, y, { width: 110, align: "right" });

  // Pie
  doc.font("Helvetica").fontSize(8.5).fillColor(gris)
    .text("Forma de pago: transferencia bancaria a 30 días.", 50, 720)
    .text("Documento de ejemplo generado para la demostración de Banteq. Empresa y datos ficticios.", 50, 733);
  doc.end();
  return fin.then(() => ({ archivo: f.archivo, base, iva, total }));
}

function facturae() {
  const p = PROVEEDORES.terrassa;
  const lineas = [["Filtro de aceite hidráulico HF-35", 6, 24.5], ["Juego de juntas tóricas NBR (caja 225 u.)", 3, 71]];
  const base = r2(lineas.reduce((s, [, c, pr]) => s + c * pr, 0));
  const iva = r2(base * 0.21);
  const total = r2(base + iva);
  const f2 = (n) => n.toFixed(2);
  const items = lineas.map(([d, c, pr]) => `
      <InvoiceLine>
        <ReceiverTransactionReference>PC-126</ReceiverTransactionReference>
        <ItemDescription>${d}</ItemDescription>
        <Quantity>${c}</Quantity>
        <UnitOfMeasure>01</UnitOfMeasure>
        <UnitPriceWithoutTax>${pr.toFixed(6)}</UnitPriceWithoutTax>
        <TotalCost>${f2(c * pr)}</TotalCost>
        <GrossAmount>${f2(c * pr)}</GrossAmount>
        <TaxesOutputs><Tax><TaxTypeCode>01</TaxTypeCode><TaxRate>21.00</TaxRate><TaxableBase><TotalAmount>${f2(c * pr)}</TotalAmount></TaxableBase><TaxAmount><TotalAmount>${f2(r2(c * pr * 0.21))}</TotalAmount></TaxAmount></Tax></TaxesOutputs>
      </InvoiceLine>`).join("");
  const parte = (nif, nombre, calle, cp, ciudad, provincia) => `
      <TaxIdentification><PersonTypeCode>J</PersonTypeCode><ResidenceTypeCode>R</ResidenceTypeCode><TaxIdentificationNumber>ES${nif}</TaxIdentificationNumber></TaxIdentification>
      <LegalEntity>
        <CorporateName>${nombre}</CorporateName>
        <AddressInSpain><Address>${calle}</Address><PostCode>${cp}</PostCode><Town>${ciudad}</Town><Province>${provincia}</Province><CountryCode>ESP</CountryCode></AddressInSpain>
      </LegalEntity>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Documento de ejemplo para la demostración de Banteq. Empresa y datos ficticios; sin firma electrónica. -->
<fe:Facturae xmlns:fe="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <Batch><BatchIdentifier>ES${p.nif}RT-2026-0388</BatchIdentifier><InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount><TotalAmount>${f2(total)}</TotalAmount></TotalInvoicesAmount>
      <TotalOutstandingAmount><TotalAmount>${f2(total)}</TotalAmount></TotalOutstandingAmount>
      <TotalExecutableAmount><TotalAmount>${f2(total)}</TotalAmount></TotalExecutableAmount>
      <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode></Batch>
  </FileHeader>
  <Parties>
    <SellerParty>${parte(p.nif, p.nombre, "Carrer de la Mecànica, 15", "08223", "Terrassa", "Barcelona")}
    </SellerParty>
    <BuyerParty>${parte(EMPRESA_DEMO.nif, EMPRESA_DEMO.nombre, "C/ del Vallès, 118", "08130", "Santa Perpètua de Mogoda", "Barcelona")}
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader><InvoiceNumber>0388</InvoiceNumber><InvoiceSeriesCode>RT-2026</InvoiceSeriesCode><InvoiceDocumentType>FC</InvoiceDocumentType><InvoiceClass>OO</InvoiceClass></InvoiceHeader>
      <InvoiceIssueData><IssueDate>2026-11-19</IssueDate><InvoiceCurrencyCode>EUR</InvoiceCurrencyCode><TaxCurrencyCode>EUR</TaxCurrencyCode><LanguageName>es</LanguageName></InvoiceIssueData>
      <TaxesOutputs><Tax><TaxTypeCode>01</TaxTypeCode><TaxRate>21.00</TaxRate><TaxableBase><TotalAmount>${f2(base)}</TotalAmount></TaxableBase><TaxAmount><TotalAmount>${f2(iva)}</TotalAmount></TaxAmount></Tax></TaxesOutputs>
      <InvoiceTotals>
        <TotalGrossAmount>${f2(base)}</TotalGrossAmount>
        <TotalGrossAmountBeforeTaxes>${f2(base)}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${f2(iva)}</TotalTaxOutputs>
        <TotalTaxesWithheld>0.00</TotalTaxesWithheld>
        <InvoiceTotal>${f2(total)}</InvoiceTotal>
        <TotalOutstandingAmount>${f2(total)}</TotalOutstandingAmount>
        <TotalExecutableAmount>${f2(total)}</TotalExecutableAmount>
      </InvoiceTotals>
      <Items>${items}
      </Items>
      <PaymentDetails><Installment><InstallmentDueDate>2026-12-19</InstallmentDueDate><InstallmentAmount>${f2(total)}</InstallmentAmount><PaymentMeans>04</PaymentMeans></Installment></PaymentDetails>
    </Invoice>
  </Invoices>
</fe:Facturae>
`;
  return writeFile(DESTINO + "factura-facturae.xml", xml).then(() => ({ archivo: "factura-facturae.xml", base, iva, total }));
}

// Manual: títulos más grandes y en negrita (el asistente los reconoce por el tamaño y la numeración),
// varias páginas para que la cita lleve número de página. Sin pie de página.
function manual(m) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 64, bottom: 64, left: 64, right: 64 }, info: { Title: m.titulo, Author: "Talleres Riera S.L.", Producer: "Banteq · documento de ejemplo", CreationDate: FECHA } });
  const fin = new Promise((ok, ko) => {
    const salida = createWriteStream(DESTINO + m.archivo);
    salida.on("finish", ok).on("error", ko);
    doc.pipe(salida);
  });
  const ancho = 595.28 - 128;
  doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(20).text(m.titulo, { width: ancho });
  doc.moveDown(0.3).font("Helvetica").fontSize(10).fillColor("#666666").text(m.subtitulo, { width: ancho });
  doc.moveDown(1.2);
  for (const [capitulo, apartados] of m.capitulos) {
    if (doc.y > 690) doc.addPage();
    doc.moveDown(0.6).fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(15).text(capitulo, { width: ancho });
    doc.moveDown(0.3);
    for (const [apartado, parrafos] of apartados) {
      if (doc.y > 700) doc.addPage();
      doc.moveDown(0.5).font("Helvetica-Bold").fontSize(12).fillColor("#1a1a1a").text(apartado, { width: ancho });
      doc.moveDown(0.25).font("Helvetica").fontSize(10.5).fillColor("#2a2a2a");
      for (const p of parrafos) {
        const paso = /^\d\.\s/.test(p);
        doc.text(p, paso ? 82 : 64, doc.y, { width: paso ? ancho - 18 : ancho, lineGap: 2.5 });
        doc.moveDown(0.35);
      }
    }
  }
  doc.end();
  return fin.then(() => ({ archivo: m.archivo, base: "", iva: "", total: "" }));
}

await mkdir(DESTINO, { recursive: true });
for (const m of Object.values(MANUAL)) await manual(m);

// Contactos: CSV con BOM (el Excel en castellano lo abre bien con punto y coma) y un .xlsx hecho con
// la misma SheetJS que usa la web.
const XLSX = (() => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("../assets-banteq/vendor/sheetjs-0.20.3/xlsx.mini.min.js", import.meta.url), "utf8"), ctx);
  return ctx.XLSX;
})();
for (const { archivo, sep, filas } of Object.values(CONTACTOS)) {
  const celda = (c) => (/[";,\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
  await writeFile(DESTINO + archivo + ".csv", "\uFEFF" + filas.map((f) => f.map(celda).join(sep)).join("\r\n") + "\r\n");
  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  hoja["!cols"] = [20, 26, 32, 14, 52, 22].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(libro, hoja, "Contactos");
  libro.Props = { Title: "Contactos de ejemplo", Author: "Banteq", CreatedDate: FECHA };
  await writeFile(DESTINO + archivo + ".xlsx", Buffer.from(XLSX.write(libro, { type: "array", bookType: "xlsx", compression: true })));
}
for (const r of [...(await Promise.all(FACTURAS.map(pdf))), await facturae()]) console.log(r.archivo, r.base, r.iva, r.total);

// Ventas: el Excel limpio, el CSV «sucio» y la exportación con códigos de ERP.
const csv = (filas) => "\uFEFF" + filas.map((f) => f.map((c) => (/[";\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";")).join("\r\n") + "\r\n";
for (const [idioma, [ventasNombre, erpNombre]] of Object.entries(ARCHIVOS)) {
  const { limpio, sucio, erp } = ventas(idioma);
  const libro = XLSX.utils.book_new();
  // Fechas como número de serie de Excel con formato de fecha (los Date de este script vienen de
  // otro contexto y SheetJS no los reconocería).
  const serie = (f) => (f.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
  const hoja = XLSX.utils.aoa_to_sheet(limpio.map((f, i) => (i ? [Math.floor(serie(f[0])), ...f.slice(1)] : f)));
  for (let i = 2; i <= limpio.length; i++) hoja[`A${i}`].z = "dd/mm/yyyy";
  hoja["!cols"] = [12, 34, 10, 12, 12, 14].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(libro, hoja, idioma === "en" ? "Sales" : idioma === "ca" ? "Vendes" : "Ventas");
  libro.Props = { Title: "Ventas de ejemplo", Author: "Banteq", CreatedDate: FECHA };
  await writeFile(DESTINO + ventasNombre + ".xlsx", Buffer.from(XLSX.write(libro, { type: "array", bookType: "xlsx", compression: true })));
  await writeFile(DESTINO + ventasNombre + ".csv", csv(sucio));
  await writeFile(DESTINO + erpNombre + ".csv", csv(erp));
}
