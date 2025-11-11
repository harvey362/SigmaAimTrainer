import { SessionConfig } from '@/types';

export type MenuScreen = 'main' | 'setup' | 'pause' | 'results' | 'none';

export class MenuManager {
  private currentScreen: MenuScreen = 'main';
  private containers: Map<MenuScreen, HTMLElement> = new Map();

  private onPlayCallback?: () => void;
  private onStartSessionCallback?: (config: SessionConfig) => void;
  private onResumeCallback?: () => void;
  private onQuitCallback?: () => void;

  constructor() {
    this.initContainers();
    this.showScreen('main');
  }

  private initContainers(): void {
    // Get or create menu containers
    const mainMenu = document.getElementById('main-menu');
    const setupMenu = document.getElementById('setup-menu');
    const pauseMenu = document.getElementById('pause-menu');
    const resultsMenu = document.getElementById('results-menu');

    if (mainMenu) this.containers.set('main', mainMenu);
    if (setupMenu) this.containers.set('setup', setupMenu);
    if (pauseMenu) this.containers.set('pause', pauseMenu);
    if (resultsMenu) this.containers.set('results', resultsMenu);
  }

  public showScreen(screen: MenuScreen): void {
    // Hide all screens
    this.containers.forEach((container) => {
      container.style.display = 'none';
    });

    // Show requested screen
    if (screen !== 'none') {
      const container = this.containers.get(screen);
      if (container) {
        container.style.display = 'flex';
      }
    }

    this.currentScreen = screen;
  }

  public getCurrentScreen(): MenuScreen {
    return this.currentScreen;
  }

  public hideAll(): void {
    this.showScreen('none');
  }

  public onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }

  public onStartSession(callback: (config: SessionConfig) => void): void {
    this.onStartSessionCallback = callback;
  }

  public onResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  public onQuit(callback: () => void): void {
    this.onQuitCallback = callback;
  }

  public triggerPlay(): void {
    if (this.onPlayCallback) {
      this.onPlayCallback();
    }
  }

  public triggerStartSession(config: SessionConfig): void {
    if (this.onStartSessionCallback) {
      this.onStartSessionCallback(config);
    }
  }

  public triggerResume(): void {
    if (this.onResumeCallback) {
      this.onResumeCallback();
    }
  }

  public triggerQuit(): void {
    if (this.onQuitCallback) {
      this.onQuitCallback();
    }
  }
}
