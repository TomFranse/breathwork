import { BreathingErrorType, BreathingError } from '../profiles/types';

export interface TimerCallbacks {
  onTick: (progress: number) => void;
  onComplete: () => void;
  onError?: (error: BreathingError) => void;
}

export class BreathingTimer {
  private animationFrame?: number;
  private startTime: number = 0;
  private pauseTime?: number;
  private duration: number = 0;
  private callbacks: TimerCallbacks = {
    onTick: () => {},
    onComplete: () => {},
  };
  private isActive: boolean = false;

  constructor(callbacks?: Partial<TimerCallbacks>) {
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }
  }

  start(duration: number, callbacks?: Partial<TimerCallbacks>) {
    try {
      if (this.isActive) {
        throw new BreathingError(
          BreathingErrorType.TIMER_SYNC_ERROR,
          'Timer is already running'
        );
      }

      this.duration = duration;
      this.startTime = Date.now();
      this.isActive = true;

      if (callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
      }

      this.tick();
    } catch (error) {
      if (error instanceof BreathingError) {
        this.callbacks.onError?.(error);
      }
      throw error;
    }
  }

  private tick = () => {
    if (!this.isActive) return;

    try {
      const currentTime = Date.now();
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);

      this.callbacks.onTick(progress);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(this.tick);
      } else {
        this.isActive = false;
        this.callbacks.onComplete();
      }
    } catch (error) {
      this.isActive = false;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      const breathingError = new BreathingError(
        BreathingErrorType.TIMER_SYNC_ERROR,
        'Error during timer tick',
        error
      );
      this.callbacks.onError?.(breathingError);
      throw breathingError;
    }
  };

  pause() {
    if (!this.isActive) return;

    this.isActive = false;
    this.pauseTime = Date.now();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resume() {
    if (this.isActive || !this.pauseTime) return;

    const pauseDuration = Date.now() - this.pauseTime;
    this.startTime += pauseDuration;
    this.pauseTime = undefined;
    this.isActive = true;
    this.tick();
  }

  stop() {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  getProgress(): number {
    if (!this.isActive) return 0;
    
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    return Math.min(elapsed / this.duration, 1);
  }

  isRunning(): boolean {
    return this.isActive;
  }

  isPaused(): boolean {
    return !!this.pauseTime;
  }
} 