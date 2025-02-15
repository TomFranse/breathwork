export type MainPhase = 
  | 'breathing'
  | 'hold'
  | 'recover'
  | 'complete';

export type SubPhase = 
  | 'inhale'
  | 'exhale'
  | 'hold'
  | 'let_go';

export interface BreathingSettings {
  breathsBeforeHold: number;
  inhaleExhaleTime: number;
  breathHoldTarget: number;
  numberOfRounds: number;
}

export interface PhaseTransition {
  next: { main: MainPhase; sub: SubPhase } | ((state: BreathingState) => { main: MainPhase; sub: SubPhase });
  volume: number | 'maintain';
}

export interface PhaseSequences {
  breathing: Record<SubPhase, PhaseTransition>;
  hold: Record<SubPhase, PhaseTransition>;
  recover: Record<SubPhase, PhaseTransition>;
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
    main: MainPhase;
    sub: SubPhase;
    isRecovery: boolean;
    breathCount: number;
    maxBreaths: number;
    fadeAnimation?: {
      type: 'in' | 'out';
      progress: number;
    };
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