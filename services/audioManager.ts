
/**
 * AudioManager handles all sound playback.
 * Updated to use Web Audio API for SFX ensuring sound works without external files.
 */
class AudioManager {
  private bgm: HTMLAudioElement | null = null;
  private muted: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext on user interaction usually, but we prep it here
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) {
      this.audioCtx = new AudioContext();
    }
  }

  private ensureAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.audioCtx) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  // Simulated paths for BGM
  private sounds: Record<string, string> = {
    bgm_sea: 'assets/audio/ambience_underwater.mp3',
    bgm_forest: 'assets/audio/ambience_forest_birds.mp3',
    bgm_sky: 'assets/audio/ambience_wind.mp3',
  };

  public setMute(isMuted: boolean) {
    this.muted = isMuted;
    if (this.bgm) {
      this.bgm.muted = isMuted;
    }
  }

  /**
   * Synthesize a sound using an oscillator.
   */
  private playTone(freq: number, type: OscillatorType, duration: number, startTime = 0) {
    if (this.muted || !this.audioCtx) return;
    this.ensureAudioContext();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);
    
    // Envelope for smooth sound
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(this.audioCtx.currentTime + startTime);
    osc.stop(this.audioCtx.currentTime + startTime + duration);
  }

  public playUISFX(type: 'click' | 'hover') {
    if (this.muted) return;
    
    switch (type) {
        case 'hover':
            this.playTone(400, 'sine', 0.05);
            break;
        case 'click':
            this.playTone(600, 'triangle', 0.1);
            break;
    }
  }

  public playSFX(key: 'correct' | 'wrong' | 'gameover' | 'win') {
    if (this.muted) return;

    switch (key) {
      case 'correct':
        // High pitch ding (Sine wave)
        this.playTone(880, 'sine', 0.5); // A5
        setTimeout(() => this.playTone(1100, 'sine', 0.4), 100); // C#6
        break;
      case 'wrong':
        // Low buzzing error (Sawtooth)
        this.playTone(150, 'sawtooth', 0.4);
        break;
      case 'gameover':
        // Descending tones
        this.playTone(400, 'triangle', 0.3);
        setTimeout(() => this.playTone(300, 'triangle', 0.3), 250);
        setTimeout(() => this.playTone(200, 'triangle', 0.8), 500);
        break;
      case 'win':
        // Ascending Arpeggio
        this.playTone(523.25, 'sine', 0.2);
        setTimeout(() => this.playTone(659.25, 'sine', 0.2), 150);
        setTimeout(() => this.playTone(783.99, 'sine', 0.4), 300);
        break;
    }
  }

  public playThemeSFX(type: 'correct' | 'wrong', themeId: string) {
    this.playSFX(type);
  }

  public playLetterSound(url: string) {
    if (this.muted || !url) return;
    
    // We use standard HTML5 Audio for these external files
    const audio = new Audio(url);
    audio.volume = 1.0; 
    audio.play().catch(e => {
        // console.warn("Could not play letter sound:", e);
    });
  }

  public playBGM(theme: 'sea' | 'forest' | 'sky') {
    if (this.muted) return;
    this.stopBGM();

    // Re-enable context just in case
    this.ensureAudioContext();

    const key = `bgm_${theme}`;
    const src = this.sounds[key];
    
    if (src) {
      this.bgm = new Audio(src);
      this.bgm.loop = true;
      this.bgm.volume = 0.1; // Quiet background music
      this.bgm.muted = this.muted;
      this.bgm.play().catch(() => {
        // console.log("BGM file missing, skipping.");
      });
    }
  }

  public stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
    }
  }
}

export const audioManager = new AudioManager();
