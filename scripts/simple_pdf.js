const PDFDocument = require('pdfkit');
const fs = require('node:fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('report.pdf'));

doc.text('Hello World!');
doc.end(); 