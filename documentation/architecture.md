# Breathwork Timer App - Architecture Document

## 1. Component Structure

```
src/
├── components/
│   ├── App.tsx                    # Main application component
│   ├── settings/
│   │   ├── SettingsPage.tsx      # Settings configuration page
│   │   ├── BreathingSlider.tsx   # Custom slider for breathing settings
│   │   └── RoundCounter.tsx      # Round configuration component
│   ├── timer/
│   │   ├── TimerPage.tsx         # Breathing session page
│   │   ├── BreathingCircle.tsx   # Animated breathing indicator
│   │   ├── ProgressBar.tsx       # Session progress indicator
│   │   └── Controls.tsx          # Play/Pause/Stop controls
│   └── common/
│       ├── Button.tsx            # Reusable button component
│       └── Layout.tsx            # Common layout wrapper
├── context/
│   ├── BreathingContext.tsx      # Global state management
│   └── AudioContext.tsx          # Audio state and controls
├── hooks/
│   ├── useBreathingTimer.ts      # Timer logic and state
│   ├── useBreathingSound.ts      # Sound synthesis with Tone.js
│   └── useBreathingAnimation.ts  # Animation control hooks
├── utils/
│   ├── timerCalculations.ts      # Timer-related calculations
│   ├── soundUtils.ts             # Sound-related utilities
│   └── constants.ts              # App-wide constants
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 2. Data Flow

### 2.1 Context Structure
```typescript
interface BreathingState {
  settings: {
    breathHold: number;
    breathsPerCycle: number;
    numberOfRounds: number;
  };
  session: {
    currentRound: number;
    currentPhase: 'inhale' | 'exhale' | 'hold';
    isActive: boolean;
    isPaused: boolean;
  };
}
```

### 2.2 State Management Flow
1. Settings Page → BreathingContext
2. BreathingContext → Timer Logic
3. Timer Logic → Audio & Animation
4. Timer Logic → UI Updates

## 3. Core Features Implementation

### 3.1 Timer Logic
- Managed by `useBreathingTimer` hook
- Calculates breath hold progression (⅓, ⅔, full)
- Handles pause/resume/stop functionality
- Emits current phase and timing

### 3.2 Audio System
- Managed by `useBreathingSound` hook
- Uses Tone.js for sound synthesis
- Syncs with breathing phases:
  - Inhale: Rising sine wave (frequency: 200Hz → 400Hz)
  - Exhale: Falling sine wave (400Hz → 200Hz)
  - Hold: Low drone (100Hz)

### 3.3 Animation System
- Uses Framer Motion for smooth transitions
- Breathing circle scales with breath phases
- Progress indicators update in real-time

## 4. Testing Strategy

### 4.1 Unit Tests
- Timer calculations
- State transitions
- Context updates
- Utility functions

### 4.2 Integration Tests
- Timer + Audio synchronization
- User interactions
- State management flow

### 4.3 Component Tests
- Render testing
- User interaction testing
- Animation presence

## 5. Performance Considerations

### 5.1 Optimizations
- Use `React.memo()` for static components
- Implement `useCallback` for event handlers
- Utilize `useMemo` for complex calculations
- Lazy load secondary features

### 5.2 Audio Performance
- Initialize Tone.js on user interaction
- Clean up audio resources on component unmount
- Handle audio context suspension during pause

## 6. Accessibility

### 6.1 Features
- ARIA labels for all interactive elements
- Keyboard navigation support
- Visual feedback for all interactions
- Screen reader support for timer states

## 7. Error Handling

### 7.1 Strategies
- Graceful audio fallback
- Timer sync recovery
- State persistence for unexpected closes
- Clear error messages for users 