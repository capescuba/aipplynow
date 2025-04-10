import React, { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress, TextField, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';

function ResumeUpload({ onUploadComplete, existingResumes = [] }) {
  console.log('[DEBUG] ResumeUpload component rendering');
  
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log('[DEBUG] File selected in handleFileChange:', file);
    if (file) {
      // Remove file extension for the name
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      console.log('[DEBUG] Setting selectedFile to:', file.name, 'with base name:', fileName);
      setSelectedFile(file);
      setMetadata(prev => ({
        ...prev,
        name: fileName,
      }));
      setError('');
    }
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    const isDuplicate = existingResumes.some(
      r => r.name === name.trim()
    );
    if (isDuplicate) {
      return 'A resume with this name already exists. Please choose a different name.';
    }
    return '';
  };

  const handleChange = (field) => (event) => {
    const newValue = event.target.value;
    console.log(`[DEBUG] handleChange - ${field} changed to:`, newValue);
    setMetadata((prev) => ({
      ...prev,
      [field]: newValue,
    }));

    // Check for duplicate names and empty names
    if (field === 'name') {
      const validationError = validateName(newValue);
      console.log('[DEBUG] name validation result:', validationError);
      setError(validationError);
    }
  };

  const handleSubmit = async () => {
    console.log('[DEBUG] Submit triggered with metadata:', metadata);
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Check for duplicate names
    const validationError = validateName(metadata.name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', metadata.name);
      formData.append('description', metadata.description);

      console.log('[DEBUG] Sending request to /api/users/me/resumes');
      const response = await fetch('/api/users/me/resumes', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log('[DEBUG] Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] Upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      const data = await response.json();
      console.log('[DEBUG] Upload successful:', data);
      onUploadComplete(data);
      
      // Reset the states
      setSelectedFile(null);
      setMetadata({
        name: '',
        description: '',
      });
      
      // Reset the file input element using the ref
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[DEBUG] Error during upload:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', maxWidth: '400px' }}>
      <input
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        id="resume-file-upload"
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        ref={fileInputRef}
      />
      <label htmlFor="resume-file-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={isUploading}
          fullWidth
          sx={{ mb: 2 }}
        >
          Select Resume
        </Button>
      </label>

      {selectedFile && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            Selected file: {selectedFile.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Resume Name"
          value={metadata.name}
          onChange={handleChange('name')}
          error={!!error}
          helperText={error}
          required
        />
        <TextField
          fullWidth
          label="Description"
          value={metadata.description}
          onChange={handleChange('description')}
          multiline
          rows={3}
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            startIcon={<SaveIcon />}
            disabled={!!error || !selectedFile}
          >
            Upload Resume
          </Button>
        </Box>
      </Stack>

      {isUploading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

export default ResumeUpload; 