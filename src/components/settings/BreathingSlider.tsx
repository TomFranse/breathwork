import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useBreathing } from '../../context/BreathingContext';

interface BreathingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  settingKey: 'breathsBeforeHold' | 'inhaleExhaleTime' | 'breathHoldTarget' | 'numberOfRounds';
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
  const { dispatch } = useBreathing();

  const handleChange = (_event: Event, newValue: number | number[]) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { [settingKey]: newValue as number },
    });
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