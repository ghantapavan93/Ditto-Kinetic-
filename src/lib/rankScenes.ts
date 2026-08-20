import type { MatchPair, RankedScene, Scene, SceneEvaluation } from './types';

/**
 * SYNTHETIC PROTOTYPE LOGIC — this is not Ditto's model.
 *
 * A deliberately boring, fully deterministic linear scoring function. No LLM
 * call, no randomness, no hidden state. Same input, same output, every time,
 * on every machine. That property is the point: it makes the decision view
 * *inspectable*, and it means the demo cannot fail because a network call did.
 *
 * The weights encode a position, and the position is arguable — which is why
 * the decision view shows the arithmetic instead of a confidence percentage.
 *
 * Three terms are costs and enter negatively. `uncertainty` is one of them:
 * the system is penalised for what it does not know, rather than allowed to
 * quietly round it off.
 */

export const WEIGHTS = {
  contextFit: 0.22,
  firstFifteenMinutesForecast: 0.18,
  attendanceLikelihood: 0.15,
  scheduleFit: 0.12,
  noveltyValue: 0.1,
  explorationValue: 0.08,
  pairSignal: 0.1,
  travelFriction: -0.12,
  socialPressure: -0.1,
  uncertainty: -0.15,
} as const;

export type WeightKey = keyof typeof WEIGHTS;

export const TERM_LABELS: Record<WeightKey, string> = {
  contextFit: 'context fit',
  firstFifteenMinutesForecast: 'first fifteen minutes',
  attendanceLikelihood: 'attendance likelihood',
  scheduleFit: 'schedule fit',
  noveltyValue: 'novelty',
  explorationValue: 'exploration',
  pairSignal: 'pair signal',
  travelFriction: 'travel friction',
  socialPressure: 'social pressure',
  uncertainty: 'uncertainty',
};

/** Terms that make a scene worse as they rise. Rendered differently. */
export const COST_TERMS: WeightKey[] = ['travelFriction', 'socialPressure', 'uncertainty'];

export function scoreScene(metrics: SceneEvaluation): number {
  return (Object.keys(WEIGHTS) as WeightKey[]).reduce(
    (total, key) => total + WEIGHTS[key] * metrics[key],
    0,
  );
}

function contributionsFor(metrics: SceneEvaluation) {
  return (Object.keys(WEIGHTS) as WeightKey[]).map((key) => ({
    key,
    label: TERM_LABELS[key],
    value: metrics[key],
    weight: WEIGHTS[key],
    signed: WEIGHTS[key] * metrics[key],
  }));
}

/**
 * Ranks a pair's scenes, best first. Ties break on lower uncertainty — when
 * two openings look equally good, prefer the one we understand better.
 */
export function rankScenes(pair: MatchPair): RankedScene[] {
  return pair.scenes
    .map((scene) => ({
      scene,
      utility: scoreScene(scene.metrics),
      contributions: contributionsFor(scene.metrics),
      rank: 0,
    }))
    .sort((a, b) => {
      const delta = b.utility - a.utility;
      if (Math.abs(delta) > 1e-9) return delta;
      return a.scene.metrics.uncertainty - b.scene.metrics.uncertainty;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function winningScene(pair: MatchPair): Scene {
  return rankScenes(pair)[0].scene;
}

/**
 * 0..1 normalisation of a scene's utility against the best and worst *this pair*
 * can achieve. Drives the physical magnetism: how strongly the two polaroids are
 * pulled together, how clean the connection line is, how well artifacts settle.
 *
 * Normalising within the pair rather than globally is deliberate — the stage
 * should express "how good is this, for them" not "how good is this, absolutely".
 */
export function magnetismFor(pair: MatchPair, sceneId: string): number {
  const ranked = rankScenes(pair);
  const best = ranked[0].utility;
  const worst = ranked[ranked.length - 1].utility;
  const found = ranked.find((r) => r.scene.id === sceneId);
  if (!found || best - worst < 1e-9) return 0.5;
  return (found.utility - worst) / (best - worst);
}

/**
 * Re-plans the venue while holding the pair fixed.
 *
 * The resilience demo: when a venue falls through, a system that reasons about
 * `pair × context` only has to invalidate the context half. Rematching the
 * humans would be the wrong recovery — they were never the thing that failed.
 */
export function replanVenue(pair: MatchPair, brokenSceneId: string): RankedScene | null {
  return rankScenes(pair).find((r) => r.scene.id !== brokenSceneId) ?? null;
}
