import fs from 'fs';
import path from 'path';

// Use pdf-parse's internal pdf.js library or parse PDF annotations from buffer
async function extractPdfAnnotations() {
  const pdfPath = path.resolve(__dirname, '../../../Harshil_Awasthi_Resume.pdf');
  const buffer = fs.readFileSync(pdfPath);
  
  // PDFjs / pdf-parse page render callback with annotations
  const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

  const doc = await PDFJS.getDocument({ data: new Uint8Array(buffer) }).promise;
  console.log(`PDF loaded. Total pages: ${doc.numPages}`);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const annotations = await page.getAnnotations();
    console.log(`=== PAGE ${i} ANNOTATIONS (${annotations.length}) ===`);
    
    annotations.forEach((ann: any, idx: number) => {
      console.log(`Annotation ${idx + 1}:`, {
        subtype: ann.subtype,
        url: ann.url,
        unsafeUrl: ann.unsafeUrl,
        rect: ann.rect,
      });
    });
  }
}

extractPdfAnnotations().catch(console.error);
