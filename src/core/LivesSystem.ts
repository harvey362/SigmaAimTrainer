export class LivesSystem {
  private enabled: boolean = false;
  private maxLives: number = 3;
  private currentLives: number = 3;
  private missCount: number = 0;

  private onLifeLostCallback?: (livesRemaining: number) => void;
  private onAllLivesLostCallback?: () => void;

  constructor(enabled: boolean = false, maxLives: number = 3) {
    this.enabled = enabled;
    this.maxLives = maxLives;
    this.currentLives = maxLives;
  }

  public recordMiss(): void {
    if (!this.enabled) return;

    this.missCount++;
    this.currentLives = Math.max(0, this.maxLives - this.missCount);

    if (this.onLifeLostCallback) {
      this.onLifeLostCallback(this.currentLives);
    }

    if (this.currentLives === 0 && this.onAllLivesLostCallback) {
      this.onAllLivesLostCallback();
    }
  }

  public getLivesRemaining(): number {
    return this.currentLives;
  }

  public getMissCount(): number {
    return this.missCount;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public hasLivesRemaining(): boolean {
    if (!this.enabled) return true;
    return this.currentLives > 0;
  }

  public onLifeLost(callback: (livesRemaining: number) => void): void {
    this.onLifeLostCallback = callback;
  }

  public onAllLivesLost(callback: () => void): void {
    this.onAllLivesLostCallback = callback;
  }

  public reset(enabled?: boolean, maxLives?: number): void {
    if (enabled !== undefined) this.enabled = enabled;
    if (maxLives !== undefined) this.maxLives = maxLives;

    this.currentLives = this.maxLives;
    this.missCount = 0;
  }
}
