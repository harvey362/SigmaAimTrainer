import * as THREE from 'three';
import { TargetSettings, TargetType } from '@/types';

export class TargetManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private targets: Map<string, TargetInstance> = new Map();
  private settings: TargetSettings;
  private targetIdCounter: number = 0;
  private meshPool: Map<TargetType, THREE.Mesh[]> = new Map();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, settings: TargetSettings) {
    this.scene = scene;
    this.camera = camera;
    this.settings = settings;
    this.initMeshPools();
  }

  private initMeshPools(): void {
    // Create mesh pools for different target types
    const targetTypes: TargetType[] = ['stationary-bot', 'flying-bot', 'small', 'medium', 'large'];

    targetTypes.forEach(type => {
      this.meshPool.set(type, []);
      for (let i = 0; i < 20; i++) {
        const mesh = this.createTargetMesh(type);
        mesh.visible = false;
        this.scene.add(mesh);
        this.meshPool.get(type)?.push(mesh);
      }
    });
  }

  private createTargetMesh(type: TargetType): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let size = 1.0;
    let color = 0xff4444;

    switch (type) {
      case 'stationary-bot':
        geometry = new THREE.BoxGeometry(1, 1.8, 1);
        color = 0xff4444;
        size = 1.0;
        break;
      case 'flying-bot':
        geometry = new THREE.SphereGeometry(0.6, 32, 32);
        color = 0x44ff44;
        size = 1.2;
        break;
      case 'small':
        geometry = new THREE.SphereGeometry(0.4, 32, 32);
        color = 0xffaa44;
        size = 0.8;
        break;
      case 'medium':
        geometry = new THREE.SphereGeometry(0.6, 32, 32);
        color = 0xff4444;
        size = 1.0;
        break;
      case 'large':
        geometry = new THREE.SphereGeometry(0.9, 32, 32);
        color = 0xff44aa;
        size = 1.2;
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.setScalar(size);

    return mesh;
  }

  private getMeshFromPool(type: TargetType): THREE.Mesh | null {
    const pool = this.meshPool.get(type);
    if (!pool) return null;

    const mesh = pool.find(m => !m.visible);
    return mesh || null;
  }

  public spawnTarget(type?: TargetType): string | null {
    // Don't spawn if at max capacity
    if (this.targets.size >= this.settings.maxTargets) {
      return null;
    }

    // Random type if not specified
    const targetType = type || this.getRandomTargetType();
    const mesh = this.getMeshFromPool(targetType);

    if (!mesh) {
      console.warn('Target mesh pool exhausted for type:', targetType);
      return null;
    }

    // Generate spawn position with overlap checking
    const position = this.generateNonOverlappingSpawnPosition(targetType);
    if (!position) {
      // Could not find non-overlapping position after multiple attempts
      mesh.visible = false;
      return null;
    }

    mesh.position.copy(position);
    mesh.visible = true;

    const targetId = `target_${this.targetIdCounter++}`;

    // Set user data for hit detection
    mesh.userData = {
      isTarget: true,
      targetId,
    };

    const target: TargetInstance = {
      id: targetId,
      type: targetType,
      mesh,
      velocity: new THREE.Vector3(),
      active: true,
      spawnTime: Date.now(),
    };

    // Setup movement if enabled
    if (this.settings.movementEnabled) {
      target.velocity = this.generateMovementVelocity();
    }

    this.targets.set(targetId, target);
    return targetId;
  }

  private getRandomTargetType(): TargetType {
    const types = this.settings.targetTypes;
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateNonOverlappingSpawnPosition(type: TargetType): THREE.Vector3 | null {
    const MIN_DISTANCE = 3.0; // Minimum distance between targets (meters)
    const MAX_ATTEMPTS = 20;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const position = this.generateSpawnPosition();

      // Check if position overlaps with existing targets
      let hasOverlap = false;
      this.targets.forEach(target => {
        const distance = position.distanceTo(target.mesh.position);
        if (distance < MIN_DISTANCE) {
          hasOverlap = true;
        }
      });

      if (!hasOverlap) {
        return position;
      }
    }

    // Could not find non-overlapping position
    return null;
  }

  private generateSpawnPosition(): THREE.Vector3 {
    const cameraPos = this.camera.position.clone();
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);

    // Convert spawn ranges from degrees to radians
    const horizontalRange = this.settings.spawnRangeHorizontal * (Math.PI / 180);
    const verticalMin = this.settings.spawnRangeVertical.min * (Math.PI / 180);
    const verticalMax = this.settings.spawnRangeVertical.max * (Math.PI / 180);

    // Random angles within range
    const horizontalAngle = (Math.random() - 0.5) * horizontalRange;
    const verticalAngle = verticalMin + Math.random() * (verticalMax - verticalMin);

    // Random distance (10-20 meters from camera)
    const distance = 10 + Math.random() * 10;

    // Calculate position using spherical coordinates
    const euler = new THREE.Euler(0, horizontalAngle, 0, 'YXZ');
    const direction = cameraDir.clone().applyEuler(euler);

    // Apply vertical angle
    const verticalRotation = new THREE.Euler(verticalAngle, 0, 0, 'XYZ');
    direction.applyEuler(verticalRotation);

    const position = cameraPos.clone().add(direction.multiplyScalar(distance));

    // Keep within bounds
    position.x = Math.max(-18, Math.min(18, position.x));
    position.y = Math.max(1, Math.min(18, position.y));
    position.z = Math.max(-18, Math.min(18, position.z));

    return position;
  }

  private generateMovementVelocity(): THREE.Vector3 {
    const speed = this.settings.movementSpeed;

    if (this.settings.movementPattern === 'none') {
      return new THREE.Vector3();
    }

    if (this.settings.movementPattern === 'predictable') {
      // Smooth horizontal circular motion
      const angle = Math.random() * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.3,
        Math.sin(angle) * speed
      );
    }

    if (this.settings.movementPattern === 'both') {
      // Mix of predictable and random
      if (Math.random() < 0.5) {
        // Predictable circular pattern
        const angle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.3,
          Math.sin(angle) * speed
        );
      } else {
        // Random direction
        return new THREE.Vector3(
          (Math.random() - 0.5) * speed * 2,
          (Math.random() - 0.5) * speed * 0.5,
          (Math.random() - 0.5) * speed * 2
        ).normalize().multiplyScalar(speed);
      }
    }

    // Random movement (default)
    return new THREE.Vector3(
      (Math.random() - 0.5) * speed * 2,
      (Math.random() - 0.5) * speed * 0.5,
      (Math.random() - 0.5) * speed * 2
    ).normalize().multiplyScalar(speed);
  }

  public update(delta: number): void {
    this.targets.forEach((target, id) => {
      if (!target.active) return;

      // Update position if moving
      if (this.settings.movementEnabled && target.velocity.length() > 0) {
        target.mesh.position.add(target.velocity.clone().multiplyScalar(delta));

        // Bounce off boundaries
        const pos = target.mesh.position;
        const bound = 18;

        if (Math.abs(pos.x) > bound) {
          target.velocity.x *= -1;
          pos.x = Math.sign(pos.x) * bound;
        }
        if (pos.y < 1 || pos.y > 18) {
          target.velocity.y *= -1;
          pos.y = Math.max(1, Math.min(18, pos.y));
        }
        if (Math.abs(pos.z) > bound) {
          target.velocity.z *= -1;
          pos.z = Math.sign(pos.z) * bound;
        }

        // Update movement pattern
        if (this.settings.movementPattern === 'random') {
          // Occasionally change direction
          if (Math.random() < 0.01) {
            target.velocity = this.generateMovementVelocity();
          }
        }
      }
    });
  }

  public destroyTarget(targetId: string): boolean {
    const target = this.targets.get(targetId);
    if (!target) return false;

    target.mesh.visible = false;
    target.active = false;
    this.targets.delete(targetId);

    // Respawn logic
    this.handleRespawn();

    return true;
  }

  private handleRespawn(): void {
    if (this.targets.size < this.settings.maxTargets) {
      switch (this.settings.respawnBehavior) {
        case 'immediate':
          this.spawnTarget();
          break;
        case 'fixed-delay':
          setTimeout(() => this.spawnTarget(), this.settings.respawnDelay || 1000);
          break;
        case 'random-delay':
          const delay = (this.settings.respawnDelay || 1000) * (0.5 + Math.random());
          setTimeout(() => this.spawnTarget(), delay);
          break;
      }
    }
  }

  public getTarget(targetId: string): TargetInstance | undefined {
    return this.targets.get(targetId);
  }

  public getActiveTargetCount(): number {
    return this.targets.size;
  }

  public updateSettings(settings: TargetSettings): void {
    this.settings = settings;
  }

  public clear(): void {
    this.targets.forEach(target => {
      target.mesh.visible = false;
    });
    this.targets.clear();
  }

  public dispose(): void {
    this.clear();
    this.meshPool.forEach(pool => {
      pool.forEach(mesh => {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
        this.scene.remove(mesh);
      });
    });
    this.meshPool.clear();
  }
}

export interface TargetInstance {
  id: string;
  type: TargetType;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  active: boolean;
  spawnTime: number;
}
