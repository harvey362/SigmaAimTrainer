// Core type definitions for Sigma Aim Trainer

export interface GameSettings {
  video: VideoSettings;
  audio: AudioSettings;
  controls: ControlSettings;
  gameplay: GameplaySettings;
}

export interface VideoSettings {
  fullscreen: boolean;
  resolution: { width: number; height: number };
  fov: number;
  theme: EnvironmentTheme;
}

export interface AudioSettings {
  masterVolume: number;
  hitSoundVolume: number;
}

export interface ControlSettings {
  mouseSensitivity: number;
}

export interface GameplaySettings {
  maxTargetsOnScreen: number;
  showExplosionRadius: boolean;
}

export type EnvironmentTheme = 'training-room' | 'abstract-blue' | 'abstract-purple' | 'neon';

export interface SessionConfig {
  sessionType: SessionType;
  duration?: number; // in seconds, undefined for untimed
  targetSettings: TargetSettings;
  weaponModifiers: WeaponModifiers;
  challengeModifiers: ChallengeModifiers;
}

export type SessionType = 'untimed' | '30s' | '60s' | 'custom';

export interface TargetSettings {
  targetTypes: TargetType[];
  targetSize: number; // multiplier
  movementEnabled: boolean;
  movementPattern: MovementPattern;
  movementSpeed: number;
  spawnRangeHorizontal: 45 | 160 | 360; // degrees
  spawnRangeVertical: { min: number; max: number }; // 0 to 60 degrees up
  maxTargets: number;
  respawnBehavior: RespawnBehavior;
  respawnDelay?: number; // in ms
}

export type TargetType = 'stationary-bot' | 'flying-bot' | 'small' | 'medium' | 'large';
export type MovementPattern = 'none' | 'predictable' | 'random' | 'both';
export type RespawnBehavior = 'immediate' | 'fixed-delay' | 'random-delay';

export interface WeaponModifiers {
  attackSpeed: number; // multiplier
  spheresPerBurst: 2 | 3;
  splashRadiusEnabled: boolean;
}

export interface ChallengeModifiers {
  livesEnabled: boolean;
  livesCount?: number;
}

export interface SessionStats {
  accuracy: number;
  totalHits: number;
  totalMisses: number;
  totalShots: number;
  sessionConfig: SessionConfig;
  timestamp: number;
  duration: number; // actual duration in seconds
}

export interface LifetimeStats {
  totalShotsFired: number;
  overallAccuracy: number;
  totalTimePlayed: number; // in seconds
  personalBests: {
    highestAccuracy: number;
    mostHits: number;
  };
  sessionHistory: SessionStats[]; // last 15 sessions
}

export interface Target {
  id: string;
  type: TargetType;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  size: number;
  active: boolean;
}

export interface Projectile {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  distanceTraveled: number;
  bounceCount: number;
  active: boolean;
}

export interface HypersphereConstants {
  PROJECTILE_SPEED: 50; // m/s
  MAX_RANGE: 22; // meters
  SPLASH_RADIUS: 3; // meters
  BURST_DELAY: 1.48; // seconds
  BOUNCE_ENABLED: boolean;
}

export type GameState = 'menu' | 'setup' | 'countdown' | 'playing' | 'paused' | 'results';

export interface GameContext {
  state: GameState;
  currentSession?: SessionConfig;
  currentStats?: {
    hits: number;
    misses: number;
    shots: number;
    livesRemaining?: number;
    startTime: number;
    elapsedTime: number;
  };
}
