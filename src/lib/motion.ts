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

export type Spring = { x: number; v: number };

/**
 * Critically damped spring, integrated in place.
 *
 * `damp()` is exponential smoothing: it has no velocity, so it decelerates into
 * every target from the first frame and can never carry momentum. That is right
 * for something arriving at a resting position, and wrong for anything that
 * should feel like it has mass.
 *
 * This is the technique kage uses for pointer follow, and it is most of why
 * that site feels expensive: the parallax has weight, overshoots nothing, and
 * settles rather than tracking. Critically damped means the fastest approach
 * with no oscillation — `omega` is the angular frequency, so a higher number is
 * a stiffer, lighter object.
 *
 * `dt` is clamped because a single long frame (a tab regaining focus, a GC
 * pause) would otherwise integrate to a large velocity and throw the object
 * across the screen.
 */
export function spring(s: Spring, target: number, omega: number, dt: number): number {
  const step = Math.min(dt, 1 / 30);
  s.v += ((target - s.x) * omega * omega - 2 * omega * s.v) * step;
  s.x += s.v * step;
  return s.x;
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
