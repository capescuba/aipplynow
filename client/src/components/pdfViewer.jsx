import React, { useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Stack, Typography } from '@mui/material';
import PDFToolbar from './pdfToolbar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFViewer({
  file,
  numPages,
  setNumPages,
  currentPage,
  setCurrentPage,
  zoomLevel,
  setZoomLevel,
  setUploadStatus,
  originalFile,
  currentResumeId,
}) {
  const pdfContainerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('Document loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  const handleNextPage = () => {
    console.log('handleNextPage called', { currentPage, numPages });
    if (currentPage < numPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      console.log('Set currentPage to', nextPage);
      const pageElement = document.getElementById(`page_${nextPage}`);
      if (pageElement) {
        console.log('Scrolling to page', nextPage);
        pageElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log('Page element not found for page', nextPage);
      }
    } else {
      console.log('Cannot go to next page - at the end');
    }
  };
  const handlePrevPage = () => {
    console.log('handlePrevPage called', { currentPage, numPages });
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      console.log('Set currentPage to', prevPage);
      const pageElement = document.getElementById(`page_${prevPage}`);
      if (pageElement) {
        console.log('Scrolling to page', prevPage);
        pageElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log('Page element not found for page', prevPage);
      }
    } else {
      console.log('Cannot go to previous page - at the start');
    }
  };

  // Debug effect to confirm state updates
  useEffect(() => {
    console.log('currentPage updated to', currentPage);
  }, [currentPage]);

  const containerWidth = pdfContainerRef.current?.offsetWidth || 300;

  return (
    <Stack direction="column" spacing={2} sx={{ flex: 1, maxWidth: '50%' }}>
      {file ? (
        <Stack direction="column" sx={{ height: '60vh' }}>
          <PDFToolbar
            currentPage={currentPage}
            numPages={numPages}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoomLevel={zoomLevel}
          />
          <div
            ref={pdfContainerRef}
            style={{
              flex: 1,
              overflowY: 'scroll',
              border: '1px solid #ccc',
              // Temporarily disable scrollSnapType to test scrolling
              // scrollSnapType: 'y mandatory',
            }}
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => setUploadStatus(`Error loading PDF: ${error.message}`)}
            >
              {numPages
                ? Array.from(new Array(numPages), (el, index) => (
                    <div
                      key={`page_${index + 1}`}
                      id={`page_${index + 1}`}
                      style={{ marginBottom: '10px' }} // Removed scrollSnapAlign
                    >
                      <Page
                        pageNumber={index + 1}
                        width={containerWidth * zoomLevel * 0.95}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        canvasBackground="rgba(0, 0, 0, 0)"
                      />
                    </div>
                  ))
                : null}
            </Document>
          </div>
        </Stack>
      ) : (
        <Typography>No PDF selected</Typography>
      )}
    </Stack>
  );
}

export default PDFViewer;