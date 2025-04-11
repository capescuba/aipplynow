// Home.js
import React, { useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Paper,
  IconButton,
  TextField,
  Stack,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Header from "./header";
import PDFPreview from "./pdfPreview";
import {
  LoadingState,
  Toast,
  EmptyState,
  TransitionComponent,
} from "./common";
import ResumeList from "./ResumeList";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTrackedState } from '../libs/useTrackedState';

function Home({
  onLogout,
  userInfo,
  isLoggedIn,
  clientId,
  redirectUri,
  scope,
  state,
  onLoginSuccess,
  currentTheme,
  toggleTheme,
}) {
  const theme = useTheme();

  console.log("Home component rendering with props:", {
    isLoggedIn,
    currentTheme,
    hasUserInfo: !!userInfo,
    hasClientId: !!clientId,
    hasRedirectUri: !!redirectUri
  });

  // Core data states
  const [resumes, setResumes] = useTrackedState([], "Home", "resumes");
  const [selectedResume, setSelectedResume] = useTrackedState({
    id: null,
    file: null
  }, "Home", "selectedResume");

  // Debug selectedResume changes
  useEffect(() => {
    console.log('[DEBUG] selectedResume changed:', selectedResume);
  }, [selectedResume]);

  // UI states
  const [uiState, setUiState] = useTrackedState({
    isLoading: false,
    isResumesExpanded: true,
    error: null
  }, "Home", "uiState");

  // Notifications
  const [toast, setToast] = useTrackedState({
    open: false,
    message: "",
    severity: "success"
  }, "Home", "toast");

  // Helper functions to update specific parts of UI state
  const setLoading = (isLoading) => {
    setUiState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error) => {
    setUiState(prev => ({ ...prev, error }));
  };

  const toggleResumesPanel = () => {
    setUiState(prev => ({ ...prev, isResumesExpanded: !prev.isResumesExpanded }));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchResumes();
    } else {
      setResumes([]);
      setSelectedResume({
        id: null,
        file: null
      });
    }
  }, [isLoggedIn]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/me/resumes", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch resumes: ${response.statusText}`);
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setToast({
        open: true,
        message: "Failed to fetch resumes. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeFile = async (resumeId) => {
    try {
      console.log('[DEBUG] fetchResumeFile called with resumeId:', resumeId);
      console.log('[DEBUG] resumeId type:', typeof resumeId);
      
      // Ensure resumeId is a string or number
      if (typeof resumeId !== 'string' && typeof resumeId !== 'number') {
        throw new Error(`Invalid resume ID type: ${typeof resumeId}`);
      }
      
      const response = await fetch(`/api/users/me/resumes/${resumeId}/download`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch resume file: ${response.statusText}`);
      const blob = await response.blob();
      const file = new File([blob], resumes.find((r) => r.resume_id === resumeId)?.name || 'resume.pdf', {
        type: "application/pdf",
      });
      return file;
    } catch (error) {
      console.error("Error fetching resume file:", error);
      setToast({
        open: true,
        message: "Failed to fetch resume file. Please try again.",
        severity: "error",
      });
      return null;
    }
  };

  const handleAddNewResume = (file) => {
    console.log('[DEBUG] handleAddNewResume called with file:', file);
    
    if (!file) {
      setError("Please select a file to upload.");
      setToast({
        open: true,
        message: "Please select a file to upload.",
        severity: "error",
      });
      return;
    }

    if (file.type !== "application/pdf") {
      console.log('[DEBUG] Invalid file type:', file.type);
      setError("Please select a valid PDF file.");
      setToast({
        open: true,
        message: "Please select a valid PDF file.",
        severity: "error",
      });
      return;
    }

    // Extract name from file name (remove extension)
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    // Set selected resume with new file
    const newResume = {
      id: null,
      file,
      name: fileName,
      description: '',
      date_uploaded: new Date().toISOString().split('T')[0]
    };
    
    console.log('[DEBUG] Setting selectedResume to:', newResume);
    console.log('[DEBUG] newResume.id type:', typeof newResume.id);
    console.log('[DEBUG] newResume.id === null:', newResume.id === null);
    console.log('[DEBUG] newResume.file:', newResume.file);
    console.log('[DEBUG] newResume.name:', newResume.name);
    console.log('[DEBUG] newResume.description:', newResume.description);
    console.log('[DEBUG] JSON.stringify(newResume):', JSON.stringify(newResume));
    
    // Update UI state first to ensure the panel is visible
    setUiState(prev => ({
      ...prev,
      isResumesExpanded: true,
      isLoading: false,
      error: null
    }));
    
    // Then update the selected resume
    setSelectedResume(newResume);
    setError(null);
  };

  const handleResumeSelect = async (resume) => {
    try {
      setLoading(true);
      console.log('[DEBUG] handleResumeSelect called with resume:', resume);
      
      // Extract the resume ID from the resume object
      const resumeId = resume.resume_id;
      console.log('[DEBUG] Extracted resumeId:', resumeId);
      
      if (!resumeId) {
        throw new Error('Invalid resume ID');
      }
      
      const file = await fetchResumeFile(resumeId);
      if (file) {
        setSelectedResume({
          id: resumeId,
          file,
          name: resume.name || file.name.replace(/\.[^/.]+$/, ''),
          description: resume.description || '',
          date_uploaded: resume.date_uploaded || new Date().toISOString().split('T')[0]
        });
        setToast({
          open: true,
          message: "Resume loaded successfully!",
          severity: "success",
        });
      }
      setError(null);
    } catch (error) {
      console.error("Error selecting resume:", error);
      setError("Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resume) => {
    setSelectedResume(prev => ({
      ...prev,
      id: resume.resume_id,
      name: resume.name,
      description: resume.description,
      date_uploaded: resume.date_uploaded
    }));
  };

  const handleCancel = () => {
    setError(null);
  };

  const handleDelete = async (resumeId) => {
    try {
      const response = await fetch(`/api/users/me/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      setResumes(resumes.filter(resume => resume.resume_id !== resumeId));
      if (selectedResume.id === resumeId) {
        setSelectedResume({
          id: null,
          file: null,
        });
      }
      setError(null);
      setToast({
        open: true,
        message: "Resume deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setError('Failed to delete resume');
      console.error(err);
      setToast({
        open: true,
        message: "Failed to delete resume. Please try again.",
        severity: "error",
      });
    }
  };

  const handleSaveMetadata = async (updatedMetadata) => {
    try {
      setLoading(true);
      if (!selectedResume.id) {
        // New resume upload
        console.log('[DEBUG] Uploading new resume with metadata:', updatedMetadata);
        console.log('[DEBUG] selectedResume before upload:', selectedResume);
        
        const formData = new FormData();
        formData.append("resume", selectedResume.file);
        formData.append("name", updatedMetadata.name);
        formData.append("description", updatedMetadata.description || '');

        const response = await fetch("/api/users/me/resumes", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to save new resume`);
        }

        const savedResume = await response.json();
        console.log('[DEBUG] Saved resume from server:', savedResume);
        
        // Fetch the latest resumes
        await fetchResumes();
        
        // Update selectedResume with the saved resume data
        const updatedSelectedResume = {
          id: savedResume.resume_id,
          file: selectedResume.file,
          name: updatedMetadata.name,
          description: updatedMetadata.description || '',
          date_uploaded: savedResume.upload_date ? new Date(savedResume.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          resume_id: savedResume.resume_id,
          user_id: savedResume.user_id,
          s3_key: savedResume.s3_key,
          s3_url: savedResume.s3_url
        };
        
        console.log('[DEBUG] Updating selectedResume to:', updatedSelectedResume);
        setSelectedResume(updatedSelectedResume);

        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = '';
        }

        setToast({
          open: true,
          message: "Resume saved successfully!",
          severity: "success",
        });
        setError(null);
      } else {
        // This should never happen since we don't edit existing resumes
        console.error('[DEBUG] Attempted to edit an existing resume, which is not supported');
      }
    } catch (error) {
      console.error('[DEBUG] Error saving metadata:', error);
      setError(error.message);
      setToast({
        open: true,
        message: error.message || "Failed to save resume",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchResumes();
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const validateName = (name, currentResumeId = null) => {
    if (!name) {
      setError("Name is required");
      return false;
    }
    
    const duplicate = resumes.find(
      r => r.name.toLowerCase() === name.toLowerCase() && r.resume_id !== currentResumeId
    );
    
    if (duplicate) {
      setError("A resume with this name already exists");
      return false;
    }
    
    setError("");
    return true;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Header
        userInfo={userInfo}
        isLoggedIn={isLoggedIn}
        clientId={clientId}
        redirectUri={redirectUri}
        scope={scope}
        state={state}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
      />
      
      {isLoggedIn && (
        <Box
          sx={{
            mt: { xs: 8, sm: 9 },
            flexGrow: 1,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            px: 3,
            pb: 3
          }}
        >
          {/* Left Panel - Resumes List */}
          <Box
            sx={{
              position: 'absolute',
              left: uiState.isResumesExpanded ? 0 : -320,
              top: 0,
              bottom: 0,
              width: 320,
              transition: 'left 0.3s ease',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    My Resumes
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      ml: 1.5,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 500
                    }}
                  >
                    {resumes.length}/5
                  </Typography>
                </Box>
                {resumes.length < 5 && (
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    component="label"
                    size="small"
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAddNewResume(e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {uiState.isLoading ? (
                  <LoadingState />
                ) : (
                  <TransitionComponent>
                    {console.log('[DEBUG] Rendering ResumeList with selectedResume:', selectedResume)}
                    
                    <ResumeList
                      resumes={resumes}
                      selectedResume={selectedResume}
                      onSelect={handleResumeSelect}
                      onDelete={handleDelete}
                      onSave={handleSaveMetadata}
                      onCancel={handleCancel}
                      error={uiState.error}
                      setError={setError}
                    />
                  </TransitionComponent>
                  
                )}
              </Box>
            </Paper>
          </Box>

          {/* Toggle Button */}
          <IconButton
            size="small"
            onClick={toggleResumesPanel}
            sx={{
              position: 'absolute',
              left: uiState.isResumesExpanded ? 320 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              bgcolor: theme.palette.background.paper,
              border: 1,
              borderColor: 'divider',
              borderRadius: '0 8px 8px 0',
              transition: 'left 0.3s ease',
              width: 24,
              height: 48,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              },
            }}
          >
            {uiState.isResumesExpanded 
              ? <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
              : <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />}
          </IconButton>

          {/* Main Content - PDF Preview */}
          <Box
            sx={{
              flexGrow: 1,
              ml: uiState.isResumesExpanded ? '336px' : '16px',
              transition: 'margin-left 0.3s ease',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {selectedResume.file ? (
                <PDFPreview
                  file={selectedResume.file}
                  resumeId={selectedResume.id}
                  onSaveSuccess={handleSaveSuccess}
                />
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 4,
                    textAlign: 'center'
                  }}
                >
                  <DescriptionOutlinedIcon sx={{ fontSize: 80, opacity: 0.2, mb: 3 }} />
                  <Typography 
                    variant="h5" 
                    color="text.primary" 
                    sx={{ 
                      mb: 1,
                      fontWeight: 500
                    }}
                  >
                    No resume selected
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      maxWidth: 400
                    }}
                  >
                    Select a resume from the list or upload a new one to view and analyze it
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
    </Box>
  );
}

export default Home;