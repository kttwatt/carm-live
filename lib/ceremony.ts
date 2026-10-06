"use client";

// Sound for the final podium, made with Web Audio (no sound files) and timed to its animation: a drumroll while the
// steps rise, a chime as each of 4th, 3rd and 2nd lands (higher each time), and a fanfare with a cymbal when 1st
// lands, then a short victory tune (8 bars: melody, bass, soft chords and a beat) ending on a held chord. Like the
// exposure beep, browsers keep it silent until the page has been clicked once.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
/** where the notes being scheduled go: the current ceremony's volume control, so it can be faded out */
let bus: GainNode | null = null;

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
  src.connect(filter).connect(g).connect(bus ?? c.destination);
  src.start(at, Math.random() * 0.5);
  src.stop(at + length + 0.05);
}

/** One note: a soft bell (sine), a brassy one (sawtooth through a low-pass), or a bass (triangle). */
function note(at: number, hz: number, { length, volume, brass, bass }: { length: number; volume: number; brass?: boolean; bass?: boolean }) {
  const { c } = audio();
  const osc = c.createOscillator();
  osc.type = brass ? "sawtooth" : bass ? "triangle" : "sine";
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
  out.connect(g).connect(bus ?? c.destination);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/** A kick drum: a low tone dropping fast. */
function kick(at: number) {
  const { c } = audio();
  const osc = c.createOscillator();
  osc.frequency.setValueAtTime(140, at);
  osc.frequency.exponentialRampToValueAtTime(45, at + 0.14);
  const g = c.createGain();
  g.gain.setValueAtTime(0.35, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
  osc.connect(g).connect(bus ?? c.destination);
  osc.start(at);
  osc.stop(at + 0.25);
}

// The victory tune, in C major: [note in Hz, beats]. Eight bars of four beats.
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
const MELODY: [number, number][] = [
  [G4, 0.5], [G4, 0.5], [G4, 0.5], [C5, 2.5],
  [E5, 1], [D5, 1], [C5, 1], [E5, 1],
  [G5, 1.5], [E5, 0.5], [C5, 1], [E5, 1],
  [D5, 4],
  [A4, 0.5], [A4, 0.5], [A4, 0.5], [D5, 2.5],
  [F5, 1], [E5, 1], [D5, 1], [F5, 1],
  [E5, 1], [G5, 1], [D5, 1], [B4, 1],
  [C5, 4],
];
// one chord a bar (C, Am, F, G, Dm, F, G, C), the bass playing its root an octave below
const CHORDS = [
  [C4, E4, G4], [A4 / 2, C4, E4], [F4 / 2, A4 / 2, C4], [G4 / 2, B4 / 2, D4],
  [D4 / 2, F4 / 2, A4 / 2], [F4 / 2, A4 / 2, C4], [G4 / 2, B4 / 2, D4], [C4, E4, G4],
];
const BEAT = 0.42; // s, about 143 beats a minute

/** The victory tune from `at`; returns when it ends. */
function tune(at: number) {
  let t = at;
  for (const [hz, beats] of MELODY) {
    note(t, hz, { length: beats * BEAT * 0.95, volume: 0.1, brass: true });
    t += beats * BEAT;
  }
  CHORDS.forEach((chord, bar) => {
    const b = at + bar * 4 * BEAT;
    for (const hz of chord) note(b, hz, { length: 4 * BEAT, volume: 0.035 });
    for (let beat = 0; beat < 4; beat++) {
      note(b + beat * BEAT, chord[0] / 2, { length: BEAT * 0.9, volume: 0.14, bass: true });
      if (beat % 2 === 0) kick(b + beat * BEAT);
      else hiss(b + beat * BEAT, { length: 0.12, volume: 0.12, freq: 2200, type: "bandpass" });
    }
  });
  return t;
}

/**
 * Plays the ceremony from now. `lands` are the seconds after now at which 4th, 3rd and 2nd land, then 1st.
 * The sound is scheduled ahead on the audio clock, so it stays in time with the CSS animation. Returns a function
 * that fades it out (for when the page changes before the music ends).
 */
export function playCeremony(lands: { fourth: number; third: number; second: number; first: number }) {
  const { c } = audio();
  const out = c.createGain();
  out.connect(c.destination);
  bus = out;
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
  // the victory tune, then a held C major chord and a last cymbal
  const end = tune(f + 2.2);
  hiss(end, { length: 2.5, volume: 0.18, freq: 6000, type: "highpass" });
  for (const hz of [C4, E4, G4, C5, E5]) note(end, hz, { length: 3, volume: 0.08, brass: true });
  kick(end);
  bus = null;
  return () => out.gain.setTargetAtTime(0, c.currentTime, 0.15);
}
