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
  Divider,
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
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      maxHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 3,
      backgroundColor: '#fff',
      minWidth: '900px',
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600,
          color: 'text.primary',
        }}>
          Documents
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            px: 2, 
            py: 0.5, 
            borderRadius: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 500,
          }}
        >
          {resumes.length}/5 uploaded
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'minmax(500px, 1fr) 400px',
        gap: 4,
        flex: 1,
        overflow: 'hidden',
        height: 'calc(100% - 60px)',
        backgroundColor: '#fff',
        minWidth: 0,
      }}>
        {/* Left side - Document List */}
        <Box sx={{ 
          overflow: 'auto',
          height: '100%',
          pr: 2,
          minWidth: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
          },
        }}>
          <List sx={{ 
            p: 0,
            width: '100%',
          }}>
            {resumes.length === 0 ? (
              <Paper sx={{ 
                p: 4,
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                width: '100%',
              }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'text.primary', mb: 1, fontWeight: 500 }}>
                  No documents uploaded yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Upload a PDF to get started
                </Typography>
              </Paper>
            ) : (
              resumes.map((resume) => (
                <Card
                  key={resume.resume_id || 'new'}
                  onClick={() => {
                    console.log('[DEBUG] ResumeList - onClick - resume:', resume);
                    if (typeof onSelect === 'function') {
                      onSelect(resume);
                    }
                  }}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: String(selectedResume?.id) === String(resume.resume_id)
                      ? 'primary.softBg'
                      : '#fff',
                    border: '1px solid',
                    borderColor: String(selectedResume?.id) === String(resume.resume_id)
                      ? 'primary.main'
                      : 'grey.200',
                    boxShadow: String(selectedResume?.id) === String(resume.resume_id)
                      ? '0 4px 12px rgba(25, 118, 210, 0.12)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: String(selectedResume?.id) === String(resume.resume_id)
                        ? 'primary.softBg'
                        : 'grey.50',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    },
                    width: '100%',
                  }}
                >
                  <Box sx={{ 
                    p: 2.5,
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: 2,
                  }}>
                    <DescriptionIcon sx={{ 
                      color: String(selectedResume?.id) === String(resume.resume_id)
                        ? 'primary.main'
                        : 'grey.700',
                      fontSize: 28,
                    }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 500, 
                          mb: 0.5,
                          color: String(selectedResume?.id) === String(resume.resume_id)
                            ? 'primary.main'
                            : 'text.primary',
                        }}
                      >
                        {resume.name}
                      </Typography>
                      {resume.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {resume.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      onClick={(e) => handleDeleteClick(e, resume)}
                      size="small"
            sx={{
                        color: 'error.main',
                        opacity: 0.7,
                        backgroundColor: 'error.lighter',
                        '&:hover': {
                          opacity: 1,
                          backgroundColor: 'error.light',
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))
            )}
          </List>
        </Box>

        {/* Right side - Details Panel */}
        {selectedResume && (selectedResume.file || selectedResume.id) && (
          <Box sx={{ 
            overflow: 'auto',
            height: '100%',
            pr: 2,
            width: '100%',
            minWidth: 0,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
            },
          }}>
            <Paper sx={{ 
              p: 3,
              backgroundColor: '#fff',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <Typography variant="h6" sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: 'text.primary',
              }}>
                {selectedResume.id === null ? 'New Document' : 'Details'}
              </Typography>
              
              {error && (
                <Typography 
                  color="error" 
                  sx={{ 
                    mb: 3,
                    p: 1.5,
                    backgroundColor: 'error.lighter',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                  }}
                >
                    {error}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  label="Name"
                  value={editName}
                  onChange={handleNameChange}
                  size="small"
                  error={!!error}
                disabled={selectedResume.id !== null}
                required
                sx={{ mb: 2.5 }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  size="small"
                  multiline
                rows={3}
                disabled={selectedResume.id !== null}
                sx={{ mb: 2.5 }}
                placeholder="Add a description (optional)"
              />

              <TextField
                fullWidth
                label="Upload Date"
                value={selectedResume.date_uploaded || (selectedResume.id === null ? new Date().toISOString().split('T')[0] : '')}
                size="small"
                disabled={true}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mb: 2.5 }}
              />

              {selectedResume.id === null && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mt: 4,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'grey.200',
                }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveClick}
                    disabled={!!error}
                    sx={{ flex: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={onCancel}
                    sx={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        )}
              </Box>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Document
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete "{resumeToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
                  </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancelDelete} 
            color="inherit"
            disabled={isDeleting}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained"
            color="error" 
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