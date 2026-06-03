// Web Audio API cheerful sound effects generator
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audioControl = {
  setMuted(muted: boolean) {
    isMutedGlobal = muted;
    try {
      localStorage.setItem('coffee_corner_muted', muted ? 'true' : 'false');
    } catch (e) {
      // Ignore storage errors
    }
  },
  getMuted(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('coffee_corner_muted');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return isMutedGlobal;
  }
};

export function playSipSound() {
  if (audioControl.getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Create a bubbling coffee sip sound (ascending mellow warm oscillator tones)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  // Sip bubble frequency slide
  osc.frequency.setValueAtTime(250, now);
  osc.frequency.exponentialRampToValueAtTime(500, now + 0.3);

  // Friendly soft coffee sip envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

export function playReactionSound() {
  if (audioControl.getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // High cheerful reaction chime pop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.setValueAtTime(800, now + 0.05);
  osc.frequency.setValueAtTime(1000, now + 0.1);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

export function playPostSound() {
  if (audioControl.getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Pleasant three-tone chime chord for wall post
  const tones = [329.63, 392.00, 523.25]; // C major triad components: E, G, C
  
  tones.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.55);
  });
}
