import { BreathingProfile, BreathingState, MainPhase, SubPhase } from './types';

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
    breathing: {
      inhale: {
        next: (state: BreathingState) => ({
          main: 'breathing',
          sub: 'exhale'
        }),
        volume: 100,
      },
      exhale: {
        next: (state: BreathingState) => {
          if (state.phase.breathCount >= state.phase.maxBreaths - 1) {
            return {
              main: 'hold',
              sub: 'hold'
            };
          }
          return {
            main: 'breathing',
            sub: 'inhale'
          };
        },
        volume: 0,
      },
      hold: {
        next: (state: BreathingState) => ({
          main: 'recover',
          sub: 'inhale'
        }),
        volume: 'maintain',
      },
      let_go: {
        next: (state: BreathingState) => ({
          main: 'breathing',
          sub: 'inhale'
        }),
        volume: 0,
      },
    },
    hold: {
      hold: {
        next: (state: BreathingState) => ({
          main: 'recover',
          sub: 'inhale'
        }),
        volume: 'maintain',
      },
    },
    recover: {
      inhale: {
        next: (state: BreathingState) => ({
          main: 'recover',
          sub: 'hold'
        }),
        volume: 100,
      },
      hold: {
        next: (state: BreathingState) => ({
          main: 'recover',
          sub: 'let_go'
        }),
        volume: 'maintain',
      },
      let_go: {
        next: (state: BreathingState) => ({
          main: state.session.currentRound < state.session.totalRounds ? 'breathing' : 'complete',
          sub: 'inhale'
        }),
        volume: 0,
      },
    },
  },
};

export default WimHofProfile; 