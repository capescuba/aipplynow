import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from './pdfToolbar';
import ResumeParser from './resumeParser';
import AIAnalysisOverlay from './AIAnalysisOverlay';
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
  const resizeTimeoutRef = useRef(null);
  const initialScaleRef = useRef(null);
  const MIN_SCALE = 0.25; // Minimum zoom level
  const MAX_SCALE = 5.0;  // Maximum zoom level
  const SCALE_STEP = 0.1; // More granular step size for smoother zooming
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [url, setUrl] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [currentResumeId, setCurrentResumeId] = useState(resumeId);

  // Modify the resize observer to be more stable and only update width on significant changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        
        // Only update if the width change is significant (more than 20px)
        if (Math.abs(newWidth - (containerWidth || 0)) > 20) {
          // Clear any existing timeout
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          
          // Set a new timeout to update the width after a delay
          resizeTimeoutRef.current = setTimeout(() => {
            setContainerWidth(newWidth);
          }, 250);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [containerWidth]);

  // Calculate initial scale only once when PDF is first loaded
  useEffect(() => {
    if (!containerWidth || !file || initialScaleRef.current) return;
    
    // Base width is for a typical resume page (8.5" x 11" at 96 DPI)
    const baseWidth = 816; // 8.5 inches * 96 DPI
    const availableWidth = containerWidth - 24;
    const idealScale = (availableWidth / baseWidth) * 1.8;
    
    // Clamp the scale between MIN_SCALE and MAX_SCALE
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, idealScale));
    setScale(newScale);
    initialScaleRef.current = newScale; // Store the initial scale
  }, [containerWidth, file]);

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

  // Update file when initialFile changes
  useEffect(() => {
    if (initialFile) {
      setOriginalFile(initialFile);
      tintPdfBackground(initialFile).then((tintedFile) => {
        setLocalFile(tintedFile);
        // Reset the initial scale ref when loading a new file
        initialScaleRef.current = null;
      });
    }
  }, [initialFile]);

  // Update currentResumeId when resumeId prop changes
  useEffect(() => {
    setCurrentResumeId(resumeId);
  }, [resumeId]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - SCALE_STEP, MIN_SCALE));
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!containerWidth || !initialScaleRef.current) return;
    setScale(initialScaleRef.current);
  }, [containerWidth]);

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
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: { xs: '1 1 auto', md: '1 1 60%' },
          height: { xs: '50vh', md: '100%' },
          overflow: 'hidden',
          minWidth: 0,
          boxSizing: 'border-box',
          position: 'relative',
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
          zoomLevel={scale}
        />
        <Box
          ref={containerRef}
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 1,
            bgcolor: 'background.paper',
            position: 'relative',
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
                  width={containerWidth ? containerWidth * 0.95 : undefined}
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
          flex: { xs: '1 1 auto', md: '1 1 40%' },
          height: { xs: '50vh', md: '100%' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          maxWidth: { md: '40%' },
          boxSizing: 'border-box',
          position: 'relative',
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