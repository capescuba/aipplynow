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
  Chip,
  Rating,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RecommendIcon from '@mui/icons-material/Recommend';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

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
  
  // Transform and validate score data
  const processedScoreData = React.useMemo(() => {
    if (!scoreData) return null;
    
    // Extract data from the correct level of nesting
    const apiData = scoreData.data || {};
    const detailedData = apiData.data || {};
    
    // Ensure we have the basic structure
    const processed = {
      ats_score: apiData.ats_score,
      data: {
        skills: detailedData.skills || [],
        relevant_experience: detailedData.relevant_experience || {},
        education: detailedData.education || [],
        certifications: detailedData.certifications || [],
        missing_keywords: detailedData.missing_keywords || [],
        total_experience_years: detailedData.total_experience_years
      },
      breakdown: apiData.breakdown || {},
      improvement_suggestions: apiData.improvement_suggestions || {}
    };

    // Transform skills if they're in old format (array of strings)
    if (Array.isArray(processed.data.skills)) {
      processed.data.skills = processed.data.skills.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, relevance: 1, confidence: 1 };
        }
        return skill;
      });
    }

    // Transform experience if it's in old format
    if (processed.data.relevant_experience && !Array.isArray(processed.data.relevant_experience.roles)) {
      const roles = Array.isArray(processed.data.relevant_experience) 
        ? processed.data.relevant_experience 
        : Object.entries(processed.data.relevant_experience)
            .filter(([key]) => key !== 'improvement_areas')
            .map(([title, years]) => ({
              title,
              years: parseFloat(years) || 0,
              relevance_score: 1
            }));
      
      processed.data.relevant_experience = {
        roles: roles,
        improvement_areas: processed.data.relevant_experience.improvement_areas || []
      };
    }

    // Transform improvement suggestions if they're in old format (array)
    if (Array.isArray(processed.improvement_suggestions)) {
      const suggestions = processed.improvement_suggestions;
      processed.improvement_suggestions = {
        critical: suggestions.slice(0, 2),
        recommended: suggestions.slice(2, 4),
        advanced: suggestions.slice(4)
      };
    }

    // Ensure improvement suggestions are properly structured
    if (typeof processed.improvement_suggestions === 'object') {
      processed.improvement_suggestions = {
        critical: processed.improvement_suggestions.critical || [],
        recommended: processed.improvement_suggestions.recommended || [],
        advanced: processed.improvement_suggestions.advanced || []
      };
    }

    console.log('Processed score data:', processed);
    return processed;
  }, [scoreData]);

  // Add debug logging
  React.useEffect(() => {
    if (processedScoreData) {
      console.log('Score Data received:', JSON.stringify(processedScoreData, null, 2));
      console.log('Score Data structure:', {
        hasData: !!processedScoreData.data,
        hasBreakdown: !!processedScoreData.breakdown,
        hasSuggestions: !!processedScoreData.improvement_suggestions,
        atsScore: processedScoreData.ats_score,
        dataFields: processedScoreData.data ? Object.keys(processedScoreData.data) : [],
      });
    }
  }, [processedScoreData]);

  const handleJobDescChange = (event) => setJobDesc(event.target.value);

  const renderSkillChips = (skills) => {
    if (!Array.isArray(skills)) return null;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {skills.map((skill, index) => (
          <Chip
            key={index}
            label={`${skill.name} (${Math.round((skill.relevance || 1) * 100)}%)`}
            color={skill.relevance > 0.7 ? "success" : skill.relevance > 0.4 ? "primary" : "default"}
            size="small"
          />
        ))}
      </Box>
    );
  };

  const renderExperience = (experience) => {
    if (!experience?.roles || !Array.isArray(experience.roles)) return null;
    return (
      <List dense>
        {experience.roles.map((role, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={role.title}
              secondary={`${role.years} years (Relevance: ${Math.round((role.relevance_score || 0) * 100)}%)`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderSuggestions = (suggestions, icon) => {
    if (!Array.isArray(suggestions)) return null;
    return (
      <List dense>
        {suggestions.map((suggestion, index) => (
          <ListItem key={index}>
            {icon}
            <ListItemText primary={suggestion} sx={{ ml: 2 }} />
          </ListItem>
        ))}
      </List>
    );
  };

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

        {processedScoreData && (
          <>
            <Box sx={{ textAlign: 'center', my: 2, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {(() => {
                  if (!processedScoreData.ats_score) return 'N/A';
                  if (typeof processedScoreData.ats_score === 'string') {
                    if (processedScoreData.ats_score.includes('%')) return processedScoreData.ats_score;
                    const score = parseFloat(processedScoreData.ats_score);
                    return isNaN(score) ? 'N/A' : `${Math.round(score)}%`;
                  }
                  return `${Math.round(processedScoreData.ats_score)}%`;
                })()}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                ATS Compatibility Score
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Accordion defaultExpanded>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Skills Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {processedScoreData.data?.skills && processedScoreData.data.skills.length > 0 ? (
                  renderSkillChips(processedScoreData.data.skills)
                ) : (
                  <Typography color="text.secondary">No skills data available</Typography>
                )}
                {processedScoreData.data?.missing_keywords && processedScoreData.data.missing_keywords.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Missing Keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {processedScoreData.data.missing_keywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Experience Details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {processedScoreData.data?.relevant_experience?.roles && processedScoreData.data.relevant_experience.roles.length > 0 ? (
                  renderExperience(processedScoreData.data.relevant_experience)
                ) : (
                  <Typography color="text.secondary">No experience data available</Typography>
                )}
                {processedScoreData.data?.relevant_experience?.improvement_areas && processedScoreData.data.relevant_experience.improvement_areas.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Areas for Improvement:
                    </Typography>
                    <List dense>
                      {processedScoreData.data.relevant_experience.improvement_areas.map((area, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={area}
                            sx={{ 
                              '& .MuiListItemText-primary': {
                                color: theme.palette.warning.dark
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Score Breakdown</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {processedScoreData.breakdown && Object.keys(processedScoreData.breakdown).length > 0 ? (
                  <List dense>
                    {Object.entries(processedScoreData.breakdown).map(([key, value]) => (
                      <ListItem key={key} sx={{ py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Rating
                                value={(value || 0) / 20}
                                readOnly
                                precision={0.5}
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                {Math.round(value || 0)}%
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No score breakdown available</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Improvement Suggestions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {processedScoreData.improvement_suggestions?.critical && processedScoreData.improvement_suggestions.critical.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Critical Improvements
                      </Typography>
                      {renderSuggestions(
                        processedScoreData.improvement_suggestions.critical,
                        <ErrorOutlineIcon color="error" fontSize="small" />
                      )}
                    </Box>
                  )}
                  
                  {processedScoreData.improvement_suggestions?.recommended && processedScoreData.improvement_suggestions.recommended.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Recommended Changes
                      </Typography>
                      {renderSuggestions(
                        processedScoreData.improvement_suggestions.recommended,
                        <RecommendIcon color="primary" fontSize="small" />
                      )}
                    </Box>
                  )}
                  
                  {processedScoreData.improvement_suggestions?.advanced && processedScoreData.improvement_suggestions.advanced.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Advanced Suggestions
                      </Typography>
                      {renderSuggestions(
                        processedScoreData.improvement_suggestions.advanced,
                        <TipsAndUpdatesIcon color="success" fontSize="small" />
                      )}
                    </Box>
                  )}
                  {(!processedScoreData.improvement_suggestions?.critical?.length &&
                    !processedScoreData.improvement_suggestions?.recommended?.length &&
                    !processedScoreData.improvement_suggestions?.advanced?.length) && (
                    <Typography color="text.secondary">No improvement suggestions available</Typography>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default ResumeParser;