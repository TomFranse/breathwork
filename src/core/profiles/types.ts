export type BreathingPhase = 
  | 'inhale'
  | 'exhale'
  | 'hold'
  | 'recovery_inhale'
  | 'recovery_hold'
  | 'recovery_exhale';

export interface BreathingSettings {
  breathsBeforeHold: number;
  inhaleExhaleTime: number;
  breathHoldTarget: number;
  numberOfRounds: number;
}

export interface PhaseTransition {
  next: BreathingPhase | ((state: BreathingState) => BreathingPhase);
  volume: number | 'maintain';
}

export interface PhaseSequences {
  main: Record<BreathingPhase, PhaseTransition>;
  recovery: Record<BreathingPhase, PhaseTransition>;
}

export interface BreathingProfile {
  id: string;
  name: string;
  description: string;
  defaultSettings: BreathingSettings;
  holdTimeProgression: (round: number, total: number, target: number) => number;
  phaseSequences: PhaseSequences;
}

export interface BreathingState {
  session: {
    isActive: boolean;
    isPaused: boolean;
    currentRound: number;
    totalRounds: number;
  };
  phase: {
    current: BreathingPhase;
    isRecovery: boolean;
    breathCount: number;
    maxBreaths: number;
  };
  timing: {
    inhaleTime: number;
    exhaleTime: number;
    holdTime: number;
    recoveryTime: number;
  };
  animation: {
    lungVolume: number;
    progress: number;
  };
}

export enum BreathingErrorType {
  INVALID_PHASE_TRANSITION = 'INVALID_PHASE_TRANSITION',
  TIMER_SYNC_ERROR = 'TIMER_SYNC_ERROR',
  INVALID_STATE = 'INVALID_STATE',
  ANIMATION_ERROR = 'ANIMATION_ERROR'
}

export class BreathingError extends Error {
  constructor(
    public type: BreathingErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BreathingError';
  }
}

export interface StateSnapshot {
  timestamp: number;
  state: BreathingState;
  action?: string;
  error?: BreathingError;
} 