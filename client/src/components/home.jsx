// Home.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  styled,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import Header from "./header";
import PDFPreview from "./pdfPreview";
import ResumeMetadata from "./resumeMetadata";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  backgroundColor: selected ? theme.palette.grey[300] : "inherit",
  "&:hover": {
    backgroundColor: theme.palette.grey[100],
    cursor: "pointer",
  },
}));

const MatrixCursor = styled("span")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontFamily: '"Roboto Mono", "Courier New", monospace',
  fontSize: "16px",
  color: "#FFFFFF",
  "& .prompt": {
    marginRight: "2px",
  },
  "& .cursor": {
    display: "inline-block",
    width: "2px",
    height: "16px",
    backgroundColor: "#FFFFFF",
    animation: "blink 0.7s infinite",
  },
  "@keyframes blink": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0 },
  },
}));

function Home({
  onLogout,
  userInfo,
  isLoggedIn,
  clientId,
  redirectUri,
  scope,
  state,
  onLoginSuccess,
}) {
  const [resumes, setResumes] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [editingResume, setEditingResume] = useState(null);
  const [newResume, setNewResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchResumes();
    }
  }, [isLoggedIn]);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/users/me/resumes", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch resumes: ${response.statusText}`);
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
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
      return null;
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleAddNewResume = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setSelectedFile(selectedFile);
      setSelectedResumeId(null);
      setNewResume({ original_name: selectedFile.name });
      setEditingResume(null);
      setDrawerOpen(true);
    } else {
      console.error("Please select a valid PDF file.");
    }
  };

  const handleResumeSelect = async (resumeId) => {
    setIsLoading(true);
    setSelectedResumeId(resumeId);
    const file = await fetchResumeFile(resumeId);
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
    setEditingResume(null);
    setNewResume(null);
    setDrawerOpen(false);
    setIsLoading(false);
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
    } catch (error) {
      console.error("Error deleting resume:", error);
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
      }
      setEditingResume(null);
      fetchResumes();
    } catch (error) {
      console.error("Error saving metadata:", error);
    }
  };

  const handleSaveSuccess = () => {
    fetchResumes();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <Header
        userInfo={userInfo}
        isLoggedIn={isLoggedIn}
        clientId={clientId}
        redirectUri={redirectUri}
        scope={scope}
        state={state}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
      />

      {isLoggedIn && (
        <Container
          sx={{
            mt: 8,
            p: 2,
            height: "calc(100vh - 64px)",
            width: "100%",
            maxWidth: "none",
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              position: "fixed",
              left: drawerOpen ? "250px" : "0",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1300,
              transition: "left 0.3s ease-in-out",
            }}
          >
            <IconButton
              onClick={toggleDrawer(!drawerOpen)}
              sx={{
                bgcolor: "#000000",
                "&:hover": { bgcolor: "#1A1A1A" },
                borderRadius: drawerOpen ? "50%" : "0 50% 50% 0",
                padding: "8px",
              }}
              aria-label="Toggle resume drawer"
            >
              <MatrixCursor>
                <span className="prompt">&gt;</span>
                <span className="cursor" />
              </MatrixCursor>
            </IconButton>
          </Box>

          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            <div
              role="presentation"
              onKeyDown={toggleDrawer(false)}
              style={{
                width: 250,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Typography variant="h6" sx={{ p: 2 }}>
                Your Resumes
              </Typography>
              <List sx={{ flexGrow: 1 }}>
                {resumes.length > 0 ? (
                  resumes.map((resume) => (
                    <React.Fragment key={resume.resume_id}>
                      <StyledListItem
                        selected={resume.resume_id === selectedResumeId}
                        onClick={() => handleResumeSelect(resume.resume_id)}
                      >
                        <ListItemText primary={resume.original_name} />
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditResume(resume);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResume(resume.resume_id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </StyledListItem>
                      {(editingResume?.resume_id === resume.resume_id || newResume) && (
                        <Box sx={{ p: 1 }}>
                          <ResumeMetadata
                            resume={editingResume || newResume}
                            onSave={handleSaveMetadata}
                            isNew={!!newResume}
                          />
                        </Box>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No resumes found" />
                  </ListItem>
                )}
              </List>
              <label htmlFor="add-new-resume">
                <Button variant="contained" component="span" sx={{ m: 2 }}>
                  Add New Resume
                </Button>
                <input
                  id="add-new-resume"
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleAddNewResume}
                />
              </label>
            </div>
          </Drawer>

          <Box sx={{ mt: 2, height: "100%", width: "100%", position: "relative" }}>
            {isLoading ? (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CircularProgress />
                <Typography>Loading resume...</Typography>
              </Box>
            ) : (
              <PDFPreview
                setFile={setSelectedFile}
                initialFile={selectedFile}
                resumeId={selectedResumeId}
                onSaveSuccess={handleSaveSuccess}
              />
            )}
          </Box>
        </Container>
      )}
    </Box>
  );
}

export default Home;