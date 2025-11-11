import { Engine } from './Engine';
import { FirstPersonControls } from './Controls';
import { GameSettings, GameState } from '@/types';

export class Game {
  private engine: Engine;
  private controls: FirstPersonControls;
  private settings: GameSettings;
  private gameState: GameState = 'menu';
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    // Load or initialize default settings
    this.settings = this.loadSettings();

    // Initialize engine
    this.engine = new Engine(container, this.settings);

    // Initialize controls
    this.controls = new FirstPersonControls(
      this.engine.getCamera(),
      this.engine.getRenderer().domElement,
      this.settings.controls.mouseSensitivity
    );

    // Setup event listeners
    this.setupEventListeners();
  }

  private loadSettings(): GameSettings {
    const savedSettings = localStorage.getItem('sigma-aim-trainer-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }

    // Default settings
    return {
      video: {
        fullscreen: true,
        resolution: { width: 1920, height: 1080 },
        fov: 90,
        theme: 'training-room',
      },
      audio: {
        masterVolume: 0.7,
        hitSoundVolume: 0.8,
      },
      controls: {
        mouseSensitivity: 1.0,
      },
      gameplay: {
        maxTargetsOnScreen: 10,
        showExplosionRadius: false,
      },
    };
  }

  private saveSettings(): void {
    localStorage.setItem('sigma-aim-trainer-settings', JSON.stringify(this.settings));
  }

  private setupEventListeners(): void {
    // ESC key for pause menu
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        this.handleEscapeKey();
      }
    });

    // Handle fullscreen toggle
    document.addEventListener('fullscreenchange', () => {
      this.settings.video.fullscreen = !!document.fullscreenElement;
      this.saveSettings();
    });
  }

  private handleEscapeKey(): void {
    if (this.gameState === 'playing') {
      this.pause();
    } else if (this.gameState === 'paused') {
      this.resume();
    }
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const delta = this.engine.getDeltaTime();

    // Update controls
    this.controls.update(delta);

    // Update game logic based on state
    this.update(delta);

    // Render scene
    this.engine.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(delta: number): void {
    // Game update logic based on current state
    switch (this.gameState) {
      case 'menu':
        // Menu state - no game updates needed
        break;
      case 'playing':
        // Update targets, projectiles, etc.
        // This will be expanded in future phases
        break;
      case 'paused':
        // Paused - no updates
        break;
      // Add other states as needed
    }
  }

  public pause(): void {
    if (this.gameState !== 'playing') return;
    this.gameState = 'paused';
    this.controls.unlock();
    // Show pause menu UI (to be implemented)
    console.warn('Game paused');
  }

  public resume(): void {
    if (this.gameState !== 'paused') return;
    this.gameState = 'playing';
    console.warn('Game resumed');
  }

  public setState(state: GameState): void {
    this.gameState = state;
  }

  public getState(): GameState {
    return this.gameState;
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();

    // Apply settings
    if (settings.video?.fov) {
      this.engine.updateFOV(settings.video.fov);
    }
    if (settings.video?.theme) {
      this.engine.setTheme(settings.video.theme);
    }
    if (settings.controls?.mouseSensitivity) {
      this.controls.setSensitivity(settings.controls.mouseSensitivity);
    }
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public dispose(): void {
    this.stop();
    this.controls.dispose();
    this.engine.dispose();
  }
}
