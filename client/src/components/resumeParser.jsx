import React from 'react';
import { Button, Stack, Typography, TextareaAutosize, Box, List, ListItem, ListItemText } from '@mui/material';

function ResumeParser({
  file,
  url,
  jobDesc,
  setJobDesc,
  loading,
  currentResumeId,
  uploadStatus,
  scoreData,
  onParse,
}) {
  const handleJobDescChange = (event) => setJobDesc(event.target.value);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        m: 2,
        width: '100%',
        maxWidth: '600px',
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
      }}
    >
      <Stack spacing={2}>
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
          onClick={onParse}
          disabled={!currentResumeId || loading || !jobDesc.trim()}
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

        {scoreData && scoreData.breakdown && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Score Breakdown
            </Typography>
            <List dense>
              {Object.entries(scoreData.breakdown).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={`${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    secondary={`${value.toFixed(1)}%`}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Improvement Suggestions
            </Typography>
            <List dense>
              {scoreData.suggestions.map((suggestion, index) => (
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

            {scoreData.data && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Resume Data
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Skills"
                      secondary={scoreData.data.skills.join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Experience"
                      secondary={`${scoreData.data.total_experience_years} years`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Relevant Experience"
                      secondary={Object.entries(scoreData.data.relevant_experience)
                        .map(([role, years]) => `${role}: ${years} years`)
                        .join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Education"
                      secondary={scoreData.data.education.length > 0 ? scoreData.data.education.join(', ') : 'None'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Certifications"
                      secondary={scoreData.data.certifications.length > 0 ? scoreData.data.certifications.join(', ') : 'None'}
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