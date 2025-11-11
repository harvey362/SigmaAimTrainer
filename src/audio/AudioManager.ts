export class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = 0.7;
  private hitSoundVolume: number = 0.8;

  constructor() {
    // Initialize Web Audio API context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setHitSoundVolume(volume: number): void {
    this.hitSoundVolume = Math.max(0, Math.min(1, volume));
  }

  public playHitSound(): void {
    // Resume audio context if it was suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;

    // Create oscillator for the "ping" sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Connect nodes: oscillator -> gain -> destination
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configure the sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now); // Start at 800 Hz
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1); // Drop to 400 Hz

    // Volume envelope (ADSR-like)
    const volume = this.masterVolume * this.hitSoundVolume * 0.3;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Decay/Release

    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.15);

    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  public playMissSound(): void {
    // Optional: Add a subtle miss sound (can be removed if not desired)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Lower pitched, shorter sound for miss
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    const volume = this.masterVolume * 0.1; // Very quiet
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscillator.start(now);
    oscillator.stop(now + 0.08);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  public dispose(): void {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
