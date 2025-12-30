
class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;
  private intensity: 'normal' | 'urgent' = 'normal';
  private currentStep = 0;
  private isPlaying = false;

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
      
      setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
      }, (duration * 1000) + 100);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  // Melodia heróica inspirada em temas reais
  // Escala: C Major / A Minor
  private readonly MELODY_NORMAL = [261.63, 0, 329.63, 392.00, 523.25, 392.00, 329.63, 0];
  private readonly BASS_NORMAL = [130.81, 130.81, 164.81, 196.00];

  private readonly MELODY_URGENT = [329.63, 392.00, 523.25, 587.33, 659.25, 523.25, 392.00, 440.00];
  private readonly BASS_URGENT = [164.81, 196.00, 130.81, 146.83];

  setIntensity(level: 'normal' | 'urgent') {
    if (this.intensity !== level) {
      this.intensity = level;
      // Reinicia o loop para aplicar o novo BPM imediatamente
      if (this.isPlaying) {
        this.stopBGM();
        this.startBGM();
      }
    }
  }

  startBGM() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const ctx = this.getCtx();
    const bpm = this.intensity === 'normal' ? 120 : 160;
    const stepDuration = 60 / bpm / 2; // Colcheias

    const playStep = () => {
      const now = ctx.currentTime;
      
      // Bass layer (sempre presente)
      const bassFreq = this.intensity === 'normal' 
        ? this.BASS_NORMAL[this.currentStep % 4] 
        : this.BASS_URGENT[this.currentStep % 4];
      
      if (this.currentStep % 2 === 0) {
        this.playTone(bassFreq, 'triangle', stepDuration * 1.5, 0.02, now);
      }

      // Melody layer
      const melodyFreq = this.intensity === 'normal'
        ? this.MELODY_NORMAL[this.currentStep % 8]
        : this.MELODY_URGENT[this.currentStep % 8];

      if (melodyFreq > 0) {
        this.playTone(melodyFreq, this.intensity === 'normal' ? 'sine' : 'square', stepDuration * 0.8, 0.015, now);
      }

      // Percussion (simulada com ruído ou tons curtos)
      if (this.currentStep % 4 === 0) {
        this.playTone(50, 'sine', 0.05, 0.03, now); // Kick
      }
      if (this.intensity === 'urgent' && this.currentStep % 2 === 1) {
        this.playTone(2000, 'sine', 0.02, 0.01, now); // Snare/Hi-hat tension
      }

      this.currentStep++;
    };

    this.bgmInterval = setInterval(playStep, stepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isPlaying = false;
    this.currentStep = 0;
  }

  playClick() { this.playTone(800, 'sine', 0.05, 0.05); }
  playCardPlay() { this.playTone(400, 'triangle', 0.1, 0.1); }
  playFreeze() { this.playTone(1000, 'sine', 0.3, 0.1); }
  playReverse() { this.playTone(300, 'sawtooth', 0.2, 0.05); }
  
  playVictory() {
    this.stopBGM();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.4, 0.05), i * 150));
  }

  playDefeat() {
    this.stopBGM();
    const notes = [440, 349, 329.63, 261.63];
    notes.forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.5, 0.05), i * 200));
  }
  
  playChestOpen() {
    this.playTone(600, 'sine', 0.15, 0.1);
    setTimeout(() => this.playTone(900, 'sine', 0.3, 0.1), 100);
  }
}

export const sounds = new SoundManager();
