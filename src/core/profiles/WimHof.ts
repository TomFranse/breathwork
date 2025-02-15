import { BreathingProfile, BreathingState } from './types';

const WimHofProfile: BreathingProfile = {
  id: 'wim-hof',
  name: 'Wim Hof Method',
  description: 'Progressive breath hold technique with deep breathing followed by retention.',
  defaultSettings: {
    breathsBeforeHold: 30,
    inhaleExhaleTime: 2,
    breathHoldTarget: 90,
    numberOfRounds: 3,
  },
  holdTimeProgression: (round: number, total: number, target: number): number => {
    const fraction = round / total;
    if (fraction <= 1/3) return target / 3;
    if (fraction <= 2/3) return (target * 2) / 3;
    return target;
  },
  phaseSequences: {
    main: {
      inhale: {
        next: 'exhale',
        volume: 100,
      },
      exhale: {
        next: (state: BreathingState) => 
          state.phase.breathCount < state.phase.maxBreaths ? 'inhale' : 'hold',
        volume: 0,
      },
      hold: {
        next: 'recovery_inhale',
        volume: 'maintain',
      },
      recovery_inhale: {
        next: 'recovery_hold',
        volume: 100,
      },
      recovery_hold: {
        next: 'recovery_exhale',
        volume: 'maintain',
      },
      recovery_exhale: {
        next: 'inhale',
        volume: 0,
      },
    },
    recovery: {
      inhale: {
        next: 'exhale',
        volume: 100,
      },
      exhale: {
        next: 'inhale',
        volume: 0,
      },
      hold: {
        next: 'recovery_inhale',
        volume: 'maintain',
      },
      recovery_inhale: {
        next: 'recovery_hold',
        volume: 100,
      },
      recovery_hold: {
        next: 'recovery_exhale',
        volume: 'maintain',
      },
      recovery_exhale: {
        next: 'inhale',
        volume: 0,
      },
    },
  },
};

export default WimHofProfile; 