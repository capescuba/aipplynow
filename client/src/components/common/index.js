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