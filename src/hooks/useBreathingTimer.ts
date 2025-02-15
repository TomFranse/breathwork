import { useEffect, useRef, useCallback } from 'react';
import { useBreathing } from '../context/BreathingContext';
import { BreathingPhase } from '../types';
import { PHASE_ORDER, RECOVERY_HOLD_TIME } from '../utils/constants';

interface PhaseTimings {
  [key: string]: number;
}

export function useBreathingTimer(): {
  currentPhase: BreathingPhase;
  currentRound: number;
  currentBreath: number;
  phaseTimings: PhaseTimings;
  isActive: boolean;
  isPaused: boolean;
  isInRecoveryPhase: boolean;
} {
  const { state, dispatch } = useBreathing();
  const { 
    isActive, 
    isPaused, 
    currentPhase, 
    currentRound, 
    currentBreath,
    isInRecoveryPhase 
  } = state.session;
  const { 
    breathsBeforeHold, 
    inhaleExhaleTime, 
    breathHoldTarget, 
    numberOfRounds 
  } = state.settings;
  
  // Reference to store the timer
  const timerRef = useRef<number>();
  
  // Calculate hold time based on round
  const getHoldTime = useCallback((round: number): number => {
    const fraction = round / numberOfRounds;
    if (fraction <= 1/3) return breathHoldTarget / 3;
    if (fraction <= 2/3) return (breathHoldTarget * 2) / 3;
    return breathHoldTarget;
  }, [breathHoldTarget, numberOfRounds]);

  // Phase timings in seconds
  const phaseTimings: PhaseTimings = {
    inhale: inhaleExhaleTime,
    exhale: inhaleExhaleTime,
    hold: getHoldTime(currentRound),
    recovery_inhale: inhaleExhaleTime,
    recovery_hold: RECOVERY_HOLD_TIME,
    recovery_exhale: inhaleExhaleTime,
  };

  // Handle phase transitions
  const moveToNextPhase = useCallback(() => {
    if (!isActive || isPaused) return;

    if (!isInRecoveryPhase) {
      // Main breathing phase
      if (currentPhase === 'inhale') {
        dispatch({ type: 'UPDATE_PHASE', payload: 'exhale' });
      } else if (currentPhase === 'exhale') {
        // Increment breath count after completing an exhale
        dispatch({ type: 'INCREMENT_BREATH' });
        
        if (currentBreath < breathsBeforeHold) {
          dispatch({ type: 'UPDATE_PHASE', payload: 'inhale' });
        } else {
          // Move to recovery phase
          dispatch({ type: 'SET_RECOVERY_PHASE', payload: true });
          dispatch({ type: 'UPDATE_PHASE', payload: 'hold' });
        }
      }
    } else {
      // Recovery phase sequence
      const currentIndex = PHASE_ORDER.recovery.indexOf(currentPhase as BreathingPhase);
      if (currentIndex < PHASE_ORDER.recovery.length - 1) {
        // Move to next recovery phase
        dispatch({ 
          type: 'UPDATE_PHASE', 
          payload: PHASE_ORDER.recovery[currentIndex + 1] 
        });
      } else {
        // End of round
        if (currentRound >= numberOfRounds) {
          dispatch({ type: 'STOP_SESSION' });
          return;
        }
        // Move to next round
        dispatch({ type: 'UPDATE_ROUND', payload: currentRound + 1 });
        dispatch({ type: 'UPDATE_PHASE', payload: 'inhale' });
      }
    }
  }, [
    currentPhase,
    currentRound,
    currentBreath,
    breathsBeforeHold,
    numberOfRounds,
    isActive,
    isPaused,
    isInRecoveryPhase,
    dispatch
  ]);

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const currentTiming = phaseTimings[currentPhase] * 1000; // Convert to milliseconds
    timerRef.current = window.setTimeout(moveToNextPhase, currentTiming);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, isPaused, currentPhase, phaseTimings, moveToNextPhase]);

  return {
    currentPhase,
    currentRound,
    currentBreath,
    phaseTimings,
    isActive,
    isPaused,
    isInRecoveryPhase,
  };
} 