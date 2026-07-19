export class LockAudio {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  resume() {
    this.ensure();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  setPin(pitch: number, volume = 0.28) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 900 * pitch;
    osc.frequency.exponentialRampToValueAtTime(500 * pitch, now + 0.05);
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  falseSet(pitch: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 620 * pitch;
    osc.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.08);
    gain.gain.value = 0.18;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  overset(pitch: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 220 * pitch;
    gain.gain.value = 0.24;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  scrape(pitch: number, intensity = 0.5) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const noiseLen = 0.06;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600 * pitch;
    filter.Q.value = 3.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.06 * intensity;
    gain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }

  pickBreak() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 180;
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
    gain.gain.value = 0.32;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  opened() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [520, 780, 1040];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.06;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }
}
