import React from 'react';
import { Stack, Typography, IconButton, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';

function PDFToolbar({ 
  currentPage, 
  numPages, 
  onPrevPage, 
  onNextPage, 
  onZoomIn, 
  onZoomOut, 
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
        bgcolor: theme.palette.background.default,
        minHeight: '40px',
        zIndex: 1,
        justifyContent: 'space-between',
      }}
    >
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
          flexGrow: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
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
      <Tooltip title="Zoom out">
        <IconButton
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
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
      <Tooltip title="Zoom in">
        <IconButton
          onClick={onZoomIn}
          disabled={zoomLevel >= 3.0}
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
  );
}

export default PDFToolbar;