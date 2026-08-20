'use client';

/**
 * Tiny synthesised UI sounds. No audio files, no autoplay, default muted.
 *
 * Every sound is a physical event — a dial detent, a magnetic snap, paper
 * moving, a receipt printing. Nothing here is a notification chime, because the
 * product never notifies; it just moves objects.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

type Voice = { freq: number; dur: number; type: OscillatorType; gain: number; sweepTo?: number };

const VOICES: Record<string, Voice> = {
  tick: { freq: 1750, dur: 0.028, type: 'square', gain: 0.035 },
  snap: { freq: 220, dur: 0.16, type: 'triangle', gain: 0.13, sweepTo: 92 },
  paper: { freq: 3200, dur: 0.06, type: 'sawtooth', gain: 0.02 },
  send: { freq: 660, dur: 0.12, type: 'sine', gain: 0.07, sweepTo: 990 },
  print: { freq: 140, dur: 0.05, type: 'square', gain: 0.025 },
};

export function play(name: keyof typeof VOICES, enabled: boolean) {
  if (!enabled) return;
  const audio = context();
  if (!audio) return;

  const voice = VOICES[name];
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = voice.type;
  osc.frequency.setValueAtTime(voice.freq, audio.currentTime);
  if (voice.sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(voice.sweepTo, audio.currentTime + voice.dur);
  }

  gain.gain.setValueAtTime(voice.gain, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + voice.dur);

  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + voice.dur + 0.02);
}
