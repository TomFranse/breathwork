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
  mainPhase: {
    totalDuration: number;
    elapsedTime: number;
    progress: number;
    timeLeft: number;
  };
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
  const mainPhaseStartTime = useRef<number>(0);
  const debugInfoRef = useRef<TimerState>({
    elapsedTime: 0,
    phaseDuration: 0,
    progress: 0,
    nextPhaseIn: 0,
    mainPhase: {
      totalDuration: 0,
      elapsedTime: 0,
      progress: 0,
      timeLeft: 0,
    },
  });

  // Update refs when dependencies change
  useEffect(() => {
    stateRef.current = state;
    phaseManagerRef.current = phaseManager;
  }, [state, phaseManager]);

  // Reset main phase timer when main phase changes
  useEffect(() => {
    mainPhaseStartTime.current = Date.now();
  }, [mainPhase]);

  // Calculate total duration for main phase
  const getMainPhaseDuration = useCallback((phase: MainPhase): number => {
    const { timing } = stateRef.current;
    switch (phase) {
      case 'breathing':
        return timing.inhaleTime * 2 * maxBreaths * 1000; // inhale + exhale for each breath
      case 'hold':
        return timing.holdTime * 1000;
      case 'recover':
        return (timing.inhaleTime + RECOVERY_HOLD_TIME + timing.inhaleTime) * 1000; // inhale + hold + exhale
      case 'complete':
        return 0;
      default:
        throw new BreathingError(
          BreathingErrorType.INVALID_STATE,
          `Invalid main phase: ${phase}`
        );
    }
  }, [maxBreaths]);

  // Calculate phase duration for sub-phase
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

            const subPhaseDuration = getPhaseDuration({
              main: currentState.phase.main,
              sub: currentState.phase.sub
            });

            const mainPhaseDuration = getMainPhaseDuration(currentState.phase.main);
            const mainPhaseElapsed = Date.now() - mainPhaseStartTime.current;
            
            // Update debug info
            debugInfoRef.current = {
              elapsedTime: progress * subPhaseDuration,
              phaseDuration: subPhaseDuration,
              progress,
              nextPhaseIn: subPhaseDuration * (1 - progress),
              mainPhase: {
                totalDuration: mainPhaseDuration,
                elapsedTime: mainPhaseElapsed,
                progress: Math.min(mainPhaseElapsed / mainPhaseDuration, 1),
                timeLeft: Math.max(mainPhaseDuration - mainPhaseElapsed, 0),
              },
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
  }, [dispatch, getPhaseDuration, getMainPhaseDuration]);

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
      duration: phaseDuration / 1000,
      mainPhaseDuration: getMainPhaseDuration(mainPhase) / 1000,
    });

    timerRef.current?.start(phaseDuration);

    return () => {
      timerRef.current?.stop();
    };
  }, [isActive, isPaused, mainPhase, subPhase, getPhaseDuration, getMainPhaseDuration]);

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