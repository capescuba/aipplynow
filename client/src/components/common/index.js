import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  List,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  styled,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";

// Loading State Component
export const LoadingState = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      p: 3,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Loading...
    </Typography>
  </Box>
);

// Error State Component
export const ErrorState = ({ message, onRetry }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      p: 3,
    }}
  >
    <Typography color="error" variant="h6" gutterBottom>
      {message}
    </Typography>
    {onRetry && (
      <Button
        variant="contained"
        color="primary"
        onClick={onRetry}
        startIcon={<RefreshIcon />}
        sx={{ mt: 2 }}
      >
        Try Again
      </Button>
    )}
  </Box>
);

// Toast Notification Component
export const Toast = ({ open, message, severity, onClose }) => (
  <Snackbar
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert 
      onClose={onClose} 
      severity={severity} 
      variant="filled"
      sx={{ width: "100%" }}
    >
      {message}
    </Alert>
  </Snackbar>
);

// Skeleton Loading Component
export const ResumeSkeleton = () => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="40%" />
  </Paper>
);

// Transition Component
export const TransitionComponent = styled("div")(({ theme }) => ({
  transition: theme.transitions.create(["transform", "opacity"], {
    duration: theme.transitions.duration.standard,
  }),
}));

// Resume List Component
export const ResumeList = ({ resumes, onSelect, onEdit, onDelete, selectedId }) => (
  <List sx={{ width: "100%", p: 0 }}>
    {resumes.map((resume) => (
      <Card
        key={resume.resume_id}
        onClick={() => onSelect(resume.resume_id)}
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          bgcolor: selectedId === resume.resume_id ? "action.selected" : "background.paper",
          transition: "background-color 0.2s ease-in-out",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", flex: 1 }}>
          <DescriptionIcon sx={{ mr: 2, color: "primary.main" }} />
          <Box>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: selectedId === resume.resume_id ? 600 : 400 }}>
              {resume.original_name}
            </Typography>
            {resume.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {resume.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ pr: 1 }}>
          <IconButton 
            onClick={(e) => { e.stopPropagation(); onEdit(resume); }}
            size="small"
            sx={{ mr: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            onClick={(e) => { e.stopPropagation(); onDelete(resume.resume_id); }}
            size="small"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Card>
    ))}
  </List>
);

// Empty State Component
export const EmptyState = ({ message, action, onAction }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      p: 3,
      textAlign: "center",
    }}
  >
    <DescriptionIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {message}
    </Typography>
    {action && (
      <Button
        variant="contained"
        color="primary"
        onClick={onAction}
        sx={{ mt: 2 }}
      >
        {action}
      </Button>
    )}
  </Box>
); 