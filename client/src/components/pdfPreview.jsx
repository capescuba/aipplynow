import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from './pdfToolbar';
import ResumeParser from './resumeParser';
import AIAnalysisOverlay from './AIAnalysisOverlay';
import { tintPdfBackground } from '../libs/pdfUtils';
import { useTheme } from '@mui/material/styles';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

function PDFPreview({ file: initialFile, resumeId, onSaveSuccess }) {
  const [file, setLocalFile] = useState(null); // Tinted PDF
  const [originalFile, setOriginalFile] = useState(initialFile); // Original PDF
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.4); // Start at 140% to match actual PDF size (compensating for PDF.js scaling)
  const MIN_SCALE = 0.7;  // Minimum scale adjusted
  const MAX_SCALE = 7.0;  // Maximum scale adjusted
  const SCALE_STEP = 0.1;
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [url, setUrl] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [currentResumeId, setCurrentResumeId] = useState(resumeId);
  const theme = useTheme();

  const containerRef = useRef(null);
  
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - SCALE_STEP, MIN_SCALE));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1.0); // Reset to true 100%
  }, []);

  const handlePrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages || prev, prev + 1));
  }, [numPages]);

  const handleAnalyze = async () => {
    if (!originalFile) {
      setUploadStatus('Please select a resume file first');
      return;
    }

    setLoading(true);
    setUploadStatus('Analyzing resume...');

    try {
      // Use the resumeId prop if available
      let resumeIdToUse = currentResumeId;
      
      // If we don't have a resumeId, we need to upload the resume first
      if (!resumeIdToUse) {
        const formData = new FormData();
        formData.append('resume', originalFile);
        
        const uploadResponse = await fetch('/api/users/me/resumes', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
        
        const uploadData = await uploadResponse.json();
        resumeIdToUse = uploadData.resume_id;
        // Update the resumeId state
        setCurrentResumeId(resumeIdToUse);
      }
      
      // Now analyze the resume with the job description
      const analyzeResponse = await fetch(`/api/users/me/resumes/${resumeIdToUse}/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          job_description: jobDesc || `Job from ${url}`
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || `Analysis failed: ${analyzeResponse.statusText}`);
      }

      const data = await analyzeResponse.json();
      console.log('Analysis response:', JSON.stringify(data, null, 2)); // More detailed logging
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Set the score data directly from the response
      setScoreData(data);
      console.log('Setting score data:', JSON.stringify(data, null, 2)); // Log what we're setting
      setUploadStatus('Analysis complete!');
      
      // Call onSaveSuccess if provided
      if (onSaveSuccess) {
        onSaveSuccess(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setUploadStatus(`Analysis failed: ${error.message}`);
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  };

  // Update file when initialFile changes
  useEffect(() => {
    if (initialFile) {
      setOriginalFile(initialFile);
      tintPdfBackground(initialFile).then((tintedFile) => {
        setLocalFile(tintedFile);
      });
    }
  }, [initialFile]);

  // Update currentResumeId when resumeId prop changes
  useEffect(() => {
    setCurrentResumeId(resumeId);
  }, [resumeId]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
        gap: 2,
        boxSizing: 'border-box',
        position: 'relative',
        p: 2, // Add padding to main container
      }}
    >
      <Box
        sx={{
          position: { md: 'absolute' },
          left: { md: 16 }, // Add left padding
          top: { md: 16 }, // Add top padding
          bottom: { md: 16 }, // Add bottom padding
          width: { xs: '100%', md: 'calc(60% - 24px)' }, // Adjust width to account for padding
          height: { xs: '50vh', md: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <PDFToolbar
          currentPage={pageNumber}
          numPages={numPages}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          zoomLevel={scale / 1.4} // Adjust displayed zoom level to show true scale
        />
        <Box
          ref={containerRef}
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#ffffff',
            '& .react-pdf__Document': {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              minWidth: 'min-content',
              paddingLeft: 2, // Add padding to prevent left cut-off
              paddingRight: 2, // Add padding to prevent right cut-off
              boxSizing: 'border-box',
            },
            '& .react-pdf__Page': {
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 0 10px rgba(255, 255, 255, 0.1)'
                : '0 0 10px rgba(0, 0, 0, 0.1)',
              borderRadius: 1,
              bgcolor: '#ffffff',
              margin: '0 auto', // Center the page
              '& canvas': {
                maxWidth: 'none !important',
                height: 'auto !important',
                display: 'block', // Prevent inline spacing issues
              }
            },
          }}
        >
          {file ? (
            <>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
              {loading && <AIAnalysisOverlay />}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No PDF file selected
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          position: { md: 'absolute' },
          right: { md: 16 }, // Add right padding
          top: { md: 16 }, // Add top padding
          bottom: { md: 16 }, // Add bottom padding
          width: { xs: '100%', md: 'calc(40% - 24px)' }, // Adjust width to account for padding
          height: { xs: '50vh', md: 'auto' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
          }}
        >
          <ResumeParser
            jobDesc={jobDesc}
            setJobDesc={setJobDesc}
            url={url}
            setUrl={setUrl}
            onAnalyze={handleAnalyze}
            loading={loading}
            uploadStatus={uploadStatus}
            scoreData={scoreData}
            currentResumeId={currentResumeId}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default PDFPreview;