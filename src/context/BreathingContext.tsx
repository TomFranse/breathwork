import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BreathingState, BreathingSettings, BreathingPhase } from '../types';
import { DEFAULT_BREATHING_SETTINGS } from '../utils/constants';

// Initial state
const initialState: BreathingState = {
  settings: DEFAULT_BREATHING_SETTINGS,
  session: {
    currentRound: 1,
    currentPhase: 'inhale',
    currentBreath: 1,
    isActive: false,
    isPaused: false,
    isInRecoveryPhase: false,
    lungVolume: 0, // Start with empty lungs
  },
};

// Action types
type Action =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<BreathingSettings> }
  | { type: 'START_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'UPDATE_PHASE'; payload: BreathingPhase }
  | { type: 'UPDATE_ROUND'; payload: number }
  | { type: 'INCREMENT_BREATH' }
  | { type: 'RESET_BREATH' }
  | { type: 'SET_RECOVERY_PHASE'; payload: boolean }
  | { type: 'SET_LUNG_VOLUME'; payload: number };

// Reducer
function breathingReducer(state: BreathingState, action: Action): BreathingState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'START_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: true,
          isPaused: false,
          currentRound: 1,
          currentPhase: 'inhale',
          currentBreath: 1,
          isInRecoveryPhase: false,
          lungVolume: 0, // Start with empty lungs
        },
      };
    case 'PAUSE_SESSION':
      return {
        ...state,
        session: { ...state.session, isPaused: true },
      };
    case 'RESUME_SESSION':
      return {
        ...state,
        session: { ...state.session, isPaused: false },
      };
    case 'STOP_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: false,
          isPaused: false,
          currentRound: 1,
          currentPhase: 'inhale',
          currentBreath: 1,
          isInRecoveryPhase: false,
          lungVolume: 0,
        },
      };
    case 'UPDATE_PHASE':
      return {
        ...state,
        session: { ...state.session, currentPhase: action.payload },
      };
    case 'UPDATE_ROUND':
      return {
        ...state,
        session: { 
          ...state.session, 
          currentRound: action.payload,
          currentBreath: 1,
          isInRecoveryPhase: false,
        },
      };
    case 'INCREMENT_BREATH':
      return {
        ...state,
        session: {
          ...state.session,
          currentBreath: state.session.currentBreath + 1,
        },
      };
    case 'RESET_BREATH':
      return {
        ...state,
        session: {
          ...state.session,
          currentBreath: 1,
        },
      };
    case 'SET_RECOVERY_PHASE':
      return {
        ...state,
        session: {
          ...state.session,
          isInRecoveryPhase: action.payload,
        },
      };
    case 'SET_LUNG_VOLUME':
      return {
        ...state,
        session: {
          ...state.session,
          lungVolume: Math.max(0, Math.min(100, action.payload)), // Clamp between 0-100
        },
      };
    default:
      return state;
  }
}

// Context
const BreathingContext = createContext<{
  state: BreathingState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Provider component
export function BreathingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(breathingReducer, initialState);

  return (
    <BreathingContext.Provider value={{ state, dispatch }}>
      {children}
    </BreathingContext.Provider>
  );
}

// Custom hook to use the breathing context
export function useBreathing() {
  const context = useContext(BreathingContext);
  if (!context) {
    throw new Error('useBreathing must be used within a BreathingProvider');
  }
  return context;
} 