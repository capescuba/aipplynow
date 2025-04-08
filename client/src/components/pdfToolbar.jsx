import React from 'react';
import { Stack, Typography, IconButton, Tooltip, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTheme } from '@mui/material/styles';

function PDFToolbar({ 
  currentPage, 
  numPages, 
  onPrevPage, 
  onNextPage, 
  onZoomIn, 
  onZoomOut,
  onResetZoom,
  zoomLevel 
}) {
  const theme = useTheme();
  const toolbarIconSize = 24;
  const toolbarTextSize = 16;

  const handlePrevClick = () => {
    console.log('Previous button clicked', { currentPage, numPages });
    onPrevPage();
  };

  const handleNextClick = () => {
    console.log('Next button clicked', { currentPage, numPages });
    onNextPage();
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        p: 1,
        bgcolor: theme.palette.background.paper,
        minHeight: '40px',
        zIndex: 1,
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Previous page">
          <IconButton
            onClick={handlePrevClick}
            disabled={currentPage === 1}
            aria-label="Previous page"
            sx={{ p: 0.5, color: theme.palette.text.primary }}
          >
            <ArrowBackIcon sx={{ fontSize: toolbarIconSize }} />
          </IconButton>
        </Tooltip>
        <Typography
          sx={{
            fontSize: toolbarTextSize,
            whiteSpace: 'nowrap',
            color: theme.palette.text.primary,
          }}
        >
          Page {currentPage} of {numPages || '?'}
        </Typography>
        <Tooltip title="Next page">
          <IconButton
            onClick={handleNextClick}
            disabled={currentPage === numPages || !numPages}
            aria-label="Next page"
            sx={{ p: 0.5, color: theme.palette.text.primary }}
          >
            <ArrowForwardIcon sx={{ fontSize: toolbarIconSize }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Zoom out">
          <IconButton
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.25}
            aria-label="Zoom out"
            sx={{ p: 0.5, color: theme.palette.text.primary }}
          >
            <SearchIcon sx={{ fontSize: toolbarIconSize }} />
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                top: '42%',
                left: '43%',
                transform: 'translate(-50%, -50%)',
                fontSize: toolbarTextSize,
                color: theme.palette.text.primary,
              }}
            >
              -
            </Typography>
          </IconButton>
        </Tooltip>

        <Button
          onClick={onResetZoom}
          variant="text"
          size="small"
          sx={{
            minWidth: '80px',
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          startIcon={<RestartAltIcon />}
        >
          {Math.round(zoomLevel * 100)}%
        </Button>

        <Tooltip title="Zoom in">
          <IconButton
            onClick={onZoomIn}
            disabled={zoomLevel >= 5.0}
            aria-label="Zoom in"
            sx={{ p: 0.5, color: theme.palette.text.primary }}
          >
            <SearchIcon sx={{ fontSize: toolbarIconSize }} />
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                top: '42%',
                left: '43%',
                transform: 'translate(-50%, -50%)',
                fontSize: toolbarTextSize,
                color: theme.palette.text.primary,
              }}
            >
              +
            </Typography>
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

export default PDFToolbar;