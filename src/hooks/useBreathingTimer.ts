import { useEffect, useRef, useCallback } from 'react';
import { useBreathing } from '../context/BreathingContext';
import { MainPhase, SubPhase, BreathingError, BreathingErrorType } from '../core/profiles/types';
import { BreathingTimer } from '../core/timing/BreathingTimer';
import { RECOVERY_HOLD_TIME } from '../utils/constants';

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

interface TimerState {
  elapsedTime: number;
  phaseDuration: number;
  progress: number;
  nextPhaseIn: number;
}

export function useBreathingTimer() {
  const { state, dispatch, phaseManager } = useBreathing();
  const { 
    session: { isActive, isPaused, currentRound, totalRounds },
    phase: { main: mainPhase, sub: subPhase, breathCount, maxBreaths },
    animation: { lungVolume }
  } = state;

  // Refs for timer instances and state
  const timerRef = useRef<BreathingTimer | null>(null);
  const stateRef = useRef(state);
  const phaseManagerRef = useRef(phaseManager);
  const debugInfoRef = useRef<TimerState>({
    elapsedTime: 0,
    phaseDuration: 0,
    progress: 0,
    nextPhaseIn: 0,
  });

  // Update refs when dependencies change
  useEffect(() => {
    stateRef.current = state;
    phaseManagerRef.current = phaseManager;
  }, [state, phaseManager]);

  // Calculate phase duration
  const getPhaseDuration = useCallback((phase: { main: MainPhase, sub: SubPhase }): number => {
    if (phase.main === 'complete') {
      return 0;
    }

    const { timing } = stateRef.current;
    switch (phase.sub) {
      case 'inhale':
      case 'exhale':
      case 'let_go':
        return timing.inhaleTime * 1000;
      case 'hold':
        if (phase.main === 'recover') {
          return RECOVERY_HOLD_TIME * 1000;
        }
        return timing.holdTime * 1000;
      default:
        throw new BreathingError(
          BreathingErrorType.INVALID_STATE,
          `Invalid phase: ${phase.main}/${phase.sub}`
        );
    }
  }, []);

  // Initialize timer once
  useEffect(() => {
    if (!timerRef.current) {
      timerRef.current = new BreathingTimer({
        onTick: (progress: number) => {
          try {
            const currentState = stateRef.current;
            const currentPhaseManager = phaseManagerRef.current;

            // Don't update if in complete phase
            if (currentState.phase.main === 'complete') {
              return;
            }

            const phaseDuration = getPhaseDuration({
              main: currentState.phase.main,
              sub: currentState.phase.sub
            });
            
            // Update debug info
            debugInfoRef.current = {
              elapsedTime: progress * phaseDuration,
              phaseDuration,
              progress,
              nextPhaseIn: phaseDuration * (1 - progress),
            };

            // Calculate and update lung volume
            const volume = currentPhaseManager.calculatePhaseVolume(currentState, progress);
            dispatch({ 
              type: 'UPDATE_STATE', 
              payload: { 
                animation: { 
                  lungVolume: volume,
                  progress 
                } 
              } 
            });
          } catch (error) {
            debugLog('Error during tick:', error);
            if (error instanceof BreathingError) {
              throw error;
            }
          }
        },
        onComplete: () => {
          try {
            const currentState = stateRef.current;
            // Don't transition if in complete phase
            if (currentState.phase.main === 'complete') {
              return;
            }
            const currentPhaseManager = phaseManagerRef.current;
            currentPhaseManager.moveToNextPhase(currentState);
          } catch (error) {
            debugLog('Error during phase transition:', error);
            if (error instanceof BreathingError) {
              throw error;
            }
          }
        },
        onError: (error) => console.error('Timer error:', error),
      });
    }

    return () => {
      if (timerRef.current) {
        timerRef.current.stop();
        timerRef.current = null;
      }
    };
  }, [dispatch, getPhaseDuration]);

  // Handle timer state
  useEffect(() => {
    if (!isActive || isPaused || mainPhase === 'complete') {
      debugLog('Timer inactive, paused, or complete');
      timerRef.current?.stop();
      return;
    }

    const phaseDuration = getPhaseDuration({ main: mainPhase, sub: subPhase });
    debugLog('Starting new phase:', {
      phase: `${mainPhase}/${subPhase}`,
      duration: phaseDuration / 1000
    });

    timerRef.current?.start(phaseDuration);

    return () => {
      timerRef.current?.stop();
    };
  }, [isActive, isPaused, mainPhase, subPhase, getPhaseDuration]);

  return {
    currentPhase: { main: mainPhase, sub: subPhase },
    currentRound,
    totalRounds,
    breathCount,
    maxBreaths,
    isActive,
    isPaused,
    isRecovery: mainPhase === 'recover',
    lungVolume,
    debugInfo: DEBUG ? debugInfoRef.current : undefined,
  };
} 