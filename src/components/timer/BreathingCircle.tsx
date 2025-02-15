import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';
import { useBreathing } from '../../context/BreathingContext';

const CIRCLE_SIZE = {
  min: 200,
  max: 400,
};

// Scale factor calculation based on lung volume (0-100)
const getLungScale = (volume: number) => {
  const minScale = 0.5; // 50% of size when empty
  const maxScale = 1.0; // 100% of size when full
  return minScale + (maxScale - minScale) * (volume / 100);
};

const getPhaseLabel = (phase: string, isRecovery: boolean): string => {
  if (phase === 'hold') return 'Hold';
  if (phase === 'recovery_hold') return 'Recovery Hold';
  if (phase.startsWith('recovery_')) {
    return phase.split('_')[1].charAt(0).toUpperCase() + phase.split('_')[1].slice(1);
  }
  return phase.charAt(0).toUpperCase() + phase.slice(1);
};

const DebugOverlay = ({ debugInfo, phase, breath, maxBreaths }: {
  debugInfo: any;
  phase: string;
  breath: number;
  maxBreaths: number;
}) => (
  <Paper
    sx={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 1000,
      minWidth: '200px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}
  >
    <Typography variant="subtitle2" color="primary">Debug Info</Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption">
        Phase: {phase} ({breath}/{maxBreaths})
      </Typography>
      <Typography variant="caption">
        Progress: {(debugInfo?.progress * 100 || 0).toFixed(1)}%
      </Typography>
      <Typography variant="caption">
        Time Left: {((debugInfo?.nextPhaseIn || 0) / 1000).toFixed(1)}s
      </Typography>
      <Typography variant="caption">
        Duration: {((debugInfo?.phaseDuration || 0) / 1000).toFixed(1)}s
      </Typography>
    </Box>
  </Paper>
);

export function BreathingCircle() {
  const { 
    currentPhase, 
    currentBreath,
    isPaused, 
    phaseTimings,
    isInRecoveryPhase,
    lungVolume,
    debugInfo,
  } = useBreathingTimer();

  const { state } = useBreathing();
  const { breathsBeforeHold } = state.settings;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: CIRCLE_SIZE.max + 80,
        gap: 3,
      }}
    >
      {debugInfo && (
        <DebugOverlay
          debugInfo={debugInfo}
          phase={currentPhase}
          breath={currentBreath}
          maxBreaths={breathsBeforeHold}
        />
      )}
      <motion.div
        animate={{
          scale: getLungScale(lungVolume)
        }}
        transition={{
          duration: 0.016, // Approximately 1 frame at 60fps
          ease: "linear"
        }}
        style={{
          width: CIRCLE_SIZE.min,
          height: CIRCLE_SIZE.min,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F9DCC4 0%, #B8E0D2 100%)',
          boxShadow: '0px 0px 40px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <motion.div
          style={{
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#4B908D',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {isPaused ? 'Paused' : getPhaseLabel(currentPhase, isInRecoveryPhase)}
          </Typography>
          <AnimatePresence mode="wait">
            <motion.div
              key={isPaused ? 'paused' : currentPhase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400,
                }}
              >
                {isPaused ? (
                  'Press play to continue'
                ) : (
                  <>
                    {phaseTimings[currentPhase]}s
                    {!isInRecoveryPhase && !currentPhase.includes('hold') && (
                      <span> • Breath {currentBreath}/{breathsBeforeHold}</span>
                    )}
                  </>
                )}
              </Typography>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Box>
  );
} 