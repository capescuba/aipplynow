import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  Button,
  Typography,
  Card,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';

const ResumeList = ({
  resumes,
  onDelete,
  selectedResume,
  onSelect,
  onSave,
  onCancel,
  error,
  setError
}) => {
  console.log('[DEBUG] ResumeList - props:', {
    resumesCount: resumes.length,
    selectedResume,
    error
  });
  
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedResume) {
      console.log('[DEBUG] ResumeList - useEffect - selectedResume:', selectedResume);
      console.log('[DEBUG] ResumeList - useEffect - selectedResume.name:', selectedResume.name);
      console.log('[DEBUG] ResumeList - useEffect - selectedResume.description:', selectedResume.description);
      
      // Set the edit fields based on the selected resume
      setEditName(selectedResume.name || '');
      setEditDescription(selectedResume.description || '');
    }
  }, [selectedResume]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setEditName(newName);
    
    // Validate name length and required field
    if (!newName.trim()) {
      setError("Name is required");
    } else if (newName.length > 50) {
      setError("Name must be 50 characters or less");
    } else {
      // Check for duplicate names
      const isDuplicate = resumes.some(
        r => r.name === newName.trim() && (!selectedResume || r.id !== selectedResume.id)
      );
      if (isDuplicate) {
        setError("A resume with this name already exists");
      } else {
        setError(null);
      }
    }
  };

  const handleSaveClick = () => {
    // Validate name before saving
    if (!editName.trim()) {
      setError("Name is required");
      return;
    }
    if (editName.length > 50) {
      setError("Name must be 50 characters or less");
      return;
    }
    // Check for duplicate names
    const isDuplicate = resumes.some(
      r => r.name === editName.trim() && (!selectedResume || r.id !== selectedResume.id)
    );
    if (isDuplicate) {
      setError("A resume with this name already exists");
      return;
    }
    onSave({
      name: editName.trim(),
      description: editDescription.trim()
    });
  };

  const handleDeleteClick = (e, resume) => {
    e.stopPropagation();
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (resumeToDelete) {
      setIsDeleting(true);
      try {
        await onDelete(resumeToDelete.resume_id);
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setResumeToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setResumeToDelete(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <div style={{ display: 'none' }}>
        {console.log('[DEBUG] ResumeList - resumes:', resumes)}
        {console.log('[DEBUG] ResumeList - first resume:', resumes[0])}
        {console.log('[DEBUG] ResumeList - selectedResume:', selectedResume)}
      </div>
      <h2>Your Resumes</h2>
      {error && <div className="error">{error}</div>}
      
      <List>
        {resumes.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No resumes found. Upload a new resume to get started.
          </Typography>
        ) : (
          resumes.map((resume) => (
            <Card
              key={resume.resume_id || 'new'}
              onClick={() => {
                console.log('[DEBUG] ResumeList - onClick - resume:', resume);
                console.log('[DEBUG] ResumeList - onClick - onSelect type:', typeof onSelect);
                if (typeof onSelect === 'function') {
                  onSelect(resume);
                } else {
                  console.error('[DEBUG] ResumeList - onSelect is not a function:', onSelect);
                }
              }}
              sx={{
                mb: 2,
                cursor: 'pointer',
                bgcolor: String(selectedResume?.id) === String(resume.resume_id) ? 'action.selected' : 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {resume.name}
                  </Typography>
                  {resume.description && (
                    <Typography variant="body2" color="text.secondary">
                      {resume.description}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  onClick={(e) => handleDeleteClick(e, resume)}
                  size="small"
                  color="error"
                  disabled={isDeleting}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          ))
        )}
      </List>
      
      {/* Show metadata panel for selected resume or new upload */}
      {selectedResume && (selectedResume.file || selectedResume.id) && (
        <Box sx={{ width: '100%', p: 1, mb: 2, border: '1px solid #ccc', borderRadius: '4px', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            {selectedResume.id === null ? 'New Resume' : 'Resume Details'}
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Name *"
            value={editName}
            onChange={handleNameChange}
            margin="normal"
            size="small"
            error={!!error}
            helperText={error}
            disabled={selectedResume.id !== null}  // Disable if not a new resume
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            margin="normal"
            size="small"
            multiline
            rows={2}
            disabled={selectedResume.id !== null}  // Disable if not a new resume
          />
          {selectedResume.id === null && (  // Only show buttons for new resumes
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveClick}
                disabled={!!error}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent id="delete-dialog-description">
          <Typography>
            Are you sure you want to delete "{resumeToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeList; 