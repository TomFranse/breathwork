import { 
  BreathingState, 
  BreathingPhase,
  PhaseSequences,
  BreathingError,
  BreathingErrorType
} from '../profiles/types';
import { validatePhaseTransition } from './StateValidator';

export interface PhaseManagerConfig {
  sequences: PhaseSequences;
  onStateChange: (state: Partial<BreathingState>) => void;
  onError?: (error: BreathingError) => void;
}

export class PhaseManager {
  private sequences: PhaseSequences;
  private onStateChange: (state: Partial<BreathingState>) => void;
  private onError?: (error: BreathingError) => void;

  constructor(config: PhaseManagerConfig) {
    this.sequences = config.sequences;
    this.onStateChange = config.onStateChange;
    this.onError = config.onError;
  }

  moveToNextPhase(currentState: BreathingState): void {
    try {
      const { current: currentPhase } = currentState.phase;
      const sequence = currentState.phase.isRecovery 
        ? this.sequences.recovery 
        : this.sequences.main;

      const transition = sequence[currentPhase];
      if (!transition) {
        throw new BreathingError(
          BreathingErrorType.INVALID_PHASE_TRANSITION,
          `No transition defined for phase ${currentPhase}`,
          { currentState }
        );
      }

      const nextPhase = typeof transition.next === 'function'
        ? transition.next(currentState)
        : transition.next;

      // Validate the transition
      validatePhaseTransition(
        currentPhase,
        nextPhase,
        currentState,
        this.sequences
      );

      // Initialize state updates with required fields
      const updates: Partial<BreathingState> = {
        phase: {
          current: nextPhase,
          isRecovery: currentState.phase.isRecovery,
          breathCount: currentState.phase.breathCount,
          maxBreaths: currentState.phase.maxBreaths
        },
        animation: {
          lungVolume: currentState.animation.lungVolume,
          progress: 0
        }
      };

      // Handle breath counting
      if (currentPhase === 'exhale' && !currentState.phase.isRecovery) {
        const newBreathCount = currentState.phase.breathCount + 1;
        updates.phase = {
          current: nextPhase,
          breathCount: newBreathCount,
          isRecovery: newBreathCount >= currentState.phase.maxBreaths,
          maxBreaths: currentState.phase.maxBreaths
        };
      }

      // Handle round transitions
      if (currentState.phase.isRecovery && currentPhase === 'recovery_exhale') {
        if (currentState.session.currentRound >= currentState.session.totalRounds) {
          // Session complete
          updates.session = {
            ...currentState.session,
            isActive: false,
            isPaused: false
          };
        } else {
          // Complete state reset for new round
          updates.session = {
            ...currentState.session,
            currentRound: currentState.session.currentRound + 1,
            isPaused: false
          };
          updates.phase = {
            current: 'inhale',
            isRecovery: false,
            breathCount: 0,
            maxBreaths: currentState.phase.maxBreaths
          };
          updates.animation = {
            lungVolume: 0,
            progress: 0
          };
          updates.timing = {
            ...currentState.timing
          };
          return this.onStateChange(updates);
        }
      }

      // Set lung volume based on the transition
      if (transition.volume !== 'maintain') {
        updates.animation = {
          lungVolume: transition.volume,
          progress: 0
        };
      }

      this.onStateChange(updates);
    } catch (error) {
      if (error instanceof BreathingError) {
        this.onError?.(error);
      }
      throw error;
    }
  }

  calculatePhaseVolume(
    currentState: BreathingState,
    progress: number
  ): number {
    const { current: currentPhase } = currentState.phase;
    const sequence = currentState.phase.isRecovery 
      ? this.sequences.recovery 
      : this.sequences.main;

    const transition = sequence[currentPhase];
    if (!transition) {
      throw new BreathingError(
        BreathingErrorType.INVALID_STATE,
        `No transition defined for phase ${currentPhase}`,
        { currentState }
      );
    }

    if (transition.volume === 'maintain') {
      return currentState.animation.lungVolume;
    }

    const startVolume = currentPhase.includes('inhale') ? 0 : 100;
    const endVolume = transition.volume;

    return startVolume + (endVolume - startVolume) * progress;
  }
} 