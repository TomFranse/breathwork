import React from 'react';
import { Box, Container } from '@mui/material';
import { BreathingCircle } from './BreathingCircle';
import { ProgressBar } from './ProgressBar';
import { Controls } from './Controls';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';

export function TimerPage() {
  const { isActive } = useBreathingTimer();

  if (!isActive) {
    return null; // Don't render if session is not active
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          p: { xs: 2, sm: 4 },
        }}
      >
        <ProgressBar />
        <BreathingCircle />
        <Controls />
      </Box>
    </Container>
  );
} 