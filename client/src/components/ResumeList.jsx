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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ResumeList = () => {
  const [resumes, setResumes] = useState([]);
  const [editingResume, setEditingResume] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      const data = await response.json();
      setResumes(data);
    } catch (err) {
      setError('Failed to fetch resumes');
      console.error(err);
    }
  };

  const handleEdit = (resume) => {
    setEditingResume(resume);
    setEditName(resume.name);
    setEditDescription(resume.description || '');
    setError('');
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    const isDuplicate = resumes.some(
      r => r.resume_id !== editingResume?.resume_id && r.name === name.trim()
    );
    if (isDuplicate) {
      return 'A resume with this name already exists. Please choose a different name.';
    }
    return '';
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setEditName(newName);
    setError(validateName(newName));
  };

  const handleSave = async () => {
    const validationError = validateName(editName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await fetch(`/api/resumes/${editingResume.resume_id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update resume');
      }

      const updatedResume = await response.json();
      setResumes(resumes.map(resume => 
        resume.resume_id === editingResume.resume_id 
          ? updatedResume
          : resume
      ));
      setEditingResume(null);
    } catch (error) {
      console.error('Error updating resume:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setEditingResume(null);
    setError('');
  };

  return (
    <div>
      <h2>Your Resumes</h2>
      {error && <div className="error">{error}</div>}
      <List>
        {resumes.map((resume) => (
          <ListItem
            key={resume.resume_id}
            sx={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              mb: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {editingResume?.resume_id === resume.resume_id ? (
              <Box sx={{ width: '100%', p: 1 }}>
                {error && (
                  <Typography color="error" sx={{ mb: 1 }}>
                    {error}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  label="Name"
                  value={editName}
                  onChange={handleNameChange}
                  margin="normal"
                  size="small"
                  error={!!error}
                  helperText={error}
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
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!!error}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                    {resume.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(resume)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // Implement delete functionality
                      }}
                      aria-label="delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                {resume.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {resume.description}
                  </Typography>
                )}
              </>
            )}
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default ResumeList; 