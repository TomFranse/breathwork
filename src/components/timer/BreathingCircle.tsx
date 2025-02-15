import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreathingTimer } from '../../hooks/useBreathingTimer';
import { MainPhase, SubPhase } from '../../core/profiles/types';

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

const DebugOverlay = ({ 
  debugInfo, 
  mainPhase,
  subPhase,
  breath, 
  maxBreaths, 
  lungVolume 
}: {
  debugInfo: {
    elapsedTime: number;
    phaseDuration: number;
    progress: number;
    nextPhaseIn: number;
    mainPhase: {
      totalDuration: number;
      elapsedTime: number;
      progress: number;
      timeLeft: number;
    };
  };
  mainPhase: string;
  subPhase: string;
  breath: number;
  maxBreaths: number;
  lungVolume: number;
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
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        Phase: {mainPhase}
      </Typography>
      <Typography variant="caption" sx={{ ml: 2 }}>
        Sub-phase: {subPhase}
      </Typography>
      {mainPhase === 'breathing' && (
        <Typography variant="caption" sx={{ ml: 2 }}>
          Breath: {breath}/{maxBreaths}
        </Typography>
      )}
      <Typography variant="caption">
        Lung Volume: {Math.round(lungVolume)}%
      </Typography>
      <Box sx={{ mt: 1, mb: 1, borderTop: '1px solid rgba(0,0,0,0.1)', pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Main Phase ({mainPhase}):
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
          Progress: {(debugInfo.mainPhase.progress * 100).toFixed(1)}%
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
          Time Left: {(debugInfo.mainPhase.timeLeft / 1000).toFixed(1)}s
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block', color: 'text.secondary' }}>
          Total Duration: {(debugInfo.mainPhase.totalDuration / 1000).toFixed(1)}s
        </Typography>
      </Box>
      <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Sub Phase ({subPhase}):
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
          Progress: {(debugInfo.progress * 100).toFixed(1)}%
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
          Time Left: {(debugInfo.nextPhaseIn / 1000).toFixed(1)}s
        </Typography>
        <Typography variant="caption" sx={{ ml: 2, display: 'block', color: 'text.secondary' }}>
          Total Duration: {(debugInfo.phaseDuration / 1000).toFixed(1)}s
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const getPhaseLabel = (mainPhase: MainPhase | undefined, subPhase: SubPhase | undefined): string => {
  if (!mainPhase || !subPhase) return 'Starting...';
  if (subPhase === 'let_go') return 'Let Go';
  return subPhase.charAt(0).toUpperCase() + subPhase.slice(1);
};

export function BreathingCircle() {
  const { 
    currentPhase: { main: mainPhase, sub: subPhase }, 
    breathCount,
    maxBreaths,
    isPaused, 
    isRecovery,
    lungVolume,
    debugInfo,
  } = useBreathingTimer();

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
          mainPhase={mainPhase}
          subPhase={subPhase}
          breath={breathCount}
          maxBreaths={maxBreaths}
          lungVolume={lungVolume}
        />
      )}
      <motion.div
        animate={{
          scale: getLungScale(lungVolume),
          opacity: mainPhase === 'complete' ? 0 : 1
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
            {isPaused ? 'Paused' : getPhaseLabel(mainPhase, subPhase)}
          </Typography>
          <AnimatePresence mode="wait">
            <motion.div
              key={isPaused ? 'paused' : `${mainPhase}-${subPhase}`}
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
                  textAlign: 'center'
                }}
              >
                {isPaused ? (
                  'Press play to continue'
                ) : (
                  <>
                    {mainPhase === 'breathing' && (
                      <Box component="span" sx={{ display: 'block' }}>
                        Breath {breathCount}/{maxBreaths}
                      </Box>
                    )}
                    {debugInfo && (
                      <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.9em' }}>
                        {(debugInfo.phaseDuration / 1000).toFixed(1)}s
                      </Box>
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