import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';

export function ProgressBar() {
  const { currentRound, totalRounds } = useBreathingTimer();
  const progress = (currentRound / totalRounds) * 100;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 1,
      }}>
        <Typography variant="body2" color="text.secondary">
          Round {currentRound} of {totalRounds}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(75, 144, 141, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: '#4B908D',
          },
        }}
      />
    </Box>
  );
} 