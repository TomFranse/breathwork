import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import { useBreathing } from '../../context/BreathingContext';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';

export function Controls() {
  const { dispatch } = useBreathing();
  const { isActive, isPaused } = useBreathingTimer();

  const handlePlayPause = () => {
    if (isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };

  const handleStop = () => {
    dispatch({ type: 'STOP_SESSION' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        mt: 4,
      }}
    >
      <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
        <IconButton
          aria-label={isPaused ? 'resume session' : 'pause session'}
          onClick={handlePlayPause}
          sx={{
            width: 64,
            height: 64,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: 4,
            },
          }}
        >
          {isPaused ? (
            <PlayArrow sx={{ fontSize: 32, color: 'primary.main' }} />
          ) : (
            <Pause sx={{ fontSize: 32, color: 'primary.main' }} />
          )}
        </IconButton>
      </Tooltip>

      <Tooltip title="Stop">
        <IconButton
          aria-label="stop session"
          onClick={handleStop}
          sx={{
            width: 64,
            height: 64,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: 4,
            },
          }}
        >
          <Stop sx={{ fontSize: 32, color: 'primary.main' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
} 