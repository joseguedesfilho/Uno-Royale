
class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, startTime?: number) {
    try {
      const ctx = this.getCtx();
      const start = startTime || ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
      
      // Auto-cleanup references after duration
      setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
      }, (duration * 1000) + 100);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  playClick() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  playCardPlay() {
    this.playTone(400, 'triangle', 0.1, 0.1);
  }

  playFreeze() {
    this.playTone(1000, 'sine', 0.3, 0.1);
  }

  playReverse() {
    this.playTone(300, 'sawtooth', 0.2, 0.05);
  }

  playVictory() {
    this.stopBGM();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.3, 0.05), i * 150);
    });
  }

  playDefeat() {
    this.stopBGM();
    [440, 349].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.4, 0.05), i * 200);
    });
  }
  
  playChestOpen() {
    this.playTone(600, 'sine', 0.15, 0.1);
    setTimeout(() => this.playTone(900, 'sine', 0.3, 0.1), 100);
  }

  startBGM() {
    if (this.bgmInterval) return;
    const playLoop = () => {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      const notes = [261.63, 392.00]; 
      notes.forEach((f, i) => {
        this.playTone(f, 'triangle', 0.4, 0.01, now + i * 1.0);
      });
    };
    playLoop();
    this.bgmInterval = setInterval(playLoop, 4000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sounds = new SoundManager();
