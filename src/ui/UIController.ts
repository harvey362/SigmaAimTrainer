import { MenuManager } from './MenuManager';
import { SessionConfig, SessionType, MovementPattern } from '@/types';

export class UIController {
  private menuManager: MenuManager;
  private currentConfig: Partial<SessionConfig> = {};

  constructor(menuManager: MenuManager) {
    this.menuManager = menuManager;
    this.initializeEventListeners();
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig(): void {
    this.currentConfig = {
      sessionType: 'untimed',
      duration: undefined,
      targetSettings: {
        targetTypes: ['stationary-bot', 'flying-bot'],
        targetSize: 1.0,
        movementEnabled: false,
        movementPattern: 'none',
        movementSpeed: 2.0,
        spawnRangeHorizontal: 160,
        spawnRangeVertical: { min: 0, max: 60 },
        maxTargets: 10,
        respawnBehavior: 'immediate',
      },
      weaponModifiers: {
        attackSpeed: 1.0,
        spheresPerBurst: 2,
        splashRadiusEnabled: true,
      },
      challengeModifiers: {
        livesEnabled: false,
        livesCount: 3,
      },
    };
  }

  private initializeEventListeners(): void {
    // Main Menu
    document.getElementById('btn-play')?.addEventListener('click', () => {
      this.menuManager.showScreen('setup');
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      console.log('Settings not yet implemented');
    });

    document.getElementById('btn-stats')?.addEventListener('click', () => {
      console.log('Stats not yet implemented');
    });

    // Setup Menu
    this.initSetupMenuListeners();

    // Pause Menu
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.menuManager.triggerResume();
      this.menuManager.hideAll();
    });

    document.getElementById('btn-quit')?.addEventListener('click', () => {
      this.menuManager.triggerQuit();
      this.menuManager.showScreen('main');
    });

    // Results Menu
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      const config = this.buildSessionConfig();
      this.menuManager.triggerStartSession(config);
      this.menuManager.hideAll();
    });

    document.getElementById('btn-back-menu')?.addEventListener('click', () => {
      this.menuManager.showScreen('main');
    });
  }

  private initSetupMenuListeners(): void {
    // Session type buttons
    document.querySelectorAll('[data-session]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-session]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const sessionType = btn.getAttribute('data-session') as SessionType;
        this.currentConfig.sessionType = sessionType;

        // Set duration based on type
        if (sessionType === '30s') {
          this.currentConfig.duration = 30;
        } else if (sessionType === '60s') {
          this.currentConfig.duration = 60;
        } else {
          this.currentConfig.duration = undefined;
        }
      });
    });

    // Movement pattern buttons
    document.querySelectorAll('[data-movement]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-movement]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const movement = btn.getAttribute('data-movement') as MovementPattern;
        if (this.currentConfig.targetSettings) {
          this.currentConfig.targetSettings.movementPattern = movement;
          this.currentConfig.targetSettings.movementEnabled = movement !== 'none';
        }
      });
    });

    // Lives system toggle
    const livesCheckbox = document.getElementById('lives-enabled') as HTMLInputElement;
    const livesCount = document.getElementById('lives-count') as HTMLInputElement;

    livesCheckbox?.addEventListener('change', () => {
      const enabled = livesCheckbox.checked;
      if (livesCount) {
        livesCount.disabled = !enabled;
      }
      if (this.currentConfig.challengeModifiers) {
        this.currentConfig.challengeModifiers.livesEnabled = enabled;
      }
    });

    livesCount?.addEventListener('change', () => {
      if (this.currentConfig.challengeModifiers) {
        this.currentConfig.challengeModifiers.livesCount = parseInt(livesCount.value) || 3;
      }
    });

    // Start session button
    document.getElementById('btn-start-session')?.addEventListener('click', () => {
      const config = this.buildSessionConfig();
      this.menuManager.triggerStartSession(config);
      this.menuManager.hideAll();
    });

    // Back button
    document.getElementById('btn-back-main')?.addEventListener('click', () => {
      this.menuManager.showScreen('main');
    });
  }

  private buildSessionConfig(): SessionConfig {
    return {
      sessionType: this.currentConfig.sessionType || 'untimed',
      duration: this.currentConfig.duration,
      targetSettings: this.currentConfig.targetSettings || {
        targetTypes: ['stationary-bot', 'flying-bot'],
        targetSize: 1.0,
        movementEnabled: false,
        movementPattern: 'none',
        movementSpeed: 2.0,
        spawnRangeHorizontal: 160,
        spawnRangeVertical: { min: 0, max: 60 },
        maxTargets: 10,
        respawnBehavior: 'immediate',
      },
      weaponModifiers: this.currentConfig.weaponModifiers || {
        attackSpeed: 1.0,
        spheresPerBurst: 2,
        splashRadiusEnabled: true,
      },
      challengeModifiers: this.currentConfig.challengeModifiers || {
        livesEnabled: false,
        livesCount: 3,
      },
    };
  }

  public showPauseMenu(): void {
    this.menuManager.showScreen('pause');
  }

  public showResults(stats: { accuracy: number; hits: number; shots: number; misses: number }): void {
    // Update results display
    const accuracyEl = document.getElementById('result-accuracy');
    const hitsEl = document.getElementById('result-hits');
    const shotsEl = document.getElementById('result-shots');

    if (accuracyEl) accuracyEl.textContent = `${stats.accuracy.toFixed(1)}%`;
    if (hitsEl) hitsEl.textContent = stats.hits.toString();
    if (shotsEl) shotsEl.textContent = stats.shots.toString();

    this.menuManager.showScreen('results');
  }

  public hideMenus(): void {
    this.menuManager.hideAll();
  }

  public showMainMenu(): void {
    this.menuManager.showScreen('main');
  }
}
