const fs = require('fs');
const path = require('path');

// Create the pdfjs directory in public if it doesn't exist
const publicDir = path.join(__dirname, 'public', 'pdfjs');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy the worker file from node_modules to public directory
const sourceFile = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destFile = path.join(publicDir, 'pdf.worker.min.js');

try {
  fs.copyFileSync(sourceFile, destFile);
  console.log('Successfully copied PDF.js worker file to public directory');
} catch (err) {
  console.error('Error copying PDF.js worker file:', err);
  process.exit(1);
} 