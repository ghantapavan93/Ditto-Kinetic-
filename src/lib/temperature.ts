import type { SceneMood } from './types';

/**
 * What a scene feels like, in one place.
 *
 * The DOM wash and the WebGL lighting used to decide this independently, which
 * meant the page and the stage could disagree about the temperature of a room.
 * Now both read from here, so "warm night" is a single fact with two renderings.
 *
 * The old palette was blue-shifted near-black throughout — every scene the same
 * cold technical dark. Dating does not happen in a server room. Each mood now
 * gets its own emotional temperature, and the two that should feel *wrong*
 * (rigid, depleted) are the only cold ones.
 */

export type Temperature = {
  /** Fog and clear colour — the colour of the air in this room. */
  air: string;
  /** Key light: the dominant source. */
  key: { color: string; intensity: number; at: [number, number, number] };
  /** Fill: how much the shadows lift. Low fill reads as late, high as public. */
  ambient: { color: string; intensity: number };
  /** Rim: the colour behind them. This is what sells "night". */
  rim: { color: string; intensity: number };
  fog: [number, number];
  /** CSS background for the DOM layer, matched to the same lights. */
  wash: string;
  /** One-word register, used to pick copy tone. */
  register: string;
};

const TEMPERATURES: Record<SceneMood, Temperature> = {
  /** Coffee: warm, but overhead and even. A lit room with nowhere to look. */
  rigid: {
    air: '#171008',
    key: { color: '#FFD5A0', intensity: 1.5, at: [0, 2.6, 3.4] },
    ambient: { color: '#C9A882', intensity: 0.62 },
    rim: { color: '#5A3A1E', intensity: 0.22 },
    fog: [9, 22],
    wash:
      'radial-gradient(80% 55% at 50% 12%, rgba(255,184,101,0.22), transparent 62%), radial-gradient(120% 90% at 50% 100%, rgba(90,58,30,0.28), transparent 70%)',
    register: 'lit and level',
  },

  /** Mini mission: warm, angled, something happening off to one side. */
  shared: {
    air: '#140F0A',
    key: { color: '#FFC98A', intensity: 1.7, at: [-3.2, 2.2, 3.4] },
    ambient: { color: '#8E7358', intensity: 0.44 },
    rim: { color: '#2B44FF', intensity: 0.5 },
    fog: [8, 20],
    wash:
      'radial-gradient(95% 70% at 18% 26%, rgba(255,201,138,0.20), transparent 58%), radial-gradient(85% 65% at 86% 82%, rgba(43,68,255,0.16), transparent 62%)',
    register: 'warm and busy',
  },

  /** Gallery: cool, clean, north light. Curiosity, not intimacy. */
  curious: {
    air: '#0E1014',
    key: { color: '#EDF1F6', intensity: 1.35, at: [2.4, 3.4, 3.8] },
    ambient: { color: '#A8B2C4', intensity: 0.6 },
    rim: { color: '#6E7BFF', intensity: 0.34 },
    fog: [9, 21],
    wash:
      'radial-gradient(100% 72% at 62% 16%, rgba(200,212,232,0.14), transparent 60%), radial-gradient(90% 70% at 20% 88%, rgba(110,123,255,0.12), transparent 64%)',
    register: 'cool and open',
  },

  /**
   * Post-show: the hero. Tungsten street light on one side, cobalt night sky on
   * the other, deep warm shadow between. This is the only scene that gets both
   * a warm key and a cold rim, which is exactly why it looks photographed.
   */
  inevitable: {
    air: '#120C0A',
    key: { color: '#FFA94E', intensity: 2.3, at: [-3.7, 1.5, 2.8] },
    ambient: { color: '#6B5B7A', intensity: 0.3 },
    rim: { color: '#2B44FF', intensity: 1.15 },
    fog: [7, 17],
    wash:
      'radial-gradient(85% 62% at 14% 34%, rgba(255,169,78,0.26), transparent 56%), radial-gradient(105% 80% at 88% 84%, rgba(43,68,255,0.26), transparent 62%), radial-gradient(140% 100% at 50% 108%, rgba(20,10,6,0.6), transparent 70%)',
    register: 'warm night',
  },

  /** Group landing: warm and pink and too many people. */
  busy: {
    air: '#160D12',
    key: { color: '#FFC0A8', intensity: 1.45, at: [3.4, 1.4, 3.4] },
    ambient: { color: '#A08290', intensity: 0.58 },
    rim: { color: '#FF2E88', intensity: 0.66 },
    fog: [8, 18],
    wash:
      'radial-gradient(85% 62% at 80% 24%, rgba(255,46,136,0.18), transparent 58%), radial-gradient(90% 70% at 16% 76%, rgba(255,192,168,0.14), transparent 62%)',
    register: 'crowded and warm',
  },

  /** Study break: cold, late, fluorescent. The one that should feel depleted. */
  depleted: {
    air: '#0A0C11',
    key: { color: '#9FB0C6', intensity: 0.68, at: [0.6, 3.2, 3.0] },
    ambient: { color: '#5E6878', intensity: 0.34 },
    rim: { color: '#1E2636', intensity: 0.1 },
    fog: [6, 15],
    wash:
      'radial-gradient(120% 85% at 50% 40%, rgba(120,136,160,0.10), transparent 62%), radial-gradient(140% 100% at 50% 110%, rgba(6,8,12,0.7), transparent 68%)',
    register: 'cold and late',
  },
};

export function temperatureFor(mood: SceneMood): Temperature {
  return TEMPERATURES[mood];
}

/**
 * Time of evening, as a warmth shift.
 *
 * The same room at 5:30 and at 9:15 is not the same room. `shift` runs -1
 * (earlier, cooler, more daylight left) to +1 (later, warmer key, colder
 * ambient, deeper shadow) and is applied on top of the scene's own
 * temperature — so changing the hour changes the light without changing which
 * room you are in.
 */
export function shiftedTemperature(base: Temperature, shift: number): Temperature {
  if (shift === 0) return base;

  const mixHex = (a: string, b: string, t: number) => {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (n: number, o: number) => (n >> o) & 255;
    const out = [16, 8, 0].map((o) =>
      Math.round(ch(pa, o) + (ch(pb, o) - ch(pa, o)) * t)
        .toString(16)
        .padStart(2, '0'),
    );
    return `#${out.join('')}`;
  };

  const later = Math.max(0, shift);
  const earlier = Math.max(0, -shift);

  return {
    ...base,
    key: {
      ...base.key,
      // Later runs hotter and lower; earlier runs paler and higher.
      color: mixHex(mixHex(base.key.color, '#FFF0DC', earlier * 0.55), '#FF8A3D', later * 0.5),
      intensity: base.key.intensity * (1 + earlier * 0.25 - later * 0.1),
      at: [base.key.at[0], base.key.at[1] + earlier * 0.9 - later * 0.5, base.key.at[2]],
    },
    ambient: {
      ...base.ambient,
      // Shadows go colder and deeper as the night goes on.
      color: mixHex(base.ambient.color, '#4A5570', later * 0.5),
      intensity: base.ambient.intensity * (1 + earlier * 0.45 - later * 0.35),
    },
    rim: { ...base.rim, intensity: base.rim.intensity * (1 + later * 0.35 - earlier * 0.4) },
    fog: [base.fog[0] - later * 1.2, base.fog[1] - later * 2.4],
  };
}
