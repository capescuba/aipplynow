import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTheme } from '@mui/material/styles';
import PDFToolbar from './pdfToolbar';
import ResumeParser from './resumeParser';
import { tintPdfBackground } from '../libs/pdfUtils';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

function PDFPreview({ file: initialFile, resumeId, onSaveSuccess }) {
  const [file, setLocalFile] = useState(null); // Tinted PDF
  const [originalFile, setOriginalFile] = useState(initialFile); // Original PDF
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(null);
  const containerRef = useRef(null);
  const MIN_SCALE = 0.25; // Minimum zoom level
  const MAX_SCALE = 5.0;  // Maximum zoom level
  const SCALE_STEP = 0.1; // More granular step size for smoother zooming
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [url, setUrl] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const theme = useTheme();

  // Add resize observer to track container width
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        setContainerWidth(newWidth);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Listen for job description from Chrome extension
  useEffect(() => {
    let isSubscribed = true;
    const handleJobDescriptionEvent = (event) => {
      if (!isSubscribed) return;
      
      // Handle CustomEvent
      if (event.detail && event.detail.text) {
        setJobDesc(event.detail.text);
        if (event.detail.url) {
          setUrl(event.detail.url);
        }
        return;
      }
      
      // Handle postMessage
      if (event.data && event.data.type === 'AIpplyNowJobDescription') {
        setJobDesc(event.data.text);
        if (event.data.url) {
          setUrl(event.data.url);
        }
        return;
      }
    };

    // Set up event listeners
    document.addEventListener('AIpplyNowJobDescription', handleJobDescriptionEvent);
    window.addEventListener('message', handleJobDescriptionEvent);
    
    // Check window property once on mount
    if (window.AIpplyNowData) {
      setJobDesc(window.AIpplyNowData.text);
      if (window.AIpplyNowData.url) {
        setUrl(window.AIpplyNowData.url);
      }
      window.AIpplyNowData = null;
    }

    return () => {
      isSubscribed = false;
      document.removeEventListener('AIpplyNowJobDescription', handleJobDescriptionEvent);
      window.removeEventListener('message', handleJobDescriptionEvent);
    };
  }, []); // Empty dependency array since we only want to set this up once

  // Auto-adjust scale based on container width
  useEffect(() => {
    if (!containerWidth) return;
    
    // Base width is for a typical resume page (8.5" x 11" at 96 DPI)
    const baseWidth = 816; // 8.5 inches * 96 DPI
    const availableWidth = containerWidth - 48; // Account for padding
    const idealScale = availableWidth / baseWidth;
    
    // Clamp the scale between MIN_SCALE and MAX_SCALE
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, idealScale));
    setScale(newScale);
  }, [containerWidth]);

  useEffect(() => {
    console.log('PDFPreview - initialFile changed:', initialFile);
    
    if (initialFile) {
      console.log('PDFPreview - Processing file:', initialFile.name, initialFile.type);
      setLoading(true);
      setOriginalFile(initialFile);
      
      // First try to use the file directly without tinting
      setLocalFile(initialFile);
      console.log('PDFPreview - Set local file to initial file');
      
      // Then attempt to tint it in the background
      tintPdfBackground(initialFile)
        .then((tintedFile) => {
          console.log('PDFPreview - PDF tinted successfully');
          setLocalFile(tintedFile);
        })
        .catch((error) => {
          console.error('PDFPreview - Error tinting PDF:', error);
          // Keep using the original file if tinting fails
          setLocalFile(initialFile);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('PDFPreview - No initial file provided');
      setLocalFile(null);
      setOriginalFile(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
      setLoading(false);
      setScoreData(null);
      setUploadStatus(null);
    }
  }, [initialFile]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDFPreview - Document loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDFPreview - Error loading document:', error);
    setUploadStatus(`Error loading PDF: ${error.message}`);
    setLoading(false);
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handleZoomIn = () => {
    if (scale < MAX_SCALE) {
      setScale(Math.min(MAX_SCALE, scale + SCALE_STEP));
    }
  };

  const handleZoomOut = () => {
    if (scale > MIN_SCALE) {
      setScale(Math.max(MIN_SCALE, scale - SCALE_STEP));
    }
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleWheel = (event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = -Math.sign(event.deltaY) * SCALE_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLocalFile(file);
      setOriginalFile(file);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
    }
  };

  const handleJobDescChange = (event) => {
    setJobDesc(event.target.value);
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleAnalyze = async () => {
    if (!originalFile) {
      setUploadStatus('Please select a PDF file first.');
      return;
    }

    if (!jobDesc && !url) {
      setUploadStatus('Please provide a job description or URL.');
      return;
    }

    setLoading(true);
    setUploadStatus('Analyzing resume...');
    setScoreData(null);

    try {
      const formData = new FormData();
      formData.append('resume', originalFile);
      if (jobDesc) formData.append('jobDescription', jobDesc);
      if (url) formData.append('jobUrl', url);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setScoreData(data);
      setUploadStatus('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      setUploadStatus(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default,
        gap: 2,
        boxSizing: 'border-box',
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: { xs: '1 1 auto', md: '1 1 60%' },
          height: { xs: '50vh', md: '100%' },
          overflow: 'hidden',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {file && (
            <PDFToolbar
              currentPage={pageNumber}
              numPages={numPages}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              zoomLevel={scale}
            />
          )}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              boxSizing: 'border-box',
              p: 3,
            }}
            onWheel={handleWheel}
          >
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
                <Typography sx={{ mt: 2, color: theme.palette.text.primary }}>
                  Loading PDF...
                </Typography>
              </Box>
            ) : file ? (
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <CircularProgress />
                    <Typography sx={{ mt: 2, color: theme.palette.text.primary }}>
                      Loading PDF...
                    </Typography>
                  </Box>
                }
                error={
                  <Typography sx={{ color: theme.palette.error.main }}>
                    Error loading PDF. Please try again.
                  </Typography>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            ) : (
              <Typography sx={{ color: theme.palette.text.secondary }}>
                No PDF selected. Please select a resume from the sidebar.
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '1 1 40%' },
          height: { xs: '50vh', md: '100%' },
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {file && (
          <ResumeParser
            file={originalFile}
            jobDesc={jobDesc}
            setJobDesc={setJobDesc}
            loading={loading}
            currentResumeId={resumeId}
            uploadStatus={uploadStatus}
            scoreData={scoreData}
            onParse={handleAnalyze}
          />
        )}
      </Box>
    </Box>
  );
}

export default PDFPreview;