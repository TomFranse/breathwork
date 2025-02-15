export interface BreathingSettings {
  breathsBeforeHold: number;
  inhaleExhaleTime: number;
  breathHoldTarget: number;
  numberOfRounds: number;
}

export type BreathingPhase = 
  | 'inhale'
  | 'exhale'
  | 'hold'
  | 'recovery_inhale'
  | 'recovery_hold'
  | 'recovery_exhale';

export interface SessionState {
  currentRound: number;
  currentPhase: BreathingPhase;
  currentBreath: number;
  isActive: boolean;
  isPaused: boolean;
  isInRecoveryPhase: boolean;
  lungVolume: number; // 0-100 percentage of lung capacity
}

export interface BreathingState {
  settings: BreathingSettings;
  session: SessionState;
}

export interface Theme {
  colors: {
    background: string;
    primary: string;
    secondary: string;
    interactive: string;
    text: string;
  };
} 