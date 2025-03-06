import React, { useState } from 'react';
import { Button, Container, Stack, Typography, CircularProgress, TextareaAutosize, Box, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search'; // Magnifying glass icon

// Set workerSrc for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFPreview() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // For feedback
  const [jobDesc, setJobDesc] = useState(''); // State for job description
  const [scoreData, setScoreData] = useState(null); // State for score breakdown and suggestions
  const [zoomLevel, setZoomLevel] = useState(1.0); // State for PDF zoom level (1.0 = 100%)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus(null); // Reset status
      setScoreData(null); // Reset score data
      setZoomLevel(1.0); // Reset zoom level
      previewPDF(selectedFile); // Preview immediately
    } else {
      setFile(null);
      setUploadStatus('Please upload a valid PDF file.');
    }
  };

  const handleJobDescChange = (event) => {
    setJobDesc(event.target.value);
  };

  const previewPDF = (pdfFile) => {
    setFile(pdfFile);
    setNumPages(null); // Reset pages for new file
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.0)); // Cap at 300%
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5)); // Cap at 50%
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('No file selected for upload.');
      return;
    }

    if (!jobDesc.trim()) {
      setUploadStatus('Please enter a job description.');
      return;
    }

    setLoading(true);
    setUploadStatus(null);
    setScoreData(null); // Reset score data before new upload

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_desc', jobDesc); // Use the dynamic job description

    try {
      const response = await axios.post('/resume/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const atsScore = response.data.ats_score;
      const scoreBreakdown = response.data.score_breakdown;
      const suggestions = response.data.improvement_suggestions;

      setUploadStatus(`Upload successful! ATS Score: ${atsScore}`);
      setScoreData({ breakdown: scoreBreakdown, suggestions });
      console.log('Server response:', response.data);
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.response ? error.response.data.error : error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic icon size based on PDF width
  const baseWidth = 300; // Base width of PDF page
  const iconSize = Math.max(16, Math.min(24, baseWidth * zoomLevel * 0.05)); // Scale icon size with zoom, capped at 16–24px

  return (
    <Container maxWidth="lg" sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 2 }}>
      <Stack direction="column" spacing={2} sx={{ flex: 1, maxWidth: '50%' }}>
        {file && (
          <div style={{ height: '60vh', overflowY: 'scroll', border: '1px solid #ccc' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, bgcolor: '#f5f5f5', minHeight: '40px' }}>
              <Tooltip title="Zoom out">
                <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5} aria-label="Zoom out" sx={{ p: 0.5 }}>
                  <SearchIcon sx={{ fontSize: iconSize }} />
                  <Typography component="span" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: Math.max(10, iconSize * 0.5), color: 'black' }}>-</Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom in">
                <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3.0} aria-label="Zoom in" sx={{ p: 0.5 }}>
                  <SearchIcon sx={{ fontSize: iconSize }} />
                  <Typography component="span" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: Math.max(10, iconSize * 0.5), color: 'black' }}>+</Typography>
                </IconButton>
              </Tooltip>
            </Stack>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => setUploadStatus(`Error loading PDF: ${error.message}`)}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={300 * zoomLevel} // Adjust width based on zoom level
                  height={600 * zoomLevel} // Adjust height based on zoom level
                  renderTextLayer={false} // Disable text layer for simplicity
                  renderAnnotationLayer={false} // Disable annotation layer for simplicity
                />
              ))}
            </Document>
          </div>
        )}
      </Stack>
      <Stack direction="column" alignItems="center" spacing={2} sx={{ flex: 1, maxWidth: '50%', height: '60vh' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <label htmlFor="upload-pdf">
            <Button
              variant="contained"
              component="span"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Uploading...' : 'Upload PDF'}
            </Button>
            <input
              id="upload-pdf"
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileChange}
            />
          </label>
          <Button
            variant="outlined"
            onClick={handleUpload}
            disabled={!file || loading || !jobDesc.trim()}
          >
            Parse and Upload
          </Button>
        </Stack>
        <TextareaAutosize
          minRows={20} // Increased rows to fill the height
          placeholder="Enter job description..."
          value={jobDesc}
          onChange={handleJobDescChange}
          style={{ width: '100%', maxWidth: '100%', padding: '10px', margin: '10px 0', flex: 1, resize: 'none' }}
        />
        {uploadStatus && (
          <Typography color={uploadStatus.includes('failed') ? 'error' : 'success'}>
            {uploadStatus}
          </Typography>
        )}
        {scoreData && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>Score Breakdown</Typography>
            <List dense>
              {Object.entries(scoreData.breakdown).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toFixed(1)}%`}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Improvement Suggestions</Typography>
            <List dense>
              {scoreData.suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default PDFPreview;