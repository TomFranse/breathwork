import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { BreathingSlider } from './BreathingSlider';
import { useBreathing } from '../../context/BreathingContext';

export function SettingsPage() {
  const { state, dispatch } = useBreathing();
  const { settings } = state;

  const handleStart = () => {
    dispatch({ type: 'START_SESSION' });
  };

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
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Breathwork Timer
        </Typography>

        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Configure your breathing session
        </Typography>

        <Box sx={{ width: '100%' }}>
          <BreathingSlider
            label="Breaths before Hold"
            value={settings.breathsBeforeHold}
            min={20}
            max={50}
            settingKey="breathsBeforeHold"
          />

          <BreathingSlider
            label="Inhale/Exhale Time"
            value={settings.inhaleExhaleTime}
            min={1}
            max={5}
            step={0.5}
            unit="s"
            settingKey="inhaleExhaleTime"
          />

          <BreathingSlider
            label="Breath Hold Target"
            value={settings.breathHoldTarget}
            min={30}
            max={180}
            step={5}
            unit="s"
            settingKey="breathHoldTarget"
          />

          <BreathingSlider
            label="Number of Rounds"
            value={settings.numberOfRounds}
            min={1}
            max={5}
            settingKey="numberOfRounds"
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PlayArrow />}
          onClick={handleStart}
          sx={{
            minWidth: 200,
            height: 56,
            borderRadius: 28,
            fontSize: '1.1rem',
            textTransform: 'none',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Start Session
        </Button>
      </Box>
    </Container>
  );
} 