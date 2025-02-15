import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useBreathing } from '../../context/BreathingContext';

export function TestSetup() {
  const { state, dispatch } = useBreathing();

  return (
    <Container 
      maxWidth="sm" 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Box 
        sx={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: { xs: 2, sm: 4 },
        }}
      >
        <Typography variant="h4" align="center">
          Setup Test
        </Typography>
        
        {/* Test Theme */}
        <Box sx={{ 
          width: '100%',
          p: 3, 
          bgcolor: 'background.default',
          borderRadius: 2,
          boxShadow: 1,
          textAlign: 'center'
        }}>
          <Typography color="text.primary">
            Theme Test - This should use theme colors
          </Typography>
        </Box>

        {/* Test Context */}
        <Box 
          sx={{ 
            width: '100%',
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography variant="h6" align="center" gutterBottom>
            Current Settings:
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              m: 0,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {JSON.stringify(state.settings, null, 2)}
          </Box>
        </Box>

        {/* Test Context Updates */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ 
            minWidth: 200,
            py: 1.5
          }}
          onClick={() => dispatch({ 
            type: 'UPDATE_SETTINGS', 
            payload: { breathHold: state.settings.breathHold + 5 } 
          })}
        >
          Increase Breath Hold (+5s)
        </Button>
      </Box>
    </Container>
  );
} 