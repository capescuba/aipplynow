import { PDFDocument, rgb } from 'pdf-lib';

export const tintPdfBackground = async (inputFile) => {
  try {
    const arrayBuffer = await inputFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.95, 0.95, 0.95), // Light grey
        opacity: 0.3, // 30% opacity
      });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return blob;
  } catch (error) {
    console.error('Error tinting PDF:', error);
    return inputFile; // Fallback to original
  }
};