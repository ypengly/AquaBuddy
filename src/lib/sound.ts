let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, gain = 0.05) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

/** Tiny synthesised sounds (no audio files needed). Call only after a user interaction. */
export function playSound(kind: 'drop' | 'success') {
  try {
    ctx = ctx ?? new AudioContext();
    if (kind === 'drop') {
      tone(660, 0, 0.12);
      tone(880, 0.08, 0.14);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25));
    }
  } catch {
    /* audio unavailable: ignore */
  }
}
