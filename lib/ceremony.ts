"use client";

// Sound for the final podium, made with Web Audio (no sound files) and timed to its animation: a drumroll while the
// steps rise, a chime as each of 4th, 3rd and 2nd lands (higher each time), and a fanfare with a cymbal when 1st
// lands. Like the exposure beep, browsers keep it silent until the page has been clicked once.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    // one second of white noise, for the drum and the cymbal
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { c: ctx, n: noise! };
}

/** A short burst of filtered noise: one stroke of the snare, or (long and bright) the cymbal. */
function hiss(at: number, { length, volume, freq, type }: { length: number; volume: number; freq: number; type: BiquadFilterType }) {
  const { c, n } = audio();
  const src = c.createBufferSource();
  src.buffer = n;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(volume, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + length);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(at, Math.random() * 0.5);
  src.stop(at + length + 0.05);
}

/** One note: a soft bell (sine) or a brassy one (sawtooth through a low-pass). */
function note(at: number, hz: number, { length, volume, brass }: { length: number; volume: number; brass?: boolean }) {
  const { c } = audio();
  const osc = c.createOscillator();
  osc.type = brass ? "sawtooth" : "sine";
  osc.frequency.value = hz;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(volume, at + (brass ? 0.04 : 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  let out: AudioNode = osc;
  if (brass) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    out = osc.connect(lp);
  }
  out.connect(g).connect(c.destination);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/**
 * Plays the ceremony from now. `lands` are the seconds after now at which 4th, 3rd and 2nd land, then 1st.
 * Returns nothing; the sound is scheduled ahead on the audio clock, so it stays in time with the CSS animation.
 */
export function playCeremony(lands: { fourth: number; third: number; second: number; first: number }) {
  const { c } = audio();
  const t0 = c.currentTime + 0.05;
  // drumroll from the start until 1st lands, growing louder
  for (let t = 0; t < lands.first - 0.05; t += 0.055) {
    hiss(t0 + t, { length: 0.05, volume: 0.05 + 0.12 * (t / lands.first), freq: 1800, type: "bandpass" });
  }
  // a chime for each of 4th, 3rd, 2nd: C5, E5, G5
  note(t0 + lands.fourth, 523.25, { length: 0.6, volume: 0.18 });
  note(t0 + lands.third, 659.25, { length: 0.6, volume: 0.18 });
  note(t0 + lands.second, 783.99, { length: 0.7, volume: 0.2 });
  // 1st: cymbal and a fanfare (G4 C5 E5, then a held C major chord)
  const f = t0 + lands.first;
  hiss(f, { length: 2.2, volume: 0.22, freq: 6000, type: "highpass" });
  note(f, 392.0, { length: 0.22, volume: 0.12, brass: true });
  note(f + 0.18, 523.25, { length: 0.22, volume: 0.12, brass: true });
  note(f + 0.36, 659.25, { length: 0.22, volume: 0.12, brass: true });
  for (const hz of [523.25, 659.25, 783.99, 1046.5]) note(f + 0.56, hz, { length: 1.8, volume: 0.09, brass: true });
}
