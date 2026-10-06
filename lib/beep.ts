"use client";

import { useEffect } from "react";

// The exposure beep of a fluoroscopy machine: one steady tone for as long as anything on the page is firing.
// Made with Web Audio, so there is no sound file. Browsers keep it silent until the page has been clicked once
// (the projector's SoundHint asks for that click).
const PITCH = 1000; // Hz
const VOLUME = 0.07;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
const firing = new Set<symbol>();

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = PITCH;
    gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    // created before the first click it starts suspended; wake it on the next click or key
    const wake = () => ctx?.resume().catch(() => {});
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { ctx, gain: gain! };
}

function setFiring(id: symbol, on: boolean) {
  if (on) firing.add(id);
  else firing.delete(id);
  if (!ctx && !on) return;
  const { ctx: c, gain: g } = audio();
  // a few ms of ramp so the tone starts and stops without a click
  g.gain.setTargetAtTime(firing.size ? VOLUME : 0, c.currentTime, 0.008);
}

/** Beeps while `on`. Pass `on` false (or unmount) to stop. */
export function useBeep(on: boolean) {
  useEffect(() => {
    const id = Symbol("beep");
    setFiring(id, on);
    return () => setFiring(id, false);
  }, [on]);
}
