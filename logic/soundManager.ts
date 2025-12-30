
class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, startTime?: number) {
    const ctx = this.getCtx();
    const start = startTime || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.1, 0.1);
  }

  playCardPlay() {
    this.playTone(400, 'triangle', 0.15, 0.2);
    setTimeout(() => this.playTone(600, 'triangle', 0.1, 0.1), 50);
  }

  playFreeze() {
    this.playTone(1000, 'sine', 0.5, 0.2);
    this.playTone(1200, 'sine', 0.4, 0.1);
  }

  playReverse() {
    this.playTone(300, 'sawtooth', 0.3, 0.1);
    this.playTone(200, 'sawtooth', 0.3, 0.1);
  }

  playVictory() {
    this.stopBGM();
    const ctx = this.getCtx();
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.4, 0.1), i * 150);
    });
  }

  playDefeat() {
    this.stopBGM();
    const ctx = this.getCtx();
    [440, 415, 392, 349].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.5, 0.1), i * 200);
    });
  }
  
  playChestOpen() {
    this.playTone(600, 'sine', 0.2, 0.1);
    setTimeout(() => this.playTone(900, 'sine', 0.4, 0.2), 100);
  }

  startBGM() {
    if (this.bgmInterval) return;
    const ctx = this.getCtx();
    const playLoop = () => {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((f, i) => {
        this.playTone(f, 'triangle', 0.5, 0.02, now + i * 0.5);
      });
    };
    playLoop();
    this.bgmInterval = setInterval(playLoop, 2000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sounds = new SoundManager();
