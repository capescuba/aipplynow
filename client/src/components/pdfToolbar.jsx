import React from 'react';
import { Stack, Typography, IconButton, Tooltip, Button, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
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
  const toolbarIconSize = 20;
  const toolbarTextSize = 14;

  const handlePrevClick = () => {
    console.log('Previous button clicked', { currentPage, numPages });
    onPrevPage();
  };

  const handleNextClick = () => {
    console.log('Next button clicked', { currentPage, numPages });
    onNextPage();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.03)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 2,
          py: 1,
          minHeight: '48px',
          justifyContent: 'space-between',
        }}
      >
        {/* Page Navigation */}
        <Stack 
          direction="row" 
          spacing={0.5} 
          alignItems="center"
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: 1.5,
            px: 1,
            py: 0.5,
          }}
        >
          <Tooltip title="Previous page">
            <IconButton
              onClick={handlePrevClick}
              disabled={currentPage === 1}
              aria-label="Previous page"
              size="small"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: toolbarIconSize }} />
            </IconButton>
          </Tooltip>
          <Typography
            sx={{
              fontSize: toolbarTextSize,
              whiteSpace: 'nowrap',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              px: 1,
            }}
          >
            {currentPage} / {numPages || '?'}
          </Typography>
          <Tooltip title="Next page">
            <IconButton
              onClick={handleNextClick}
              disabled={currentPage === numPages || !numPages}
              aria-label="Next page"
              size="small"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: toolbarIconSize }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Zoom Controls */}
        <Stack 
          direction="row" 
          spacing={0.5} 
          alignItems="center"
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: 1.5,
            px: 1,
            py: 0.5,
          }}
        >
          <Tooltip title="Zoom out">
            <IconButton
              onClick={onZoomOut}
              disabled={zoomLevel <= 0.25}
              aria-label="Zoom out"
              size="small"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <ZoomOutIcon sx={{ fontSize: toolbarIconSize }} />
            </IconButton>
          </Tooltip>

          <Button
            onClick={onResetZoom}
            variant="text"
            size="small"
            sx={{
              minWidth: '70px',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: toolbarTextSize,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
              },
            }}
            startIcon={<RestartAltIcon sx={{ fontSize: toolbarIconSize }} />}
          >
            {Math.round(zoomLevel * 100)}%
          </Button>

          <Tooltip title="Zoom in">
            <IconButton
              onClick={onZoomIn}
              disabled={zoomLevel >= 5.0}
              aria-label="Zoom in"
              size="small"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <ZoomInIcon sx={{ fontSize: toolbarIconSize }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default PDFToolbar;