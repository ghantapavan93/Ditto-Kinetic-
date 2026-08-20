/**
 * One motion vocabulary, shared by DOM (framer-motion) and WebGL (manual lerp).
 *
 * Keeping both layers on the same numbers is what stops the composition from
 * feeling like two products stacked on top of each other: when a polaroid
 * settles and a tape note lands, they are running the same curve.
 */

export const SPRING = {
  /** Physical objects coming to rest. Slightly underdamped. */
  settle: { type: 'spring' as const, stiffness: 180, damping: 24, mass: 0.9 },
  /** The selection snap. Tight and slightly overshooting. */
  snap: { type: 'spring' as const, stiffness: 420, damping: 26, mass: 0.7 },
  /** Text and sheets. No overshoot — copy should never bounce. */
  copy: { type: 'spring' as const, stiffness: 260, damping: 34, mass: 0.8 },
} as const;

export const DUR = {
  tick: 0.12,
  settle: 0.52,
  scene: 0.82,
  handoff: 1.4,
} as const;

export const EASE = {
  settle: [0.16, 1, 0.3, 1] as const,
  snap: [0.34, 1.56, 0.64, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
};

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth 0..1 remap of `v` between `edge0` and `edge1`. */
export function smoothstep(edge0: number, edge1: number, v: number): number {
  const t = clamp((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Deterministic pseudo-random in 0..1 from an integer seed. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
