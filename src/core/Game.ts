import { Engine } from './Engine';
import { FirstPersonControls } from './Controls';
import { GameSettings, GameState, SessionConfig, WeaponModifiers } from '@/types';
import { ProjectileManager } from '@/physics/ProjectileManager';
import { WeaponSystem } from '@/physics/WeaponSystem';
import { TargetManager } from '@/targets/TargetManager';
import { HitInfo } from '@/physics/ProjectileManager';

export class Game {
  private engine: Engine;
  private controls: FirstPersonControls;
  private settings: GameSettings;
  private gameState: GameState = 'menu';
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  // Gameplay systems
  private projectileManager: ProjectileManager | null = null;
  private weaponSystem: WeaponSystem | null = null;
  private targetManager: TargetManager | null = null;

  // Session stats
  private currentSession: SessionConfig | null = null;
  private sessionStats = {
    hits: 0,
    misses: 0,
    shots: 0,
  };

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

    // Initialize gameplay systems
    this.initGameplaySystems();

    // Setup event listeners
    this.setupEventListeners();
  }

  private initGameplaySystems(): void {
    // Initialize projectile manager
    this.projectileManager = new ProjectileManager(this.engine.getScene());

    // Initialize weapon system with default modifiers
    const defaultModifiers: WeaponModifiers = {
      attackSpeed: 1.0,
      spheresPerBurst: 2,
      splashRadiusEnabled: true,
    };

    this.weaponSystem = new WeaponSystem(
      this.engine.getCamera(),
      this.projectileManager,
      defaultModifiers
    );

    // Setup weapon callbacks
    this.weaponSystem.onFire(() => {
      this.sessionStats.shots++;
    });

    // Initialize target manager with default settings
    this.targetManager = new TargetManager(
      this.engine.getScene(),
      this.engine.getCamera(),
      {
        targetTypes: ['stationary-bot', 'flying-bot'],
        targetSize: 1.0,
        movementEnabled: false,
        movementPattern: 'none',
        movementSpeed: 2.0,
        spawnRangeHorizontal: 160,
        spawnRangeVertical: { min: 0, max: 60 },
        maxTargets: 10,
        respawnBehavior: 'immediate',
      }
    );

    // Start in demo mode - spawn some targets
    this.startDemoMode();
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

    // Mouse button controls for firing
    document.addEventListener('mousedown', (event) => {
      if (event.button === 0 && this.controls.getIsLocked()) {
        // Left mouse button - start firing
        this.weaponSystem?.startFiring();
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) {
        // Left mouse button released - stop firing
        this.weaponSystem?.stopFiring();
      }
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
        // Menu state - still update for demo mode
        this.updateGameplay(delta);
        break;
      case 'playing':
        // Update targets, projectiles, etc.
        this.updateGameplay(delta);
        break;
      case 'paused':
        // Paused - no updates
        break;
      // Add other states as needed
    }
  }

  private updateGameplay(delta: number): void {
    // Update weapon system
    this.weaponSystem?.update(delta);

    // Update projectiles with hit detection
    this.projectileManager?.update(delta, (projectileId, hitInfo) => {
      this.handleHit(projectileId, hitInfo);
    });

    // Update targets
    this.targetManager?.update(delta);
  }

  private handleHit(projectileId: string, hitInfo: HitInfo): void {
    console.log(`Hit! Target: ${hitInfo.targetId}, Direct: ${hitInfo.isDirect}`);

    // Destroy the target
    if (this.targetManager?.destroyTarget(hitInfo.targetId)) {
      this.sessionStats.hits++;

      // Visual feedback (to be enhanced)
      // TODO: Play hit sound, show hit marker, etc.
    }
  }

  private startDemoMode(): void {
    // Spawn initial targets for demo/testing
    this.gameState = 'menu';
    for (let i = 0; i < 5; i++) {
      this.targetManager?.spawnTarget();
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

  public getSessionStats(): { hits: number; misses: number; shots: number; accuracy: number } {
    const accuracy = this.sessionStats.shots > 0
      ? (this.sessionStats.hits / this.sessionStats.shots) * 100
      : 0;

    return {
      ...this.sessionStats,
      accuracy,
    };
  }

  public dispose(): void {
    this.stop();
    this.weaponSystem?.reset();
    this.projectileManager?.dispose();
    this.targetManager?.dispose();
    this.controls.dispose();
    this.engine.dispose();
  }
}
