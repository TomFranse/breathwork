import React, { createContext, useContext, useReducer, ReactNode, useRef, useCallback } from 'react';
import { 
  BreathingState, 
  BreathingSettings, 
  BreathingPhase,
  BreathingError,
  BreathingErrorType,
  PhaseSequences
} from '../core/profiles/types';
import { PhaseManager } from '../core/state/PhaseManager';
import { validateBreathingState, validateStateTransition } from '../core/state/StateValidator';
import { DEFAULT_BREATHING_SETTINGS } from '../utils/constants';
import WimHofProfile from '../core/profiles/WimHof';

// Initial state following the new BreathingState interface
const initialState: BreathingState = {
  session: {
    isActive: false,
    isPaused: false,
    currentRound: 1,
    totalRounds: DEFAULT_BREATHING_SETTINGS.numberOfRounds,
  },
  phase: {
    current: 'inhale',
    isRecovery: false,
    breathCount: 0,
    maxBreaths: DEFAULT_BREATHING_SETTINGS.breathsBeforeHold,
  },
  timing: {
    inhaleTime: DEFAULT_BREATHING_SETTINGS.inhaleExhaleTime,
    exhaleTime: DEFAULT_BREATHING_SETTINGS.inhaleExhaleTime,
    holdTime: DEFAULT_BREATHING_SETTINGS.breathHoldTarget,
    recoveryTime: DEFAULT_BREATHING_SETTINGS.inhaleExhaleTime,
  },
  animation: {
    lungVolume: 0,
    progress: 0,
  },
};

// Action types aligned with the new architecture
type Action =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<BreathingSettings> }
  | { type: 'START_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'UPDATE_STATE'; payload: Partial<BreathingState> };

// Reducer with validation and PhaseManager integration
function breathingReducer(state: BreathingState, action: Action): BreathingState {
  try {
    let newState: BreathingState;

    switch (action.type) {
      case 'UPDATE_SETTINGS':
        newState = {
          ...state,
          timing: {
            ...state.timing,
            inhaleTime: action.payload.inhaleExhaleTime ?? state.timing.inhaleTime,
            exhaleTime: action.payload.inhaleExhaleTime ?? state.timing.exhaleTime,
            holdTime: action.payload.breathHoldTarget ?? state.timing.holdTime,
            recoveryTime: action.payload.inhaleExhaleTime ?? state.timing.recoveryTime,
          },
          phase: {
            ...state.phase,
            maxBreaths: action.payload.breathsBeforeHold ?? state.phase.maxBreaths,
          },
          session: {
            ...state.session,
            totalRounds: action.payload.numberOfRounds ?? state.session.totalRounds,
          },
        };
        break;

      case 'START_SESSION':
        newState = {
          ...state,
          session: {
            ...state.session,
            isActive: true,
            isPaused: false,
            currentRound: 1,
          },
          phase: {
            ...state.phase,
            current: 'inhale',
            isRecovery: false,
            breathCount: 0,
          },
          animation: {
            lungVolume: 0,
            progress: 0,
          },
        };
        break;

      case 'PAUSE_SESSION':
        newState = {
          ...state,
          session: { ...state.session, isPaused: true },
        };
        break;

      case 'RESUME_SESSION':
        newState = {
          ...state,
          session: { ...state.session, isPaused: false },
        };
        break;

      case 'STOP_SESSION':
        newState = {
          ...state,
          session: {
            ...state.session,
            isActive: false,
            isPaused: false,
          },
        };
        break;

      case 'UPDATE_STATE':
        newState = {
          ...state,
          ...action.payload,
        };
        break;

      default:
        return state;
    }

    // Validate the new state
    validateBreathingState(newState);

    // Only validate transitions when phase changes
    if (action.type === 'UPDATE_STATE' && 
        action.payload.phase?.current !== undefined && 
        action.payload.phase.current !== state.phase.current) {
      validateStateTransition(state, newState, WimHofProfile.phaseSequences);
    }

    return newState;
  } catch (error) {
    if (error instanceof BreathingError) {
      console.error('State update error:', error.message, error.details);
    }
    throw error;
  }
}

// Context with PhaseManager integration
interface BreathingContextValue {
  state: BreathingState;
  dispatch: React.Dispatch<Action>;
  phaseManager: PhaseManager;
}

const BreathingContext = createContext<BreathingContextValue | null>(null);

// Provider component with PhaseManager setup
export function BreathingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(breathingReducer, initialState);
  
  // Create a stable reference to the phase manager
  const phaseManagerRef = useRef<PhaseManager | null>(null);
  
  // Callback for state updates from PhaseManager
  const handleStateChange = useCallback((updates: Partial<BreathingState>) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates });
  }, []);

  // Initialize PhaseManager if not already done
  if (!phaseManagerRef.current) {
    phaseManagerRef.current = new PhaseManager({
      sequences: WimHofProfile.phaseSequences,
      onStateChange: handleStateChange,
      onError: (error) => console.error('PhaseManager error:', error),
    });
  }

  const contextValue: BreathingContextValue = {
    state,
    dispatch,
    phaseManager: phaseManagerRef.current,
  };

  return (
    <BreathingContext.Provider value={contextValue}>
      {children}
    </BreathingContext.Provider>
  );
}

// Custom hook with proper error handling
export function useBreathing() {
  const context = useContext(BreathingContext);
  if (!context) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'useBreathing must be used within a BreathingProvider'
    );
  }
  return context;
} 