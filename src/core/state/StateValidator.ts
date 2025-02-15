import { 
  BreathingState, 
  MainPhase,
  SubPhase,
  BreathingError, 
  BreathingErrorType,
  PhaseSequences
} from '../profiles/types';

export function validatePhaseTransition(
  prevState: BreathingState,
  nextState: BreathingState,
  sequences: PhaseSequences
): void {
  const sequence = sequences[prevState.phase.main as keyof PhaseSequences];

  if (!sequence) {
    throw new BreathingError(
      BreathingErrorType.INVALID_PHASE_TRANSITION,
      `No sequence defined for main phase ${prevState.phase.main}`,
      { prevState, nextState }
    );
  }

  const transition = sequence[prevState.phase.sub];
  if (!transition) {
    throw new BreathingError(
      BreathingErrorType.INVALID_PHASE_TRANSITION,
      `No transition defined for sub phase ${prevState.phase.sub} in ${prevState.phase.main}`,
      { prevState, nextState }
    );
  }

  const expectedNextPhase = typeof transition.next === 'function'
    ? transition.next(prevState)
    : transition.next;

  if (nextState.phase.main !== expectedNextPhase.main || 
      nextState.phase.sub !== expectedNextPhase.sub) {
    throw new BreathingError(
      BreathingErrorType.INVALID_PHASE_TRANSITION,
      `Invalid phase transition from ${prevState.phase.main}/${prevState.phase.sub} to ${nextState.phase.main}/${nextState.phase.sub}`,
      { prevState, nextState, expected: expectedNextPhase }
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

  // Validate breath count range
  if (state.phase.breathCount < 0) {
    throw new BreathingError(
      BreathingErrorType.INVALID_STATE,
      'Breath count cannot be negative',
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
  // Validate both states individually
  validateBreathingState(prevState);
  validateBreathingState(nextState);

  // If phase changed, validate the transition
  if (prevState.phase.main !== nextState.phase.main || 
      prevState.phase.sub !== nextState.phase.sub) {
    validatePhaseTransition(prevState, nextState, sequences);
  }

  // Validate breath count transitions
  if (prevState.phase.main === 'breathing' && nextState.phase.main === 'breathing') {
    // Within breathing phase, breath count can only increase during exhale->inhale transition
    if (prevState.phase.sub === 'exhale' && nextState.phase.sub === 'inhale') {
      if (nextState.phase.breathCount !== prevState.phase.breathCount + 1) {
        throw new BreathingError(
          BreathingErrorType.INVALID_STATE,
          'Breath count must increment by 1 during exhale->inhale transition',
          { prevState, nextState }
        );
      }
    } else if (nextState.phase.breathCount !== prevState.phase.breathCount) {
      // Breath count should remain the same during other transitions
      throw new BreathingError(
        BreathingErrorType.INVALID_STATE,
        'Breath count cannot change during this transition',
        { prevState, nextState }
      );
    }
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
} 