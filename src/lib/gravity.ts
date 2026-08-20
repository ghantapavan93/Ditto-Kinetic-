import type { MatchPair, Scene } from './types';
import {
  NO_CONDITIONS,
  SEND_THRESHOLD,
  applyConditions,
  scoreScene,
  weightsFor,
  type Conditions,
  type Learned,
  type WeightKey,
} from './rankScenes';

/**
 * Connection gravity.
 *
 * Every surface here so far has ended in a number, and a number is a poor
 * instrument for a decision made of ten competing pressures — it reports the
 * sum and destroys the composition. Two evenings scoring 0.47 can be completely
 * different objects: one where nothing much is happening in either direction,
 * and one where a strong pull and a strong shove are fighting each other to a
 * draw. A score cannot tell those apart. Anything with forces in it can.
 *
 * So the ten weighted terms become ten forces between two bodies. Positive
 * weights pull, negative weights push, and the magnitude of each is exactly
 * `|weight × metric|` — the same contribution the scorer already computes. No
 * new physics, no invented constants, nothing that is not already in the model.
 *
 * Two properties, and being clear about which is which matters:
 *
 * The RESTING GAP is a bijection with the utility, by construction. That is not
 * an emergent result and pretending otherwise would be dishonest — it is a
 * rescaling of the score onto an axis, so you can read the ranking off the
 * distance. What it buys is that you no longer have to be told the number.
 *
 * TENSION is the part a score genuinely cannot carry. It is the total force in
 * play regardless of direction, so it separates a quiet stalemate from a loud
 * one. High tension with a good net is a decision that could tip; high tension
 * with a bad net is an evening being actively held apart by something. Rendered,
 * it is the difference between two bodies sitting still and two bodies that will
 * not stop vibrating.
 */

/** How far apart two bodies sit when nothing is happening at all. */
export const MAX_GAP = 3.4;
/** How close they get when the evening is as good as this model goes. */
export const MIN_GAP = 0.62;

/** Utility range the gap is mapped across. Wider than any real scene. */
const FLOOR = 0.1;
const CEIL = 0.75;

export type Force = {
  key: WeightKey;
  label: string;
  /** Signed contribution — exactly the scorer's term. */
  signed: number;
  /** True when this term is closing the gap. */
  pulls: boolean;
  /** 0..1 relative to the strongest force in this scene. */
  share: number;
};

/**
 * The same ten terms, said as forces rather than as fields.
 *
 * `TERM_LABELS` already names these and is used everywhere a table is drawn.
 * These are deliberately different: a column heading wants "social pressure",
 * and a thing shoving two people apart wants "people watching". Same key, same
 * weight, different register — this surface has no numbers on it to explain
 * themselves.
 */
const LABELS: Record<WeightKey, string> = {
  contextFit: 'the room suits them',
  firstFifteenMinutesForecast: 'the first ten minutes',
  attendanceLikelihood: 'they would both turn up',
  scheduleFit: 'the hour works',
  noveltyValue: 'neither has done this',
  explorationValue: 'worth trying',
  pairSignal: 'the two of them',
  travelFriction: 'getting there',
  socialPressure: 'people watching',
  uncertainty: 'what we do not know',
};

export type Field = {
  scene: Scene;
  forces: Force[];
  /** Signed sum. Identical to the utility. */
  net: number;
  /** Total force in play, direction ignored. */
  tension: number;
  /** Where the two bodies come to rest. */
  gap: number;
  /** True when the evening clears the send bar and the bodies lock together. */
  locked: boolean;
};

/** Resting gap for a given utility. Monotonic and invertible, by construction. */
export function gapFor(utility: number): number {
  const t = Math.max(0, Math.min(1, (utility - FLOOR) / (CEIL - FLOOR)));
  return MAX_GAP - t * (MAX_GAP - MIN_GAP);
}

/**
 * Read one scene as a force field.
 *
 * Conditions are applied first, so breaking the week physically pushes the two
 * bodies apart rather than merely lowering a figure somewhere.
 */
export function fieldFor(scene: Scene, conditions: Conditions = NO_CONDITIONS): Field {
  const metrics = applyConditions(scene.metrics, conditions);
  const weights = weightsFor(conditions.learned as readonly Learned[] | undefined);

  const raw = (Object.keys(weights) as WeightKey[]).map((key) => ({
    key,
    label: LABELS[key],
    signed: weights[key] * metrics[key],
  }));

  const strongest = Math.max(...raw.map((f) => Math.abs(f.signed)), 1e-6);

  const forces: Force[] = raw
    .map((f) => ({
      ...f,
      pulls: f.signed > 0,
      share: Math.abs(f.signed) / strongest,
    }))
    .sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed));

  const net = scoreScene(metrics, conditions.learned as readonly Learned[] | undefined);
  const tension = raw.reduce((t, f) => t + Math.abs(f.signed), 0);

  return {
    scene,
    forces,
    net,
    tension,
    gap: gapFor(net),
    locked: net >= SEND_THRESHOLD,
  };
}

/** Every room as a field, closest first. */
export function fieldsFor(pair: MatchPair, conditions: Conditions = NO_CONDITIONS): Field[] {
  return pair.scenes
    .filter((s) => !conditions.excluded.includes(s.id))
    .map((s) => fieldFor(s, conditions))
    .sort((a, b) => a.gap - b.gap);
}

/**
 * How much a field disagrees with itself.
 *
 * Net over tension: near 1 means every force is pointing the same way and the
 * evening is simply good, near 0 means the forces are cancelling and the score
 * is a truce rather than a verdict. This is the number the physics exists to
 * show, because it is the one the ranking throws away.
 */
export function coherence(field: Field): number {
  return field.tension < 1e-9 ? 1 : Math.abs(field.net) / field.tension;
}
