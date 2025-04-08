import React, { useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function ResumeMetadata({ resume, onSave, onDelete, isNew = false }) {
  const [isEditing, setIsEditing] = useState(isNew); // Start in edit mode if new
  const [metadata, setMetadata] = useState({
    name: resume?.original_name || '',
    dateUploaded: resume?.date_uploaded || new Date().toISOString().split('T')[0], // Default to today for new
    description: resume?.description || '',
    lastAnalyzed: resume?.last_analyzed || '',
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing && !isNew) {
      // Reset to original values if canceling (not for new resumes)
      setMetadata({
        name: resume?.original_name || '',
        dateUploaded: resume?.date_uploaded || '',
        description: resume?.description || '',
        lastAnalyzed: resume?.last_analyzed || '',
      });
    }
  };

  const handleChange = (field) => (event) => {
    setMetadata((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    onSave({
      resume_id: resume?.resume_id,
      ...metadata,
    });
    setIsEditing(false);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', maxWidth: '400px' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Resume Metadata</Typography>
        {!isNew && (
          <IconButton onClick={handleEditToggle} aria-label={isEditing ? 'Cancel' : 'Edit'}>
            {isEditing ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        )}
      </Stack>

      {isEditing ? (
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={metadata.name}
            onChange={handleChange('name')}
            fullWidth
            size="small"
          />
          <TextField
            label="Date Uploaded"
            value={metadata.dateUploaded}
            onChange={handleChange('dateUploaded')}
            fullWidth
            size="small"
            disabled={!isNew} // Only editable for new resumes
          />
          <TextField
            label="Description"
            value={metadata.description}
            onChange={handleChange('description')}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
          <TextField
            label="Last Analyzed"
            value={metadata.lastAnalyzed}
            onChange={handleChange('lastAnalyzed')}
            fullWidth
            size="small"
            disabled // System-managed
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
            >
              Save
            </Button>
            {!isNew && (
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleEditToggle}
                size="small"
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <Typography variant="body1">
            <strong>Name:</strong> {metadata.name || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Date Uploaded:</strong> {metadata.dateUploaded || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Description:</strong> {metadata.description || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Last Analyzed:</strong> {metadata.lastAnalyzed || 'N/A'}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

export default ResumeMetadata;