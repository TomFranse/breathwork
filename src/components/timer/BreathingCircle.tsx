import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';
import { useBreathing } from '../../context/BreathingContext';

const CIRCLE_SIZE = {
  min: 200,
  max: 400,
};

const animationVariants = {
  inhale: {
    scale: 1,
    transition: {
      duration: 2,
      ease: 'easeInOut',
    },
  },
  exhale: {
    scale: 0.5,
    transition: {
      duration: 2,
      ease: 'easeInOut',
    },
  },
  hold: {
    scale: 0.5,
    transition: {
      duration: 0.1,
      ease: 'linear',
    },
  },
  recovery_inhale: {
    scale: 1,
    transition: {
      duration: 2,
      ease: 'easeInOut',
    },
  },
  recovery_hold: {
    scale: 0.5,
    transition: {
      duration: 0.1,
      ease: 'linear',
    },
  },
  recovery_exhale: {
    scale: 0.5,
    transition: {
      duration: 2,
      ease: 'easeInOut',
    },
  },
};

const getPhaseLabel = (phase: string, isRecovery: boolean): string => {
  if (phase === 'hold') return 'Hold';
  if (phase === 'recovery_hold') return 'Recovery Hold';
  if (phase.startsWith('recovery_')) {
    return phase.split('_')[1].charAt(0).toUpperCase() + phase.split('_')[1].slice(1);
  }
  return phase.charAt(0).toUpperCase() + phase.slice(1);
};

export function BreathingCircle() {
  const { 
    currentPhase, 
    currentBreath,
    isPaused, 
    phaseTimings,
    isInRecoveryPhase,
  } = useBreathingTimer();

  const { state } = useBreathing();
  const { breathsBeforeHold } = state.settings;

  const currentAnimation = {
    scale: animationVariants[currentPhase].scale,
    transition: {
      ...animationVariants[currentPhase].transition,
      duration: isPaused ? 0 : phaseTimings[currentPhase],
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: CIRCLE_SIZE.max + 80,
        gap: 3,
      }}
    >
      <motion.div
        animate={currentAnimation}
        initial="exhale"
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