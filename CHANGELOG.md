# Changelog

All notable changes to the Breathwork Timer App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project documentation
  - App design document defining core features and requirements
  - Technical architecture document detailing component structure and data flow
  - Changelog initialization
- Project setup and core structure
  - Created React TypeScript project
  - Installed core dependencies (MUI, Framer Motion, Tone.js)
  - Implemented basic type definitions
  - Set up theme constants and color scheme
  - Created BreathingContext for state management
  - Implemented Layout component with theme provider
- Settings Page Implementation
  - Created BreathingSlider component for parameter adjustments
  - Implemented main SettingsPage with sliders for:
    - Breaths before Hold (20-50 breaths)
    - Inhale/Exhale Time (1-5 seconds)
    - Breath Hold Target (30-180 seconds)
    - Number of Rounds (1-5 rounds)
  - Added Start Session button with visual feedback
- Timer Page Implementation
  - Created BreathingCircle component with Framer Motion animations
  - Implemented ProgressBar for session tracking
  - Added Controls component with play/pause/stop functionality
  - Created main TimerPage with conditional rendering
  - Integrated smooth transitions between breathing phases
- New Breathing Sequence Implementation
  - Added two-phase round structure:
    1. Main breathing phase (repeated breaths)
    2. Hold sequence (hold → inhale → 15s hold → exhale)
  - Implemented progressive hold times (⅓ → ⅔ → full)
  - Added breath counter during main phase
  - Created recovery phase handling
  - Updated animations for all breathing phases
- Core Architecture Improvements
  - Added PhaseManager for centralized phase transition management
  - Implemented BreathingTimer class for precise timing control
  - Added comprehensive state validation system
  - Introduced error types and structured error handling
  - Added debug overlay for development and testing

### Changed
- Updated technical specifications in design document
  - Confirmed Tone.js as audio solution
  - Selected React Context for state management
  - Defined testing strategy using Jest + React Testing Library
- Replaced test component with actual Settings page
- Improved layout centering and responsiveness
- Updated App component to handle page transitions
- Modified breathing parameters:
  - Renamed and restructured breathing settings
  - Added separate inhale/exhale time control
  - Changed breath hold to target-based progression
  - Added breath counter to main phase
- Refactored State Management
  - Restructured BreathingState interface for better organization
  - Separated session, phase, timing, and animation states
  - Improved state updates with validation
  - Added type-safe action handlers
- Enhanced Timer Logic
  - Separated timing logic from animation
  - Improved phase transition handling
  - Added proper cleanup for timers and animations
  - Implemented more precise progress tracking
- Updated Component Architecture
  - Removed direct state dependencies from components
  - Improved prop types and error handling
  - Added better debug information display
  - Enhanced animation performance
- Fixed Phase Transition System
  - Corrected phase sequence definitions in WimHof profile
  - Implemented type-safe phase transitions with proper validation
  - Fixed breath counting logic during phase transitions
  - Added detailed phase transition logging
  - Restricted sub-phases per main phase (breathing, hold, recover)
  - Ensured correct phase progression:
    1. Breathing: inhale → exhale (with breath counting)
    2. Hold: single hold phase
    3. Recovery: inhale → hold → let_go
  - Fixed state validation to focus on transitions rather than intermediate states

### Removed
- Removed optional features from initial implementation
  - PWA support moved to future enhancements
  - Storybook integration postponed
  - Firebase CI/CD setup deferred
- Cleaned up Legacy Code
  - Removed redundant state management code
  - Eliminated duplicate timing logic
  - Removed unused animation states
  - Cleaned up deprecated debug functions 