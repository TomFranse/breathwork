import { Theme, BreathingSettings, BreathingPhase } from '../types';

export const DEFAULT_THEME: Theme = {
  colors: {
    background: '#D6E2F0',  // Soft lavender blue
    primary: '#F9DCC4',     // Pastel peach
    secondary: '#B8E0D2',   // Mint green
    interactive: '#4B908D', // Deep teal
    text: '#3A3A3A',       // Soft dark gray
  },
};

export const DEFAULT_BREATHING_SETTINGS: BreathingSettings = {
  breathsBeforeHold: 30,     // 30 breaths before hold
  inhaleExhaleTime: 2,       // 2 seconds for inhale/exhale
  breathHoldTarget: 90,      // 1.5 minutes max hold
  numberOfRounds: 3,         // 3 rounds default
};

export const RECOVERY_HOLD_TIME = 15; // 15 seconds fixed recovery hold

export const PHASE_ORDER: {
  main: BreathingPhase[];
  recovery: BreathingPhase[];
} = {
  main: ['inhale', 'exhale'],
  recovery: ['hold', 'recovery_inhale', 'recovery_hold', 'recovery_exhale'],
};

export const AUDIO_FREQUENCIES = {
  INHALE: {
    start: 200,
    end: 400,
  },
  EXHALE: {
    start: 400,
    end: 200,
  },
  HOLD: {
    frequency: 100,
  },
}; 