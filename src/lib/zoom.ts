/**
 * One camera, three scales.
 *
 * The stage holds two people. The constellation holds ninety-six. They are the
 * same project at two ends of a zoom and they were two pages, which meant the
 * relationship between them was a claim in a sentence rather than something you
 * could see. This is the move that makes it one thing.
 *
 * The critical property is that the levels are NESTED, not cross-faded. The two
 * cards are not a different scene that replaces the campus — they sit at the
 * position of one specific dot in it, at a scale where they are invisible specks
 * from the outside. Flying in does not swap anything. The camera simply gets
 * close enough for a speck to become two people, and closer again for one of
 * them to become a face and a handful of fragments.
 *
 * Distant geometry does fade as you descend, and that is worth being straight
 * about: ninety-six spheres at arm's length would fill the frame and occlude
 * everything behind them. But the fade is level-of-detail, not a transition —
 * every object stays exactly where it was, and the thing carrying you between
 * scales is the camera moving through real distance.
 *
 * The path eases to a stop at each waypoint rather than sweeping through, which
 * is the pacing this project has used everywhere: arrive, hold, then move. A
 * continuous sweep would read as a showreel. Stopping reads as looking at
 * something.
 *
 * `cameraAt` is pure and the continuity is asserted rather than asserted-at:
 * `npm run check` samples the path densely and confirms the camera never jumps,
 * which is the whole claim of the word "continuous".
 */

export type Vec3 = [number, number, number];
export type Shot = { eye: Vec3; target: Vec3 };

export type Level = 'world' | 'connection' | 'human';

/** Where the pair sits inside the campus. One dot, at campus scale. */
export const PAIR_AT: Vec3 = [0, 0, 0];

/** Waypoints, outermost first. */
export const WAYPOINTS: { level: Level; label: string; shot: Shot }[] = [
  {
    level: 'world',
    label: 'the campus',
    shot: { eye: [0, 26, 82], target: [0, 0, 0] },
  },
  {
    level: 'connection',
    label: 'two of them',
    shot: { eye: [0, 1.6, 8.2], target: [0, 0.2, 0] },
  },
  {
    level: 'human',
    label: 'one of them',
    shot: { eye: [-1.05, 0.28, 2.15], target: [-1.15, 0.1, 0] },
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Zero velocity at both ends — the camera arrives and settles rather than sweeping. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * The shot at t.
 *
 * Piecewise between waypoints, eased within each segment. Because the easing
 * has zero derivative at both ends of every segment, the joins are smooth in
 * velocity as well as position — a linear blend would arrive at each waypoint at
 * full speed and visibly kink.
 */
export function cameraAt(t: number): Shot {
  const clamped = Math.max(0, Math.min(1, t));
  const segments = WAYPOINTS.length - 1;
  const scaled = clamped * segments;

  const i = Math.min(segments - 1, Math.floor(scaled));
  const local = ease(scaled - i);

  const from = WAYPOINTS[i].shot;
  const to = WAYPOINTS[i + 1].shot;

  return {
    eye: mix(from.eye, to.eye, local),
    target: mix(from.target, to.target, local),
  };
}

/** How far the camera is from the pair. Drives every level-of-detail fade. */
export function distanceToPair(t: number): number {
  const { eye } = cameraAt(t);
  return Math.hypot(eye[0] - PAIR_AT[0], eye[1] - PAIR_AT[1], eye[2] - PAIR_AT[2]);
}

/**
 * Fade in over a distance band, out over another.
 *
 * Each level is legible across a range of camera distances and invisible
 * outside it, which is what lets three scales share one scene without any of
 * them being a separate view.
 */
export function bandOpacity(distance: number, inAt: number, fullAt: number, outAt: number): number {
  if (distance >= inAt) return 0;
  if (distance <= outAt) return 0;
  if (distance <= fullAt) {
    // Fading back out as the camera gets too close to make sense of it.
    return Math.max(0, Math.min(1, (distance - outAt) / Math.max(1e-6, fullAt - outAt)));
  }
  return Math.max(0, Math.min(1, (inAt - distance) / Math.max(1e-6, inAt - fullAt)));
}

/** Which level the camera is currently reading as. */
export function levelAt(t: number): Level {
  const segments = WAYPOINTS.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segments;
  return WAYPOINTS[Math.round(scaled)].level;
}
