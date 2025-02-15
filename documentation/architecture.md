# Breathwork Timer App - Architecture Document

## 1. Core Concepts

### 1.1 Breathing Profiles
```typescript
interface BreathingProfile {
  name: string;
  description: string;
  defaultSettings: BreathingSettings;
  holdTimeProgression: (round: number, total: number, target: number) => number;
}
```
Predefined breathing techniques (e.g., Wim Hof, Box Breathing) with their specific parameters and progression logic.

### 1.2 State Management
The app uses a hierarchical state management approach:
1. **Session State**: Overall breathing session status
2. **Phase State**: Current breathing phase and its parameters
3. **Timer State**: Precise timing and animation control
4. **Settings State**: User-configurable parameters

### 1.3 Phase Sequences
Declaratively defined phase transitions:
```typescript
const PHASE_SEQUENCES = {
  main: {
    inhale: { next: 'exhale', volume: 100 },
    exhale: { next: (state) => state.currentBreath < state.maxBreaths ? 'inhale' : 'hold', volume: 0 },
    hold: { next: 'recovery_inhale', volume: 'maintain' }
  },
  recovery: {
    recovery_inhale: { next: 'recovery_hold', volume: 100 },
    recovery_hold: { next: 'recovery_exhale', volume: 'maintain' },
    recovery_exhale: { next: 'inhale', volume: 0 }
  }
}
```

## 2. Component Structure

```
src/
├── components/
│   ├── breathing/
│   │   ├── BreathingCircle.tsx       # Visual breathing indicator
│   │   ├── PhaseIndicator.tsx        # Current phase display
│   │   ├── ProgressBar.tsx           # Session progress
│   │   └── Controls.tsx              # Playback controls
│   ├── settings/
│   │   ├── SettingsPage.tsx          # Settings configuration
│   │   ├── ProfileSelector.tsx       # Breathing profile selection
│   │   └── ParameterSliders.tsx      # Breathing parameters
│   └── common/
│       ├── Layout.tsx                # Common layout wrapper
│       └── ErrorBoundary.tsx         # Error handling
├── core/
│   ├── profiles/
│   │   ├── types.ts                  # Profile type definitions
│   │   ├── WimHof.ts                # Wim Hof method profile
│   │   └── BoxBreathing.ts          # Box breathing profile
│   ├── timing/
│   │   ├── BreathingTimer.ts        # Timer management
│   │   └── AnimationController.ts    # Animation control
│   └── state/
│       ├── BreathingContext.tsx      # Global state
│       ├── PhaseManager.ts           # Phase transitions
│       └── StateValidator.ts         # State validation
├── hooks/
│   ├── useBreathingTimer.ts          # Timer logic
│   ├── useBreathingAnimation.ts      # Animation hooks
│   └── useBreathingState.ts          # State management
└── utils/
    ├── constants.ts                   # App constants
    ├── validators.ts                  # Input validation
    └── debug.ts                       # Debug utilities
```

## 3. State Management

### 3.1 BreathingState Interface
```typescript
interface BreathingState {
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
```

### 3.2 State Updates
- Atomic updates using action creators
- Validation before state changes
- Debug tracking of state transitions

## 4. Timer Management

### 4.1 BreathingTimer Class
```typescript
class BreathingTimer {
  start(duration: number, onTick: (progress: number) => void, onComplete: () => void): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getProgress(): number;
}
```

### 4.2 Animation Control
- RAF-based smooth animations
- Precise progress tracking
- Cleanup on component unmount

## 5. Error Handling

### 5.1 Error Types
```typescript
enum BreathingErrorType {
  INVALID_PHASE_TRANSITION = 'INVALID_PHASE_TRANSITION',
  TIMER_SYNC_ERROR = 'TIMER_SYNC_ERROR',
  INVALID_STATE = 'INVALID_STATE',
  ANIMATION_ERROR = 'ANIMATION_ERROR'
}
```

### 5.2 Error Boundaries
- Component-level error catching
- State recovery mechanisms
- User-friendly error messages

## 6. Debug & Development

### 6.1 State Tracking
```typescript
interface StateSnapshot {
  timestamp: number;
  state: BreathingState;
  action?: string;
  error?: Error;
}
```

### 6.2 Development Tools
- State history tracking
- Performance monitoring
- Visual debugging overlay

## 7. Testing Strategy

### 7.1 Unit Tests
- State transitions
- Timer accuracy
- Animation smoothness

### 7.2 Integration Tests
- Complete breathing sequences
- Profile switching
- Error recovery

### 7.3 Mock Utilities
```typescript
class MockBreathingTimer {
  simulateProgress(progress: number): void;
  simulateError(error: BreathingErrorType): void;
  simulateComplete(): void;
}
```

## 8. Performance Considerations

### 8.1 Optimizations
- Memoized calculations
- RAF-based animations
- Efficient state updates

### 8.2 Memory Management
- Proper cleanup of timers
- Animation frame cancellation
- State cleanup on session end

## 9. Future Enhancements

### 9.1 Planned Features
- Custom breathing profiles
- Progress tracking
- Social sharing
- Offline support

### 9.2 Technical Improvements
- PWA implementation
- Performance monitoring
- Analytics integration
- Cloud sync 