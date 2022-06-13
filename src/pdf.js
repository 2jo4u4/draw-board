const pdfjs = require("pdfjs-dist");
const worker = require("pdfjs-dist/build/pdf.worker.entry");
pdfjs.GlobalWorkerOptions.workerSrc = worker;
