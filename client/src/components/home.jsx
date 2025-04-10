// Home.js
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Header from "./header";
import PDFPreview from "./pdfPreview";
import ResumeMetadata from "./resumeMetadata";
import {
  LoadingState,
  Toast,
  ResumeList,
  EmptyState,
  TransitionComponent,
} from "./common";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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

  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [editingResume, setEditingResume] = useState(null);
  const [newResume, setNewResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [isResumesExpanded, setIsResumesExpanded] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetchResumes();
    } else {
      setResumes([]);
      setSelectedFile(null);
      setSelectedResumeId(null);
      setEditingResume(null);
      setNewResume(null);
    }
  }, [isLoggedIn]);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const fetchResumeFile = async (resumeId) => {
    try {
      const response = await fetch(`/api/users/me/resumes/${resumeId}/download`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch resume file: ${response.statusText}`);
      const blob = await response.blob();
      const file = new File([blob], resumes.find((r) => r.resume_id === resumeId).original_name, {
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

  const handleAddNewResume = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setSelectedFile(selectedFile);
      setSelectedResumeId(null);
      setNewResume({ original_name: selectedFile.name });
      setEditingResume(null);
      setSelectedFile(null);
    } else {
      setToast({
        open: true,
        message: "Please select a valid PDF file.",
        severity: "error",
      });
    }
  };

  const handleResumeSelect = async (resumeId) => {
    try {
      setIsLoading(true);
      setSelectedResumeId(resumeId);
      const file = await fetchResumeFile(resumeId);
      if (file) {
        setSelectedFile(file);
        setToast({
          open: true,
          message: "Resume loaded successfully!",
          severity: "success",
        });
      } else {
        setSelectedFile(null);
      }
      setEditingResume(null);
      setNewResume(null);
    } catch (error) {
      console.error("Error selecting resume:", error);
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditResume = (resume) => {
    setEditingResume(resume);
    setNewResume(null);
    setSelectedResumeId(resume.resume_id);
    setSelectedFile(null);
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      const response = await fetch(`/api/users/me/resumes/${resumeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to delete resume: ${response.statusText}`);
      setResumes((prev) => prev.filter((r) => r.resume_id !== resumeId));
      if (selectedResumeId === resumeId) {
        setSelectedResumeId(null);
        setSelectedFile(null);
      }
      setEditingResume(null);
      setNewResume(null);
      setToast({
        open: true,
        message: "Resume deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting resume:", error);
      setToast({
        open: true,
        message: "Failed to delete resume. Please try again.",
        severity: "error",
      });
    }
  };

  const handleSaveMetadata = async (updatedMetadata) => {
    try {
      if (newResume) {
        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("original_name", updatedMetadata.name);
        formData.append("description", updatedMetadata.description);

        const response = await fetch("/api/users/me/resumes", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!response.ok) throw new Error(`Failed to save new resume: ${response.statusText}`);
        const savedResume = await response.json();
        setResumes((prev) => [...prev, savedResume]);
        setSelectedResumeId(savedResume.resume_id);
        setNewResume(null);
        setToast({
          open: true,
          message: "Resume uploaded successfully!",
          severity: "success",
        });
      } else {
        const response = await fetch(`/api/users/me/resumes/${updatedMetadata.resume_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            original_name: updatedMetadata.name,
            description: updatedMetadata.description,
          }),
        });
        if (!response.ok) throw new Error(`Failed to update metadata: ${response.statusText}`);
        setResumes((prev) =>
          prev.map((r) =>
            r.resume_id === updatedMetadata.resume_id ? { ...r, ...updatedMetadata } : r
          )
        );
        setToast({
          open: true,
          message: "Resume updated successfully!",
          severity: "success",
        });
      }
      setEditingResume(null);
      fetchResumes();
    } catch (error) {
      console.error("Error saving metadata:", error);
      setToast({
        open: true,
        message: "Failed to save resume. Please try again.",
        severity: "error",
      });
    }
  };

  const handleSaveSuccess = () => {
    fetchResumes();
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
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
          }}
        >
          {/* Left Panel - Resumes List and Metadata */}
          <Box
            sx={{
              position: 'absolute',
              left: isResumesExpanded ? 0 : -280,
              top: 0,
              bottom: 0,
              width: 280,
              bgcolor: 'background.paper',
              transition: 'left 0.3s ease',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              mt: 2,
              mb: 2,
              ml: 2,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 'inherit',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" component="h1" noWrap>
                    My Resumes
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  component="label"
                  color="primary"
                  size="small"
                  sx={{ textTransform: "none", minWidth: 0 }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={handleAddNewResume}
                  />
                </Button>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {isLoading ? (
                  <LoadingState />
                ) : resumes.length === 0 ? (
                  <EmptyState
                    message="No resumes uploaded yet"
                    action="Upload Resume"
                    onAction={() => document.querySelector('input[type="file"]').click()}
                  />
                ) : (
                  <TransitionComponent>
                    <ResumeList
                      resumes={resumes}
                      onSelect={handleResumeSelect}
                      onEdit={handleEditResume}
                      onDelete={handleDeleteResume}
                      selectedId={selectedResumeId}
                    />
                  </TransitionComponent>
                )}

                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <ResumeMetadata
                      resume={editingResume || newResume}
                      onSave={handleSaveMetadata}
                      onSaveSuccess={handleSaveSuccess}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Toggle Button */}
          <IconButton
            size="small"
            onClick={() => setIsResumesExpanded(!isResumesExpanded)}
            sx={{
              position: 'absolute',
              left: isResumesExpanded ? 280 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              bgcolor: 'transparent',
              border: 0,
              borderLeft: isResumesExpanded ? 1 : 0,
              borderRight: isResumesExpanded ? 0 : 1,
              borderColor: 'divider',
              borderRadius: isResumesExpanded ? '0 4px 4px 0' : '4px',
              transition: 'left 0.3s ease, background-color 0.2s ease',
              opacity: 0.6,
              width: 20,
              height: 48,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                opacity: 1,
              },
            }}
          >
            {isResumesExpanded 
              ? <ArrowBackIcon sx={{ fontSize: 16 }} />
              : <ArrowForwardIcon sx={{ fontSize: 16 }} />}
          </IconButton>

          {/* Main Content */}
          <Box
            sx={{
              flexGrow: 1,
              ml: isResumesExpanded ? 'calc(280px + 16px)' : 0,
              transition: 'margin-left 0.3s ease',
              display: 'flex',
              gap: 2,
              p: 2,
            }}
          >
            {/* PDF Preview */}
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  overflow: 'hidden',
                  minWidth: 0,
                  '& > div': {
                    borderRadius: 'inherit',
                    overflow: 'hidden',
                  },
                }}
              >
                {selectedFile ? (
                  <PDFPreview
                    file={selectedFile}
                    resumeId={selectedResumeId}
                    onSaveSuccess={handleSaveSuccess}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      p: 3,
                    }}
                  >
                    <EmptyState
                      message="Select a resume to preview and edit"
                      action={null}
                    />
                  </Box>
                )}
              </Paper>
            </Box>
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