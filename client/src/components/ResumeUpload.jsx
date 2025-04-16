import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';

function ResumeUpload({ onUpload, onError }) {
  console.log('[DEBUG] ResumeUpload component rendering');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('pdf')) {
      onError('Please upload a PDF file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    onUpload(file);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', maxWidth: '400px' }}>
      <input
        type="file"
        id="resume-file-upload"
        accept=".pdf"
        style={{ display: 'none' }}
        data-testid="resume-file-input"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="resume-file-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={isUploading}
          fullWidth
        >
          Select Resume
        </Button>
      </label>

      {isUploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Uploading...</Typography>
        </Box>
      )}
    </Box>
  );
}

export default ResumeUpload; 