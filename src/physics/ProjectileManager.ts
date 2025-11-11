import * as THREE from 'three';
import { Projectile, WeaponModifiers } from '@/types';

export class ProjectileManager {
  private scene: THREE.Scene;
  private projectiles: Map<string, ProjectileInstance> = new Map();
  private projectilePool: THREE.Mesh[] = [];
  private readonly PROJECTILE_SPEED = 50; // m/s
  private readonly MAX_RANGE = 22; // meters
  private readonly BOUNCE_ENABLED = true;
  private readonly MAX_BOUNCES = 3;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initProjectilePool();
  }

  private initProjectilePool(): void {
    // Pre-create projectile meshes for object pooling
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      emissive: 0x2a5eff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });

    for (let i = 0; i < 50; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.projectilePool.push(mesh);
    }
  }

  private getProjectileMesh(): THREE.Mesh | null {
    return this.projectilePool.find(mesh => !mesh.visible) || null;
  }

  public createProjectile(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    id: string
  ): void {
    const mesh = this.getProjectileMesh();
    if (!mesh) {
      console.warn('Projectile pool exhausted');
      return;
    }

    mesh.position.copy(position);
    mesh.visible = true;

    const projectile: ProjectileInstance = {
      id,
      mesh,
      velocity: direction.clone().normalize().multiplyScalar(this.PROJECTILE_SPEED),
      distanceTraveled: 0,
      bounceCount: 0,
      active: true,
      startPosition: position.clone(),
    };

    this.projectiles.set(id, projectile);
  }

  public update(
    delta: number,
    onHit?: (projectileId: string, hitInfo: HitInfo) => void,
    onMiss?: (projectileId: string) => void
  ): void {
    const toRemove: string[] = [];

    this.projectiles.forEach((projectile, id) => {
      if (!projectile.active) {
        toRemove.push(id);
        return;
      }

      // Calculate movement for this frame
      const movement = projectile.velocity.clone().multiplyScalar(delta);
      const distance = movement.length();

      // Raycast for collision detection
      const raycaster = new THREE.Raycaster(
        projectile.mesh.position,
        movement.clone().normalize(),
        0,
        distance
      );

      // Check for collisions with arena boundaries
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      let hitSomething = false;
      let hitPoint: THREE.Vector3 | null = null;
      let hitNormal: THREE.Vector3 | null = null;

      if (intersects.length > 0) {
        // Filter out the projectile itself
        const validHit = intersects.find(hit => hit.object !== projectile.mesh);

        if (validHit) {
          hitSomething = true;
          hitPoint = validHit.point;
          hitNormal = validHit.face?.normal || null;

          // Check if we hit a target
          if (validHit.object.userData.isTarget) {
            if (onHit) {
              onHit(id, {
                targetId: validHit.object.userData.targetId,
                position: hitPoint,
                isDirect: true,
              });
            }
            // Projectile is destroyed on target hit
            projectile.active = false;
            toRemove.push(id);
            return;
          }

          // Handle bounce off walls
          if (this.BOUNCE_ENABLED && projectile.bounceCount < this.MAX_BOUNCES && hitNormal) {
            // Reflect velocity off the surface
            const normal = hitNormal.clone();
            if (validHit.object.matrixWorld) {
              normal.transformDirection(validHit.object.matrixWorld);
            }
            normal.normalize();

            projectile.velocity.reflect(normal);
            projectile.mesh.position.copy(hitPoint).add(normal.multiplyScalar(0.01));
            projectile.bounceCount++;
          } else {
            // No more bounces, destroy projectile
            projectile.active = false;
            toRemove.push(id);
            return;
          }
        }
      }

      // Move projectile if no collision or after bounce
      if (!hitSomething || (hitSomething && projectile.bounceCount < this.MAX_BOUNCES)) {
        projectile.mesh.position.add(movement);
        projectile.distanceTraveled += distance;
      }

      // Check if projectile exceeded max range
      if (projectile.distanceTraveled >= this.MAX_RANGE) {
        projectile.active = false;
        toRemove.push(id);

        // Check for splash damage hits in area before imploding
        let hadSplashHit = false;
        if (onHit) {
          hadSplashHit = this.checkSplashDamage(projectile.mesh.position, id, onHit);
        }

        // If no splash hits, count as a miss
        if (!hadSplashHit && onMiss) {
          onMiss(id);
        }
      }
    });

    // Remove inactive projectiles
    toRemove.forEach(id => {
      const projectile = this.projectiles.get(id);
      if (projectile) {
        projectile.mesh.visible = false;
        this.projectiles.delete(id);
      }
    });
  }

  private checkSplashDamage(
    position: THREE.Vector3,
    projectileId: string,
    onHit: (projectileId: string, hitInfo: HitInfo) => void
  ): boolean {
    const SPLASH_RADIUS = 3; // meters
    let hitCount = 0;

    // Check all objects in scene for targets within splash radius
    this.scene.traverse((object) => {
      if (object.userData.isTarget) {
        const distance = object.position.distanceTo(position);
        if (distance <= SPLASH_RADIUS) {
          onHit(projectileId, {
            targetId: object.userData.targetId,
            position: position.clone(),
            isDirect: false,
          });
          hitCount++;
        }
      }
    });

    return hitCount > 0;
  }

  public clear(): void {
    this.projectiles.forEach((projectile) => {
      projectile.mesh.visible = false;
    });
    this.projectiles.clear();
  }

  public getActiveProjectileCount(): number {
    return this.projectiles.size;
  }

  public dispose(): void {
    this.clear();
    this.projectilePool.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      this.scene.remove(mesh);
    });
    this.projectilePool = [];
  }
}

interface ProjectileInstance {
  id: string;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  distanceTraveled: number;
  bounceCount: number;
  active: boolean;
  startPosition: THREE.Vector3;
}

export interface HitInfo {
  targetId: string;
  position: THREE.Vector3;
  isDirect: boolean;
}
