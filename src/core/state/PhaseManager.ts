import { 
  BreathingState, 
  MainPhase,
  SubPhase,
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
      const { main: currentMain, sub: currentSub } = currentState.phase;

      // Handle complete phase
      if (currentMain === 'complete') {
        return;
      }

      const sequence = this.sequences[currentMain as keyof PhaseSequences];

      if (!sequence) {
        throw new BreathingError(
          BreathingErrorType.INVALID_PHASE_TRANSITION,
          `No sequence defined for main phase ${currentMain}`,
          { currentState }
        );
      }

      const transition = sequence[currentSub];
      if (!transition) {
        throw new BreathingError(
          BreathingErrorType.INVALID_PHASE_TRANSITION,
          `No transition defined for sub phase ${currentSub} in ${currentMain}`,
          { currentState }
        );
      }

      const nextPhase = typeof transition.next === 'function'
        ? transition.next(currentState)
        : transition.next;

      // Initialize state updates with required fields
      const updates: Partial<BreathingState> = {
        phase: {
          main: nextPhase.main,
          sub: nextPhase.sub,
          isRecovery: nextPhase.main === 'recover',
          breathCount: currentState.phase.breathCount,
          maxBreaths: currentState.phase.maxBreaths
        },
        animation: {
          lungVolume: currentState.animation.lungVolume,
          progress: 0
        }
      };

      // Handle breath counting
      if (currentMain === 'breathing' && currentSub === 'exhale') {
        const newBreathCount = currentState.phase.breathCount + 1;
        updates.phase = {
          ...updates.phase,
          breathCount: newBreathCount,
        } as BreathingState['phase'];
      }

      // Handle round transitions
      if (currentMain === 'recover' && currentSub === 'let_go') {
        if (currentState.session.currentRound >= currentState.session.totalRounds) {
          // Session complete
          updates.session = {
            ...currentState.session,
            isActive: false,
            isPaused: false
          };
          updates.phase = {
            main: 'complete',
            sub: 'inhale',
            isRecovery: false,
            breathCount: 0,
            maxBreaths: currentState.phase.maxBreaths
          };
        } else {
          // Complete state reset for new round
          updates.session = {
            ...currentState.session,
            currentRound: currentState.session.currentRound + 1,
            isPaused: false
          };
          updates.phase = {
            main: 'breathing',
            sub: 'inhale',
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
    const { main: currentMain, sub: currentSub } = currentState.phase;

    // Handle complete phase
    if (currentMain === 'complete') {
      return 0;
    }

    const sequence = this.sequences[currentMain as keyof PhaseSequences];

    if (!sequence) {
      throw new BreathingError(
        BreathingErrorType.INVALID_STATE,
        `No sequence defined for main phase ${currentMain}`,
        { currentState }
      );
    }

    const transition = sequence[currentSub];
    if (!transition) {
      throw new BreathingError(
        BreathingErrorType.INVALID_STATE,
        `No transition defined for sub phase ${currentSub} in ${currentMain}`,
        { currentState }
      );
    }

    if (transition.volume === 'maintain') {
      return currentState.animation.lungVolume;
    }

    const startVolume = currentSub.includes('inhale') ? 0 : 100;
    const endVolume = transition.volume;

    return startVolume + (endVolume - startVolume) * progress;
  }
} 