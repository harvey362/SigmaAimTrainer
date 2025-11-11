import * as THREE from 'three';
import { GameSettings } from '@/types';

export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor(container: HTMLElement, settings: GameSettings) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 100);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      settings.video.fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0); // Eye level height (~1.6m)

    // Add basic lighting
    this.setupLighting();

    // Setup environment
    this.setupEnvironment();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light for shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupEnvironment(): void {
    // Create simple arena floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData = { isWall: true };
    this.scene.add(floor);

    // Create arena walls (simple box)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      wallMaterial
    );
    backWall.position.set(0, 10, -20);
    backWall.receiveShadow = true;
    backWall.userData = { isWall: true };
    this.scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      wallMaterial
    );
    leftWall.position.set(-20, 10, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.userData = { isWall: true };
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      wallMaterial
    );
    rightWall.position.set(20, 10, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.userData = { isWall: true };
    this.scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      wallMaterial
    );
    ceiling.position.set(0, 20, 0);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    ceiling.userData = { isWall: true };
    this.scene.add(ceiling);

    // Add grid helper for spatial reference
    const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getDeltaTime(): number {
    return this.clock.getDelta();
  }

  public updateFOV(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  public setTheme(theme: string): void {
    // Theme implementation - will be expanded later
    const themeColors: Record<string, number> = {
      'training-room': 0x0a0a0a,
      'abstract-blue': 0x0a1a2a,
      'abstract-purple': 0x1a0a2a,
      'neon': 0x0f0f0f,
    };

    const color = themeColors[theme] || 0x0a0a0a;
    this.scene.background = new THREE.Color(color);
    this.scene.fog = new THREE.Fog(color, 50, 100);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
    this.scene.clear();
  }
}
