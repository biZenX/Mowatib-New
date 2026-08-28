class AudioService {
  constructor() {
    this.ctx = null;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playAlarm(soundType = 'zen-bowl', volume = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    switch (soundType) {
      case 'zen-bowl':
        this.playZenBowl(ctx, volume);
        break;
      case 'bell':
        this.playBell(ctx, volume);
        break;
      case 'marimba':
        this.playMarimba(ctx, volume);
        break;
      case 'gong':
        this.playGong(ctx, volume);
        break;
      case 'digital':
        this.playDigital(ctx, volume);
        break;
      default:
        this.playZenBowl(ctx, volume);
        break;
    }
  }

  playZenBowl(ctx, volume) {
    const now = ctx.currentTime;
    const baseFreq = 261.63;
    const harmonics = [1, 2.76, 5.4, 8.9];
    const gains = [0.6, 0.3, 0.15, 0.08];

    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * gains[i], now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  playBell(ctx, volume) {
    const now = ctx.currentTime;
    const freqs = [880, 1760, 2640];
    const gains = [0.5, 0.25, 0.1];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * gains[i], now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.1);
    });
  }

  playMarimba(ctx, volume) {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const noteTime = now + index * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 1.0);
    });
  }

  playGong(ctx, volume) {
    const now = ctx.currentTime;
    const freqs = [130.81, 196.00, 329.63];

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.2);
    });
  }

  playDigital(ctx, volume) {
    const now = ctx.currentTime;
    const beeps = [0, 0.2];

    beeps.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.5, now + offset);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + offset + 0.01);
      gain.gain.setValueAtTime(volume * 0.3, now + offset + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  playClick() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audioService = new AudioService();
