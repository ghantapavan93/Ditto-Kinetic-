import type { MatchPair, Scene } from './types';
import {
  SEND_THRESHOLD,
  rankScenes,
  weightsFor,
  type Conditions,
  type Learned,
  type WeightKey,
} from './rankScenes';
import { NO_CONDITIONS } from './rankScenes';

/**
 * Three lenses on the same decision.
 *
 * The eleven dimensions are not eleven independent opinions — they group into
 * three questions that a person would actually ask in this order:
 *
 *   PERSON    should these two meet at all?
 *   MOMENT    is this the right room for them?
 *   REALITY   can it actually happen?
 *
 * This is a *partition*, not an invention. Every weighted term belongs to
 * exactly one lens, the three subsets are disjoint and complete, and summing all
 * three reproduces the utility exactly. So the lenses cannot say anything the
 * scorer does not already say — they only say which part of it is talking.
 *
 * Nothing here is a persona. No names, no personalities, no bubbles. Giving the
 * reasoning a cast would make the system the protagonist, and the entire point
 * of this project is that the two people are.
 *
 * The interesting result falls out rather than being staged: PERSON has no
 * opinion about rooms at all, because `pairSignal` is constant across a pair's
 * scenes. And MOMENT and REALITY genuinely disagree — MOMENT wants the post-show
 * walk, REALITY wants the café. That disagreement is the product thesis stated
 * one more way, and it was in the numbers before anybody wrote copy about it.
 */

export type LensKey = 'person' | 'moment' | 'reality';

export const LENSES: Record<
  LensKey,
  { label: string; question: string; terms: WeightKey[]; note: string }
> = {
  person: {
    label: 'person',
    question: 'should these two meet at all?',
    terms: ['pairSignal'],
    note: 'the only lens that is about them rather than about the evening',
  },
  moment: {
    label: 'moment',
    question: 'is this the right room?',
    terms: [
      'contextFit',
      'firstFifteenMinutesForecast',
      'socialPressure',
      'noveltyValue',
      'explorationValue',
    ],
    note: 'what the setting does to two people who have just sat down',
  },
  reality: {
    label: 'reality',
    question: 'can it actually happen?',
    terms: ['scheduleFit', 'attendanceLikelihood', 'travelFriction', 'uncertainty'],
    note: 'calendars, distance, and what we still do not know',
  },
};

export type LensReading = {
  key: LensKey;
  /** This lens's contribution to each scene's utility, best first. */
  ranked: { scene: Scene; score: number }[];
  /** The scene this lens would pick on its own, or null when it has no view. */
  prefers: Scene | null;
  /** True when this lens scores every scene identically and cannot choose. */
  abstains: boolean;
};

function lensScore(
  scene: Scene,
  key: LensKey,
  weights: Record<WeightKey, number>,
): number {
  return LENSES[key].terms.reduce((sum, term) => sum + weights[term] * scene.metrics[term], 0);
}

export function readLens(
  pair: MatchPair,
  key: LensKey,
  conditions: Conditions = NO_CONDITIONS,
): LensReading {
  const weights = weightsFor(conditions.learned as readonly Learned[] | undefined);

  const ranked = pair.scenes
    .filter((s) => !conditions.excluded.includes(s.id))
    .map((scene) => ({ scene, score: lensScore(scene, key, weights) }))
    .sort((a, b) => b.score - a.score);

  const spread = ranked.length
    ? Math.abs(ranked[0].score - ranked[ranked.length - 1].score)
    : 0;

  // A lens that scores everything the same has no view, and should say so
  // rather than pick arbitrarily. `pairSignal` is constant within a pair, so
  // PERSON always lands here — which is exactly the argument.
  const abstains = spread < 1e-9;

  return { key, ranked, prefers: abstains ? null : ranked[0]?.scene ?? null, abstains };
}

export function readAllLenses(
  pair: MatchPair,
  conditions: Conditions = NO_CONDITIONS,
): Record<LensKey, LensReading> {
  return {
    person: readLens(pair, 'person', conditions),
    moment: readLens(pair, 'moment', conditions),
    reality: readLens(pair, 'reality', conditions),
  };
}

/** True when the lenses that do have a view want different rooms. */
export function lensesDisagree(readings: Record<LensKey, LensReading>): boolean {
  const opinions = (Object.values(readings) as LensReading[])
    .filter((r) => !r.abstains && r.prefers)
    .map((r) => r.prefers!.id);
  return new Set(opinions).size > 1;
}

/**
 * Why a given scene lost.
 *
 * Answers "why not coffee?" out of the same arithmetic rather than a script:
 * which lens wanted it, which lens refused it, and by how much. If a lens
 * actually preferred the rejected scene, that gets said — a system that only
 * ever reports agreement with itself is not explaining anything.
 */
export function whyNot(
  pair: MatchPair,
  sceneId: string,
  conditions: Conditions = NO_CONDITIONS,
): {
  scene: Scene;
  championedBy: LensKey[];
  refusedBy: LensKey[];
  utility: number;
  winner: Scene | null;
  gap: number;
  belowBar: boolean;
} | null {
  const scene = pair.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;

  const readings = readAllLenses(pair, conditions);
  const ranked = rankScenes(pair, conditions);
  const here = ranked.find((r) => r.scene.id === sceneId);
  const winner = ranked[0]?.scene ?? null;

  const championedBy: LensKey[] = [];
  const refusedBy: LensKey[] = [];

  for (const key of Object.keys(LENSES) as LensKey[]) {
    const reading = readings[key];
    if (reading.abstains) continue;
    const position = reading.ranked.findIndex((r) => r.scene.id === sceneId);
    if (position === 0) championedBy.push(key);
    else if (position >= reading.ranked.length - 2) refusedBy.push(key);
  }

  return {
    scene,
    championedBy,
    refusedBy,
    utility: here?.utility ?? 0,
    winner,
    gap: (ranked[0]?.utility ?? 0) - (here?.utility ?? 0),
    belowBar: (here?.utility ?? 0) < SEND_THRESHOLD,
  };
}

/**
 * Which rooms the reader is allowed to argue with.
 *
 * This exists as a function rather than as a line inside the component because
 * the first version was wrong in a way nothing could catch. It offered the top
 * three non-winners, which reads as reasonable and silently excluded the single
 * objection anybody actually has: coffee ranks *fifth* for Maya × Jonah, so the
 * one room every dating app defaults to was the one room the interface would
 * not discuss. The engine was right and the surface was hiding it.
 *
 * So the set is chosen by argument rather than by rank: the runner-up, because
 * it is the closest the evening came to a different answer; whatever is on the
 * dial, because you should always be able to challenge what you are looking at;
 * and the café, always, because refusing it is the entire thesis.
 */
export function challengeSet(
  pair: MatchPair,
  conditions: Conditions = NO_CONDITIONS,
  currentSceneId?: string,
): Scene[] {
  const ranked = rankScenes(pair, conditions);
  const winner = ranked[0]?.scene.id;
  const seen = new Set<string>();

  return [ranked[1]?.scene.id, currentSceneId, 'coffee']
    .filter((id): id is string => Boolean(id) && id !== winner)
    .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
    .map((id) => ranked.find((r) => r.scene.id === id)?.scene)
    .filter((s): s is Scene => Boolean(s));
}
