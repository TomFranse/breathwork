import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBreathing } from '../context/BreathingContext';
import { BreathingPhase } from '../types';
import { PHASE_ORDER, RECOVERY_HOLD_TIME } from '../utils/constants';

interface PhaseTimings {
  [key: string]: number;
}

// Debug helper
const DEBUG = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(
      `%c[Breathing Timer] ${message}`,
      'color: #4B908D; font-weight: bold;',
      data || ''
    );
  }
};

export function useBreathingTimer(): {
  currentPhase: BreathingPhase;
  currentRound: number;
  currentBreath: number;
  phaseTimings: PhaseTimings;
  isActive: boolean;
  isPaused: boolean;
  isInRecoveryPhase: boolean;
  lungVolume: number;
  debugInfo?: {
    elapsedTime?: number;
    phaseDuration?: number;
    progress?: number;
    nextPhaseIn?: number;
  };
} {
  const { state, dispatch } = useBreathing();
  const { 
    isActive, 
    isPaused, 
    currentPhase, 
    currentRound, 
    currentBreath,
    isInRecoveryPhase,
    lungVolume 
  } = state.session;
  const { 
    breathsBeforeHold, 
    inhaleExhaleTime, 
    breathHoldTarget, 
    numberOfRounds 
  } = state.settings;
  
  // Refs for timers and animation
  const timerRef = useRef<number | undefined>(undefined);
  const animationFrameRef = useRef<number>();
  
  // Refs for state that shouldn't trigger rerenders
  const phaseStartTimeRef = useRef<number>(0);
  const debugInfoRef = useRef({
    elapsedTime: 0,
    phaseDuration: 0,
    progress: 0,
    nextPhaseIn: 0,
  });
  
  // Stable reference to current state values
  const stateRef = useRef({
    isActive,
    isPaused,
    currentPhase,
    currentRound,
    currentBreath,
    isInRecoveryPhase,
    breathsBeforeHold,
    inhaleExhaleTime,
    breathHoldTarget,
    numberOfRounds,
  });

  // Update state ref when values change
  useEffect(() => {
    stateRef.current = {
      isActive,
      isPaused,
      currentPhase,
      currentRound,
      currentBreath,
      isInRecoveryPhase,
      breathsBeforeHold,
      inhaleExhaleTime,
      breathHoldTarget,
      numberOfRounds,
    };
  });

  // Calculate hold time based on round (stable reference)
  const getHoldTime = useCallback((round: number): number => {
    const { numberOfRounds, breathHoldTarget } = stateRef.current;
    const fraction = round / numberOfRounds;
    if (fraction <= 1/3) return breathHoldTarget / 3;
    if (fraction <= 2/3) return (breathHoldTarget * 2) / 3;
    return breathHoldTarget;
  }, []); // Empty deps as we use stateRef

  // Phase timings in seconds (memoized)
  const phaseTimings = useMemo(() => ({
    inhale: inhaleExhaleTime,
    exhale: inhaleExhaleTime,
    hold: getHoldTime(currentRound),
    recovery_inhale: inhaleExhaleTime,
    recovery_hold: RECOVERY_HOLD_TIME,
    recovery_exhale: inhaleExhaleTime,
  }), [inhaleExhaleTime, currentRound, getHoldTime]);

  // Update lung volume based on elapsed time (stable reference)
  const updateLungVolume = useCallback(() => {
    const { isActive, isPaused, currentPhase } = stateRef.current;

    if (!isActive || isPaused || currentPhase.includes('hold')) {
      debugLog('Skipping lung volume update:', {
        isActive,
        isPaused,
        currentPhase,
        reason: !isActive ? 'inactive' : isPaused ? 'paused' : 'hold phase'
      });
      return;
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - phaseStartTimeRef.current;
    const phaseDuration = phaseTimings[currentPhase] * 1000;
    const progress = Math.min(elapsedTime / phaseDuration, 1);

    debugInfoRef.current = {
      elapsedTime,
      phaseDuration,
      progress,
      nextPhaseIn: phaseDuration - elapsedTime,
    };

    const volume = currentPhase.includes('inhale')
      ? progress * 100
      : 100 - (progress * 100);

    debugLog('Updating lung volume:', {
      phase: currentPhase,
      elapsed: Math.round(elapsedTime),
      duration: phaseDuration,
      progress: progress.toFixed(2),
      volume: Math.round(volume)
    });

    dispatch({ type: 'SET_LUNG_VOLUME', payload: volume });

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(updateLungVolume);
    }
  }, [dispatch, phaseTimings]); // Minimal deps

  // Handle phase transitions (stable reference)
  const moveToNextPhase = useCallback(() => {
    const state = stateRef.current;
    if (!state.isActive || state.isPaused) {
      debugLog('Skipping phase transition:', { 
        isActive: state.isActive, 
        isPaused: state.isPaused 
      });
      return;
    }

    debugLog('Moving to next phase:', {
      from: state.currentPhase,
      breath: state.currentBreath,
      round: state.currentRound,
      isRecovery: state.isInRecoveryPhase
    });

    // Calculate next phase
    const nextPhase = !state.isInRecoveryPhase
      ? (state.currentPhase === 'inhale'
          ? 'exhale'
          : state.currentPhase === 'exhale' && state.currentBreath < state.breathsBeforeHold
            ? 'inhale'
            : 'hold')
      : PHASE_ORDER.recovery[
          Math.min(
            PHASE_ORDER.recovery.indexOf(state.currentPhase as BreathingPhase) + 1,
            PHASE_ORDER.recovery.length - 1
          )
        ];

    // Handle breath counting and recovery phase
    if (state.currentPhase === 'exhale' && !state.isInRecoveryPhase) {
      dispatch({ type: 'INCREMENT_BREATH' });
      
      if (state.currentBreath >= state.breathsBeforeHold) {
        debugLog('Entering recovery phase');
        dispatch({ type: 'SET_RECOVERY_PHASE', payload: true });
      }
    }

    // Handle round transitions
    if (state.isInRecoveryPhase && state.currentPhase === 'recovery_exhale') {
      if (state.currentRound >= state.numberOfRounds) {
        debugLog('Session complete');
        dispatch({ type: 'STOP_SESSION' });
        return;
      }
      debugLog('Starting new round:', { nextRound: state.currentRound + 1 });
      dispatch({ type: 'UPDATE_ROUND', payload: state.currentRound + 1 });
      dispatch({ type: 'SET_RECOVERY_PHASE', payload: false });
    }

    debugLog('Phase transition complete:', { to: nextPhase });
    dispatch({ type: 'UPDATE_PHASE', payload: nextPhase as BreathingPhase });
  }, [dispatch]); // Minimal deps

  // Timer effect (stable dependencies)
  useEffect(() => {
    if (!isActive || isPaused) {
      debugLog('Timer paused or inactive');
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    debugLog('Starting new phase:', {
      phase: currentPhase,
      duration: phaseTimings[currentPhase]
    });

    // Reset phase start time and start new phase
    phaseStartTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(updateLungVolume);
    timerRef.current = window.setTimeout(moveToNextPhase, phaseTimings[currentPhase] * 1000);

    return () => {
      debugLog('Cleaning up timers');
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, isPaused, currentPhase, phaseTimings]); // Only core timing dependencies

  return {
    currentPhase,
    currentRound,
    currentBreath,
    phaseTimings,
    isActive,
    isPaused,
    isInRecoveryPhase,
    lungVolume,
    debugInfo: DEBUG ? debugInfoRef.current : undefined,
  };
} 