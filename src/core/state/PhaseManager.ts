import { 
  BreathingState, 
  MainPhase,
  SubPhase,
  PhaseSequences,
  PhaseTransition,
  BreathingError,
  BreathingErrorType
} from '../profiles/types';

// Define valid phase transitions explicitly
type PhaseTransitionMap = {
  [K in MainPhase]: {
    validSubPhases: SubPhase[];
    nextMainPhase: MainPhase;
    subPhaseOrder: SubPhase[];
    onTransition: (state: BreathingState) => boolean;
    onEnter?: (state: BreathingState) => Partial<BreathingState>;
    onExit?: (state: BreathingState) => Partial<BreathingState>;
  };
};

const PHASE_TRANSITIONS: PhaseTransitionMap = {
  breathing: {
    validSubPhases: ['inhale', 'exhale'],
    nextMainPhase: 'hold',
    subPhaseOrder: ['inhale', 'exhale'],
    onTransition: (state) => state.phase.breathCount >= state.phase.maxBreaths - 1,
    onEnter: (state) => ({
      phase: {
        main: 'breathing',
        sub: 'inhale',
        isRecovery: false,
        breathCount: 0,
        maxBreaths: state.phase.maxBreaths
      }
    })
  },
  hold: {
    validSubPhases: ['hold'],
    nextMainPhase: 'recover',
    subPhaseOrder: ['hold'],
    onTransition: () => true, // Always transition after hold
    onEnter: (state) => ({
      phase: {
        main: 'hold',
        sub: 'hold',
        isRecovery: false,
        breathCount: 0,
        maxBreaths: state.phase.maxBreaths
      }
    })
  },
  recover: {
    validSubPhases: ['inhale', 'hold', 'let_go'],
    nextMainPhase: 'complete',
    subPhaseOrder: ['inhale', 'hold', 'let_go'],
    onTransition: (state) => true, // Always transition after let_go
    onEnter: (state) => ({
      phase: {
        main: 'recover',
        sub: 'inhale',
        isRecovery: true,
        breathCount: 0,
        maxBreaths: state.phase.maxBreaths
      }
    }),
    onExit: (state) => {
      // Handle round transitions
      if (state.session.currentRound >= state.session.totalRounds) {
        return {
          session: {
            ...state.session,
            isActive: false,
            isPaused: false
          },
          phase: {
            main: 'complete',
            sub: 'inhale',
            isRecovery: false,
            breathCount: 0,
            maxBreaths: state.phase.maxBreaths
          },
          animation: {
            lungVolume: 0,
            progress: 0
          }
        };
      }
      // Start new round
      return {
        session: {
          ...state.session,
          currentRound: state.session.currentRound + 1,
          isPaused: false
        },
        phase: {
          main: 'breathing',
          sub: 'inhale',
          isRecovery: false,
          breathCount: 0,
          maxBreaths: state.phase.maxBreaths
        },
        animation: {
          lungVolume: 0,
          progress: 0
        }
      };
    }
  },
  complete: {
    validSubPhases: ['inhale'],
    nextMainPhase: 'complete',
    subPhaseOrder: ['inhale'],
    onTransition: () => false, // Never transition from complete
    onEnter: (state) => ({
      session: {
        ...state.session,
        isActive: false,
        isPaused: false
      },
      phase: {
        main: 'complete',
        sub: 'inhale',
        isRecovery: false,
        breathCount: 0,
        maxBreaths: state.phase.maxBreaths
      },
      animation: {
        lungVolume: 0,
        progress: 0
      }
    })
  }
};

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

  private getNextSubPhase(currentState: BreathingState): SubPhase {
    const { main, sub } = currentState.phase;
    const { subPhaseOrder } = PHASE_TRANSITIONS[main];
    
    const currentIndex = subPhaseOrder.indexOf(sub);
    return currentIndex < subPhaseOrder.length - 1 
      ? subPhaseOrder[currentIndex + 1] 
      : subPhaseOrder[0];
  }

  private shouldTransitionMainPhase(currentState: BreathingState): boolean {
    const { main, sub } = currentState.phase;
    const phaseConfig = PHASE_TRANSITIONS[main];
    
    // Only check for main phase transition at the end of sub-phase sequence
    const isLastSubPhase = sub === phaseConfig.subPhaseOrder[phaseConfig.subPhaseOrder.length - 1];
    return isLastSubPhase && phaseConfig.onTransition(currentState);
  }

  moveToNextPhase(currentState: BreathingState): void {
    try {
      const { main: currentMain, sub: currentSub } = currentState.phase;
      const currentPhaseConfig = PHASE_TRANSITIONS[currentMain];

      // Validate current state
      if (!currentPhaseConfig.validSubPhases.includes(currentSub)) {
        throw new BreathingError(
          BreathingErrorType.INVALID_PHASE_TRANSITION,
          `Invalid sub-phase ${currentSub} for main phase ${currentMain}`,
          { currentState }
        );
      }

      let updates: Partial<BreathingState> = {};

      // Handle breath counting in breathing phase
      if (currentMain === 'breathing' && currentSub === 'exhale') {
        updates.phase = {
          main: currentMain,
          sub: currentSub,
          isRecovery: false,
          breathCount: currentState.phase.breathCount + 1,
          maxBreaths: currentState.phase.maxBreaths
        };
      }

      // Check if we should transition to next main phase
      if (this.shouldTransitionMainPhase(currentState)) {
        const nextMain = currentPhaseConfig.nextMainPhase;
        const nextPhaseConfig = PHASE_TRANSITIONS[nextMain];

        // Apply exit handlers
        if (currentPhaseConfig.onExit) {
          updates = { ...updates, ...currentPhaseConfig.onExit(currentState) };
        }

        // Apply enter handlers
        if (nextPhaseConfig.onEnter) {
          updates = { ...updates, ...nextPhaseConfig.onEnter(currentState) };
        }
      } else {
        // Just move to next sub-phase
        const nextSub = this.getNextSubPhase(currentState);
        updates.phase = {
          main: currentMain,
          sub: nextSub,
          isRecovery: currentMain === 'recover',
          breathCount: currentState.phase.breathCount,
          maxBreaths: currentState.phase.maxBreaths
        };
      }

      // Set animation updates based on next phase
      if (currentMain !== 'complete') {
        const sequence = this.sequences[currentMain as keyof PhaseSequences];
        const transition = sequence[currentSub];
        if (transition.volume !== 'maintain') {
          updates.animation = {
            lungVolume: transition.volume,
            progress: 0
          };
        }
      }

      // Debug log for phase transitions
      console.log('Phase transition:', {
        from: `${currentMain}/${currentSub}`,
        to: updates.phase ? `${updates.phase.main}/${updates.phase.sub}` : 'no phase update',
        state: updates
      });

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
      return 0;
    }

    // Type guard for sequence access
    let transition: PhaseTransition | undefined;
    switch (currentMain) {
      case 'breathing':
        transition = (sequence as Record<SubPhase, PhaseTransition>)[currentSub];
        break;
      case 'hold':
        transition = (sequence as { hold: PhaseTransition }).hold;
        break;
      case 'recover':
        transition = (sequence as { inhale: PhaseTransition; hold: PhaseTransition; let_go: PhaseTransition })[currentSub];
        break;
      default:
        return 0;
    }

    if (!transition || transition.volume === 'maintain') {
      return currentState.animation.lungVolume;
    }

    const startVolume = currentSub.includes('inhale') ? 0 : 100;
    const endVolume = transition.volume;

    return startVolume + (endVolume - startVolume) * progress;
  }
} 