import * as THREE from 'three';
import { WeaponModifiers } from '@/types';
import { ProjectileManager, HitInfo } from './ProjectileManager';

export class WeaponSystem {
  private camera: THREE.PerspectiveCamera;
  private projectileManager: ProjectileManager;
  private modifiers: WeaponModifiers;

  private isFiring: boolean = false;
  private burstCount: number = 0;
  private timeSinceLastShot: number = 0;
  private timeSinceLastBurst: number = 0;

  private readonly BASE_BURST_DELAY = 1.48; // seconds between bursts
  private readonly BURST_SHOT_DELAY = 0.08; // seconds between shots in a burst

  private projectileIdCounter: number = 0;
  private onFireCallback?: () => void;
  private onHitCallback?: (projectileId: string, hitInfo: HitInfo) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    projectileManager: ProjectileManager,
    modifiers: WeaponModifiers
  ) {
    this.camera = camera;
    this.projectileManager = projectileManager;
    this.modifiers = modifiers;
  }

  public startFiring(): void {
    if (this.isFiring) return;
    this.isFiring = true;
    this.burstCount = 0;
    this.timeSinceLastShot = 0;
    this.timeSinceLastBurst = this.getBurstDelay(); // Ready to fire immediately
  }

  public stopFiring(): void {
    this.isFiring = false;
    this.burstCount = 0;
  }

  public update(delta: number): void {
    if (!this.isFiring) return;

    this.timeSinceLastShot += delta;
    this.timeSinceLastBurst += delta;

    // Check if we should fire the next burst
    if (this.timeSinceLastBurst >= this.getBurstDelay()) {
      // Start new burst
      this.burstCount = 0;
      this.timeSinceLastBurst = 0;
      this.timeSinceLastShot = 0;
      this.fireProjectile();
      this.burstCount++;
    } else if (
      this.burstCount > 0 &&
      this.burstCount < this.modifiers.spheresPerBurst &&
      this.timeSinceLastShot >= this.BURST_SHOT_DELAY
    ) {
      // Continue current burst
      this.fireProjectile();
      this.burstCount++;
      this.timeSinceLastShot = 0;
    }
  }

  private fireProjectile(): void {
    // Get camera position and direction
    const position = this.camera.position.clone();

    // Offset slightly forward from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    position.add(direction.clone().multiplyScalar(0.5));

    // Create projectile
    const projectileId = `projectile_${this.projectileIdCounter++}`;
    this.projectileManager.createProjectile(position, direction, projectileId);

    // Trigger fire callback
    if (this.onFireCallback) {
      this.onFireCallback();
    }
  }

  private getBurstDelay(): number {
    // Apply attack speed modifier
    return this.BASE_BURST_DELAY / this.modifiers.attackSpeed;
  }

  public setModifiers(modifiers: WeaponModifiers): void {
    this.modifiers = modifiers;
  }

  public getModifiers(): WeaponModifiers {
    return this.modifiers;
  }

  public onFire(callback: () => void): void {
    this.onFireCallback = callback;
  }

  public onHit(callback: (projectileId: string, hitInfo: HitInfo) => void): void {
    this.onHitCallback = callback;
  }

  public isBurstActive(): boolean {
    return this.isFiring && this.burstCount > 0;
  }

  public getTotalShotsFired(): number {
    return this.projectileIdCounter;
  }

  public reset(): void {
    this.isFiring = false;
    this.burstCount = 0;
    this.timeSinceLastShot = 0;
    this.timeSinceLastBurst = 0;
    this.projectileIdCounter = 0;
  }
}
