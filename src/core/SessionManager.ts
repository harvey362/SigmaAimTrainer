import { SessionConfig, SessionType } from '@/types';

export class SessionManager {
  private config: SessionConfig | null = null;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private pauseTime: number = 0;
  private totalPausedTime: number = 0;

  private onTimeUpdateCallback?: (elapsed: number, remaining: number) => void;
  private onSessionEndCallback?: (reason: 'time' | 'lives' | 'manual') => void;

  constructor() {}

  public startSession(config: SessionConfig): void {
    this.config = config;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.totalPausedTime = 0;
    this.isActive = true;
    this.isPaused = false;
  }

  public update(delta: number): void {
    if (!this.isActive || this.isPaused || !this.config) return;

    this.elapsedTime += delta;

    // Check if session should end
    if (this.shouldEndSession()) {
      this.endSession('time');
      return;
    }

    // Call time update callback
    if (this.onTimeUpdateCallback) {
      const remaining = this.getRemainingTime();
      this.onTimeUpdateCallback(this.elapsedTime, remaining);
    }
  }

  private shouldEndSession(): boolean {
    if (!this.config) return false;

    // Check timer for timed sessions
    if (this.config.sessionType !== 'untimed' && this.config.duration) {
      return this.elapsedTime >= this.config.duration;
    }

    return false;
  }

  public pause(): void {
    if (!this.isActive || this.isPaused) return;
    this.isPaused = true;
    this.pauseTime = Date.now();
  }

  public resume(): void {
    if (!this.isActive || !this.isPaused) return;
    this.isPaused = false;
    this.totalPausedTime += (Date.now() - this.pauseTime);
  }

  public endSession(reason: 'time' | 'lives' | 'manual'): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.isPaused = false;

    if (this.onSessionEndCallback) {
      this.onSessionEndCallback(reason);
    }
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  public getRemainingTime(): number {
    if (!this.config || this.config.sessionType === 'untimed') {
      return Infinity;
    }

    const duration = this.config.duration || 0;
    return Math.max(0, duration - this.elapsedTime);
  }

  public getSessionDuration(): number {
    if (!this.config || this.config.sessionType === 'untimed') {
      return 0;
    }

    return this.config.duration || 0;
  }

  public isSessionActive(): boolean {
    return this.isActive;
  }

  public isSessionPaused(): boolean {
    return this.isPaused;
  }

  public getConfig(): SessionConfig | null {
    return this.config;
  }

  public onTimeUpdate(callback: (elapsed: number, remaining: number) => void): void {
    this.onTimeUpdateCallback = callback;
  }

  public onSessionEnd(callback: (reason: 'time' | 'lives' | 'manual') => void): void {
    this.onSessionEndCallback = callback;
  }

  public reset(): void {
    this.config = null;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.isActive = false;
    this.isPaused = false;
    this.pauseTime = 0;
    this.totalPausedTime = 0;
  }
}

export function parseSessionType(type: SessionType): number | null {
  switch (type) {
    case '30s':
      return 30;
    case '60s':
      return 60;
    case 'untimed':
      return null;
    case 'custom':
      return null; // Will be set separately
    default:
      return null;
  }
}
