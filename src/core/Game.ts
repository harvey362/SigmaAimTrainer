import { Engine } from './Engine';
import { FirstPersonControls } from './Controls';
import { SessionManager } from './SessionManager';
import { LivesSystem } from './LivesSystem';
import { GameSettings, GameState, SessionConfig, WeaponModifiers } from '@/types';
import { ProjectileManager } from '@/physics/ProjectileManager';
import { WeaponSystem } from '@/physics/WeaponSystem';
import { TargetManager } from '@/targets/TargetManager';
import { HitInfo } from '@/physics/ProjectileManager';
import { AudioManager } from '@/audio/AudioManager';

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
  private sessionManager: SessionManager;
  private livesSystem: LivesSystem;
  private audioManager: AudioManager;

  // Session stats
  private currentSession: SessionConfig | null = null;
  private sessionStats = {
    hits: 0,
    misses: 0,
    shots: 0,
  };

  // UI Callbacks
  private onPauseCallback?: () => void;
  private onResumeCallback?: () => void;
  private onSessionEndUICallback?: () => void;

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

    // Initialize session and lives systems
    this.sessionManager = new SessionManager();
    this.livesSystem = new LivesSystem(false, 3);

    // Initialize audio system
    this.audioManager = new AudioManager();
    this.audioManager.setMasterVolume(this.settings.audio.masterVolume);
    this.audioManager.setHitSoundVolume(this.settings.audio.hitSoundVolume);

    // Setup session callbacks
    this.setupSessionCallbacks();

    // Initialize gameplay systems
    this.initGameplaySystems();

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupSessionCallbacks(): void {
    // Handle session end
    this.sessionManager.onSessionEnd((reason) => {
      console.log(`Session ended: ${reason}`);
      this.handleSessionEnd(reason);
    });

    // Handle life lost
    this.livesSystem.onLifeLost((livesRemaining) => {
      console.log(`Life lost! Lives remaining: ${livesRemaining}`);
    });

    // Handle all lives lost
    this.livesSystem.onAllLivesLost(() => {
      console.log('All lives lost!');
      this.sessionManager.endSession('lives');
    });
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
    // Update session manager
    this.sessionManager.update(delta);

    // Update weapon system
    this.weaponSystem?.update(delta);

    // Update projectiles with hit detection
    this.projectileManager?.update(delta, (projectileId, hitInfo) => {
      this.handleHit(projectileId, hitInfo);
    }, (projectileId) => {
      this.handleMiss(projectileId);
    });

    // Update targets
    this.targetManager?.update(delta);
  }

  private handleHit(projectileId: string, hitInfo: HitInfo): void {
    console.log(`Hit! Target: ${hitInfo.targetId}, Direct: ${hitInfo.isDirect}`);

    // Destroy the target
    if (this.targetManager?.destroyTarget(hitInfo.targetId)) {
      this.sessionStats.hits++;

      // Play hit sound
      this.audioManager.playHitSound();
    }
  }

  private handleMiss(projectileId: string): void {
    // Projectile expired without hitting anything
    this.sessionStats.misses++;
    this.livesSystem.recordMiss();
  }

  private handleSessionEnd(reason: 'time' | 'lives' | 'manual'): void {
    console.log(`Session ended due to: ${reason}`);
    this.gameState = 'results';
    this.weaponSystem?.stopFiring();
    this.controls.unlock();

    if (this.onSessionEndUICallback) {
      this.onSessionEndUICallback();
    }
  }

  public onPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  public onResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  public onSessionEndUI(callback: () => void): void {
    this.onSessionEndUICallback = callback;
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
    this.sessionManager.pause();
    this.weaponSystem?.stopFiring();
    this.controls.unlock();

    if (this.onPauseCallback) {
      this.onPauseCallback();
    }
  }

  public resume(): void {
    if (this.gameState !== 'paused') return;
    this.gameState = 'playing';
    this.sessionManager.resume();

    if (this.onResumeCallback) {
      this.onResumeCallback();
    }
  }

  public quitToMenu(): void {
    this.gameState = 'menu';
    this.sessionManager.endSession('manual');
    this.weaponSystem?.stopFiring();
    this.targetManager?.clear();
    this.projectileManager?.clear();
    this.controls.unlock();

    // Spawn demo targets
    for (let i = 0; i < 5; i++) {
      this.targetManager?.spawnTarget();
    }
  }

  public startNewSession(config: SessionConfig): void {
    // Reset stats
    this.sessionStats = { hits: 0, misses: 0, shots: 0 };

    // Configure systems
    this.currentSession = config;
    this.sessionManager.startSession(config);
    this.livesSystem.reset(
      config.challengeModifiers.livesEnabled,
      config.challengeModifiers.livesCount || 3
    );

    // Update target settings
    this.targetManager?.updateSettings(config.targetSettings);

    // Update weapon modifiers
    this.weaponSystem?.setModifiers(config.weaponModifiers);

    // Clear existing targets and spawn new ones
    this.targetManager?.clear();
    for (let i = 0; i < config.targetSettings.maxTargets; i++) {
      this.targetManager?.spawnTarget();
    }

    // Start playing
    this.gameState = 'playing';
    console.log('Session started with config:', config);
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
    if (settings.audio?.masterVolume !== undefined) {
      this.audioManager.setMasterVolume(settings.audio.masterVolume);
    }
    if (settings.audio?.hitSoundVolume !== undefined) {
      this.audioManager.setHitSoundVolume(settings.audio.hitSoundVolume);
    }
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public getSessionStats(): {
    hits: number;
    misses: number;
    shots: number;
    accuracy: number;
    livesEnabled: boolean;
    livesRemaining: number;
    elapsedTime: number;
    remainingTime: number;
  } {
    const accuracy = this.sessionStats.shots > 0
      ? (this.sessionStats.hits / this.sessionStats.shots) * 100
      : 0;

    return {
      ...this.sessionStats,
      accuracy,
      livesEnabled: this.livesSystem.isEnabled(),
      livesRemaining: this.livesSystem.getLivesRemaining(),
      elapsedTime: this.sessionManager.getElapsedTime(),
      remainingTime: this.sessionManager.getRemainingTime(),
    };
  }

  public dispose(): void {
    this.stop();
    this.weaponSystem?.reset();
    this.projectileManager?.dispose();
    this.targetManager?.dispose();
    this.audioManager.dispose();
    this.controls.dispose();
    this.engine.dispose();
  }
}
