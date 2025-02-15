import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useBreathing } from '../../context/BreathingContext';
import { BreathingSettings } from '../../core/profiles/types';

interface BreathingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  settingKey: keyof BreathingSettings;
}

export function BreathingSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  settingKey,
}: BreathingSliderProps) {
  const { state, dispatch } = useBreathing();

  const handleChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    
    // Create the appropriate state update based on the setting key
    const update = {
      type: 'UPDATE_STATE' as const,
      payload: (() => {
        switch (settingKey) {
          case 'breathsBeforeHold':
            return {
              phase: {
                ...state.phase,
                maxBreaths: value
              }
            };
          case 'inhaleExhaleTime':
            return {
              timing: {
                ...state.timing,
                inhaleTime: value,
                exhaleTime: value,
                recoveryTime: value
              }
            };
          case 'breathHoldTarget':
            return {
              timing: {
                ...state.timing,
                holdTime: value
              }
            };
          case 'numberOfRounds':
            return {
              session: {
                ...state.session,
                totalRounds: value
              }
            };
        }
      })()
    };

    dispatch(update);
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1 
      }}>
        <Typography variant="subtitle1" color="text.primary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value}{unit}
        </Typography>
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        aria-label={label}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}${unit}`}
        sx={{
          '& .MuiSlider-thumb': {
            width: 28,
            height: 28,
            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
            '&:before': {
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
            },
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0px 0px 0px 8px rgb(75 144 141 / 16%)',
            },
            '&.Mui-active': {
              width: 34,
              height: 34,
            },
          },
          '& .MuiSlider-rail': {
            opacity: 0.32,
          },
        }}
      />
    </Box>
  );
} 