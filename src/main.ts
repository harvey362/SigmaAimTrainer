import { Game } from './core/Game';
import './style.css';

// Main application entry point
class App {
  private game: Game | null = null;
  private loadingElement: HTMLElement | null = null;

  constructor() {
    this.loadingElement = document.getElementById('loading');
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Show loading screen
      this.showLoading();

      // Wait a brief moment to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get app container
      const appContainer = document.getElementById('app');
      if (!appContainer) {
        throw new Error('App container not found');
      }

      // Initialize game
      this.game = new Game(appContainer);
      this.game.start();

      // Hide loading screen
      this.hideLoading();

      // Log welcome message
      this.logWelcomeMessage();

      // Start stats updater
      this.startStatsUpdater();

      // Setup development helpers
      if (import.meta.env.DEV) {
        this.setupDevHelpers();
      }

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError(error as Error);
    }
  }

  private showLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.classList.remove('hidden');
    }
  }

  private hideLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.classList.add('hidden');
    }
  }

  private showError(error: Error): void {
    if (this.loadingElement) {
      this.loadingElement.innerHTML = `
        <div style="color: #ff4444; text-align: center;">
          <h2>Error Loading Application</h2>
          <p>${error.message}</p>
          <p style="font-size: 0.9em; margin-top: 1em;">Please refresh the page to try again.</p>
        </div>
      `;
    }
  }

  private logWelcomeMessage(): void {
    console.log('%c🎯 Sigma Aim Trainer', 'font-size: 20px; font-weight: bold; color: #4a9eff;');
    console.log('%cVersion 1.0.0', 'font-size: 12px; color: #888;');
    console.log('%cClick to lock pointer and start practicing!', 'font-size: 14px; color: #4a9eff;');
    console.log('\n%cControls:', 'font-weight: bold;');
    console.log('  WASD / Arrow Keys - Move');
    console.log('  Mouse - Aim');
    console.log('  Mouse Click - Fire (when implemented)');
    console.log('  ESC - Pause Menu');
    console.log('  Spacebar - Skip Countdown');
  }

  private setupDevHelpers(): void {
    // Make game instance available in console for debugging
    (window as any).__GAME__ = this.game;
    console.log('\n%c[DEV MODE]', 'color: #ff9800; font-weight: bold;');
    console.log('Game instance available at: window.__GAME__');
    console.log('Example: __GAME__.getSettings()');
  }

  private startStatsUpdater(): void {
    setInterval(() => {
      if (!this.game) return;

      const stats = this.game.getSessionStats();
      const hitsEl = document.getElementById('hits');
      const shotsEl = document.getElementById('shots');
      const accuracyEl = document.getElementById('accuracy');

      if (hitsEl) hitsEl.textContent = stats.hits.toString();
      if (shotsEl) shotsEl.textContent = stats.shots.toString();
      if (accuracyEl) accuracyEl.textContent = stats.accuracy.toFixed(1);
    }, 100);
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
