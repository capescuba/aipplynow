import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Button,
} from '@mui/material';
import {
  Upload as UploadIcon,
  ZoomIn as ZoomInIcon,
  Compare as CompareIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

function Help() {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        href="/"
        sx={{ 
          mb: 3,
          textTransform: 'none',
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.text.primary,
          }
        }}
      >
        Back to Home
      </Button>

      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="500">
          About Neo Resume
        </Typography>
        
        <Typography variant="body1" paragraph color="text.secondary">
          Neo Resume is an intelligent resume analysis and optimization tool that helps you improve your resume's effectiveness. 
          Our AI-powered platform analyzes your resume against job descriptions to provide targeted improvements and insights.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom fontWeight="500">
          How to Use
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <UploadIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Upload Your Resume" 
              secondary="Start by uploading your resume in PDF format. You can drag and drop or click to select a file."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DescriptionIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Add Job Description" 
              secondary="Paste the job description you're targeting. This is required for our AI to provide targeted analysis and recommendations."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <ZoomInIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Review and Navigate" 
              secondary="Use the toolbar to zoom, navigate pages, and view your resume. The zoom controls help you focus on specific sections."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <CompareIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="AI Analysis" 
              secondary="Our AI will analyze your resume and provide detailed feedback on content, structure, and formatting."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EditIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Make Improvements" 
              secondary="Apply the suggested improvements to strengthen your resume. Edit text, structure, and formatting as needed."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <SaveIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Save and Export" 
              secondary="Save your changes and export the improved version of your resume in PDF format."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="500">
            Tips for Best Results
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Use Clear Formatting" 
                secondary="Ensure your PDF has clear, readable text and proper formatting for best analysis results."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Regular Updates" 
                secondary="Keep your resume updated with your latest experience and skills for the most accurate analysis."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Follow Suggestions" 
                secondary="Our AI provides data-driven suggestions - implementing them can significantly improve your resume's effectiveness."
              />
            </ListItem>
          </List>
        </Box>
      </Paper>
    </Container>
  );
}

export default Help; 