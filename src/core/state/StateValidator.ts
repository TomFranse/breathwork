import { 
  BreathingState, 
  BreathingPhase, 
  BreathingError, 
  BreathingErrorType,
  PhaseSequences
} from '../profiles/types';

export function validatePhaseTransition(
  from: BreathingPhase,
  to: BreathingPhase,
  state: BreathingState,
  sequences: PhaseSequences
): void {
  const currentSequence = state.phase.isRecovery ? sequences.recovery : sequences.main;
  const allowedTransition = currentSequence[from];

  if (!allowedTransition) {
    throw new BreathingError(
      BreathingErrorType.INVALID_PHASE_TRANSITION,
      `Invalid phase transition from ${from}`,
      { from, to, state }
    );
  }

  const nextPhase = typeof allowedTransition.next === 'function'
    ? allowedTransition.next(state)
    : allowedTransition.next;

  if (nextPhase !== to) {
    throw new BreathingError(
      BreathingErrorType.INVALID_PHASE_TRANSITION,
      `Invalid phase transition from ${from} to ${to}`,
      { from, to, expected: nextPhase, state }
    );
  }
}

export function validateBreathingState(state: BreathingState): void {
  // Validate session state
  if (state.session.currentRound > state.session.totalRounds) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Current round exceeds total rounds',
      { state }
    );
  }

  // Validate phase state
  if (state.phase.breathCount > state.phase.maxBreaths) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Breath count exceeds maximum breaths',
      { state }
    );
  }

  // Validate timing state
  if (state.timing.inhaleTime <= 0 || state.timing.exhaleTime <= 0) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Invalid breathing timing values',
      { state }
    );
  }

  // Validate animation state
  if (state.animation.lungVolume < 0 || state.animation.lungVolume > 100) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Lung volume out of bounds',
      { state }
    );
  }

  if (state.animation.progress < 0 || state.animation.progress > 1) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Progress value out of bounds',
      { state }
    );
  }
}

export function validateStateTransition(
  prevState: BreathingState,
  nextState: BreathingState,
  sequences: PhaseSequences
): void {
  // Validate the new state
  validateBreathingState(nextState);

  // If phase changed, validate the transition
  if (prevState.phase.current !== nextState.phase.current) {
    validatePhaseTransition(
      prevState.phase.current,
      nextState.phase.current,
      prevState,
      sequences
    );
  }

  // Validate round transitions
  if (nextState.session.currentRound > prevState.session.currentRound) {
    if (nextState.session.currentRound > nextState.session.totalRounds) {
      throw new BreathingError(
        BreathingErrorType.INVALID_STATE,
        'Invalid round transition',
        { prevState, nextState }
      );
    }
  }

  // Validate breath count transitions
  if (nextState.phase.breathCount < prevState.phase.breathCount && 
      nextState.phase.current !== 'inhale' &&
      !nextState.phase.isRecovery) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Invalid breath count transition',
      { prevState, nextState }
    );
  }
} 