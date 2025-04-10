import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
`;

const scan = keyframes`
  0% {
    top: 0;
    opacity: 1;
  }
  2% {
    opacity: 1;
  }
  4% {
    top: 24px;
    opacity: 0.8;
  }
  6% {
    top: 24px;
    opacity: 1;
  }
  8% {
    top: 48px;
    opacity: 0.8;
  }
  10% {
    top: 48px;
    opacity: 1;
  }
  12% {
    top: 72px;
    opacity: 0.8;
  }
  14% {
    top: 72px;
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    top: calc(100% - 2px);
    opacity: 0.2;
  }
`;

const highlight = keyframes`
  0% {
    opacity: 0;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.1;
    transform: scaleY(1.2);
  }
  100% {
    opacity: 0;
    transform: scaleY(1);
  }
`;

function AIAnalysisOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(1px)',
        zIndex: 10,
      }}
    >
      {/* Scanning line effect */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #2196f3, transparent)',
          animation: `${scan} 3s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          boxShadow: '0 0 8px rgba(33, 150, 243, 0.5)',
        }}
      />

      {/* Highlight effect */}
      <Box
        sx={{
          position: 'absolute',
          left: '5%',
          right: '5%',
          height: '24px',
          background: 'linear-gradient(transparent, rgba(33, 150, 243, 0.1), transparent)',
          animation: `${highlight} 3s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          transform: 'translateY(-12px)', // Center the highlight around the scanning line
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '16px 24px',
          borderRadius: 2,
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <AutoFixHighIcon
          sx={{
            fontSize: 48,
            color: 'primary.main',
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: 'primary.main',
            textAlign: 'center',
            fontWeight: 500,
            textShadow: '0 0 10px rgba(33, 150, 243, 0.3)',
          }}
        >
          AI Analyzing Resume...
        </Typography>
      </Box>
    </Box>
  );
}

export default AIAnalysisOverlay; 