import React from 'react';
import {
  Button,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

function ResumeParser({
  file,
  url,
  jobDesc,
  setJobDesc,
  loading,
  currentResumeId,
  uploadStatus,
  scoreData,
  onAnalyze,
}) {
  const theme = useTheme();
  const handleJobDescChange = (event) => setJobDesc(event.target.value);

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1, sm: 2 },
        m: 0,
        width: '100%',
        maxWidth: '100%',
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack spacing={2} sx={{ width: '100%', flexGrow: 1, overflow: 'auto', p: { xs: 1, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>
          Resume Analysis
        </Typography>
        
        <TextField
          multiline
          rows={8}
          placeholder="Enter job description..."
          value={jobDesc}
          onChange={handleJobDescChange}
          variant="outlined"
          fullWidth
          disabled={loading}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)',
            },
          }}
        />

        {url && (
          <Typography variant="body2" color="textSecondary">
            Source URL: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
          </Typography>
        )}

        <Button
          variant="contained"
          onClick={onAnalyze}
          disabled={loading || (!jobDesc.trim() && !url)}
          sx={{ alignSelf: 'flex-start' }}
        >
          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} color="inherit" />
              <span>Analyzing...</span>
            </Stack>
          ) : (
            'Analyze Resume'
          )}
        </Button>

        {uploadStatus && (
          <Typography
            color={uploadStatus.includes('failed') ? 'error' : 'success'}
            sx={{ mt: 1 }}
          >
            {uploadStatus}
          </Typography>
        )}

        {scoreData && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Score Breakdown
            </Typography>
            <List dense>
              {Object.entries(scoreData.breakdown || {}).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={`${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}`}
                    secondary={`${(value * 100).toFixed(1)}%`}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Improvement Suggestions
            </Typography>
            <List dense>
              {(scoreData.improvement_suggestions || []).map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={suggestion}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: theme.palette.text.secondary,
                        fontSize: '0.9rem',
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {scoreData && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Resume Data
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Skills"
                      secondary={(scoreData.skills || []).join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Experience"
                      secondary={`${scoreData.total_experience_years || 0} years`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Relevant Experience"
                      secondary={Object.entries(scoreData.relevant_experience || {})
                        .map(([role, years]) => `${role}: ${years} years`)
                        .join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Education"
                      secondary={(scoreData.education || []).length > 0 ? scoreData.education.join(', ') : 'None'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Certifications"
                      secondary={(scoreData.certifications || []).length > 0 ? scoreData.certifications.join(', ') : 'None'}
                    />
                  </ListItem>
                </List>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default ResumeParser;