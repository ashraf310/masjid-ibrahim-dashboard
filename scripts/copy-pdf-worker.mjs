import {copyFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const source=resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destination=resolve('public/pdf.worker.min.mjs');
if(!existsSync(source))throw new Error('PDF.js worker missing. Run npm install first.');
mkdirSync(dirname(destination),{recursive:true});
copyFileSync(source,destination);
console.log('PDF.js worker available at /pdf.worker.min.mjs');
