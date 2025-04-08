const https = require('https');
const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const dir = path.join(__dirname, 'public', 'pdfjs');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Download the worker file
const url = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js';
const filePath = path.join(dir, 'pdf.worker.min.js');

console.log(`Downloading PDF.js worker from ${url}...`);

const file = fs.createWriteStream(filePath);
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`PDF.js worker downloaded to ${filePath}`);
  });
}).on('error', (err) => {
  fs.unlink(filePath, () => {}); // Delete the file if there was an error
  console.error(`Error downloading PDF.js worker: ${err.message}`);
}); 