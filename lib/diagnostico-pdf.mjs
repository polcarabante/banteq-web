import PDFDocument from 'pdfkit';

// PDF privado generado en memoria; sin servicios externos ni archivos temporales del cliente.
const clean = text => String(text ?? '').replace(/[\u2010-\u2015]/g, '-').replace(/→/g, ' -> ').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u20AC\u2018\u2019\u201C\u201D\u2022\u2026]/g, '?');
export function diagnosticPdf(report, {company, reference}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({size:'A4', margins:{top:72,bottom:62,left:52,right:52}, bufferPages:true, info:{Title:clean(report.title),Author:'Banteq Digital',Subject:clean(company)}});
    const chunks=[]; doc.on('data',c=>chunks.push(c));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));
    const width=doc.page.width-104;
    const header=()=>{
      doc.save().fillColor('#166455').font('Helvetica-Bold').fontSize(13).text('BANTEQ',52,31,{lineBreak:false});
      doc.font('Helvetica').fontSize(8).fillColor('#526269').text('DIAGNÓSTICOS DE EMPRESA',147,35,{lineBreak:false});
      doc.moveTo(52,54).lineTo(doc.page.width-52,54).lineWidth(0.6).strokeColor('#CEE0DB').stroke();doc.restore();doc.x=52;doc.y=72;
    };
    header(); doc.on('pageAdded',header);
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#153B34').text(clean(report.title),52,82,{width,lineGap:3});
    doc.moveDown(0.6).font('Helvetica').fontSize(12).fillColor('#36434B').text(clean(company),{width,lineGap:3});
    doc.moveDown(0.7).fontSize(8).fillColor('#526269').text(clean(reference),{width});
    doc.moveDown(0.7).font('Helvetica-Bold').fontSize(9).fillColor('#735421').text('BORRADOR - Pendiente de revisión de Banteq',{width});
    doc.moveDown(1.3);
    for(const section of report.sections) {
      const heading=clean(section.title);
      doc.font('Helvetica-Bold').fontSize(13);
      const needed=doc.heightOfString(heading,{width,lineGap:2})+52;
      if(doc.y+needed>doc.page.height-62)doc.addPage();
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#166455').text(heading,52,doc.y,{width,lineGap:2});
      doc.moveDown(0.45);
      for(const paragraph of section.body) {
        doc.font('Helvetica').fontSize(10).fillColor('#273238').text(clean(paragraph),52,doc.y,{width,lineGap:3,paragraphGap:0});
        doc.moveDown(0.65);
      }
      doc.moveDown(0.45);
    }
    const range=doc.bufferedPageRange();
    for(let i=range.start;i<range.start+range.count;i++) {
      doc.switchToPage(i);doc.save();
      doc.moveTo(52,doc.page.height-44).lineTo(doc.page.width-52,doc.page.height-44).lineWidth(0.5).strokeColor('#CEE0DB').stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#526269').text('Confidencial - Uso interno de Banteq',52,doc.page.height-32,{lineBreak:false});
      doc.text(`${i+1} / ${range.count}`,doc.page.width-85,doc.page.height-32,{lineBreak:false});doc.restore();
    }
    doc.end();
  });
}
