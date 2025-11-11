import * as THREE from 'three';

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private isLocked: boolean = false;

  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;

  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();

  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private sensitivity: number = 0.002;

  private minPolarAngle: number = 0;
  private maxPolarAngle: number = Math.PI;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, sensitivity: number = 1.0) {
    this.camera = camera;
    this.domElement = domElement;
    this.sensitivity = 0.002 * sensitivity;

    this.initPointerLock();
    this.initKeyboardControls();
  }

  private initPointerLock(): void {
    this.domElement.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.euler.setFromQuaternion(this.camera.quaternion);

      this.euler.y -= movementX * this.sensitivity;
      this.euler.x -= movementY * this.sensitivity;

      this.euler.x = Math.max(
        Math.PI / 2 - this.maxPolarAngle,
        Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x)
      );

      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  private initKeyboardControls(): void {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  public update(delta: number): void {
    if (!this.isLocked) return;

    const moveSpeed = 4.5; // meters per second

    // Apply friction
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // Get camera's forward and right vectors (projected onto XZ plane)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    right.normalize();

    // Calculate movement direction
    this.direction.set(0, 0, 0);

    if (this.moveForward) {
      this.direction.add(forward);
    }
    if (this.moveBackward) {
      this.direction.sub(forward);
    }
    if (this.moveRight) {
      this.direction.add(right);
    }
    if (this.moveLeft) {
      this.direction.sub(right);
    }

    // Normalize to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.velocity.add(this.direction.multiplyScalar(moveSpeed * delta));
    }

    // Apply velocity to position
    this.camera.position.x += this.velocity.x;
    this.camera.position.z += this.velocity.z;

    // Keep camera at eye level
    this.camera.position.y = 1.6;

    // Keep camera within bounds
    const bound = 18;
    this.camera.position.x = Math.max(-bound, Math.min(bound, this.camera.position.x));
    this.camera.position.z = Math.max(-bound, Math.min(bound, this.camera.position.z));
  }

  public setSensitivity(sensitivity: number): void {
    this.sensitivity = 0.002 * sensitivity;
  }

  public unlock(): void {
    if (this.isLocked) {
      document.exitPointerLock();
    }
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public dispose(): void {
    this.unlock();
  }
}
