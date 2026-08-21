import type { MatchPair, RankedScene, Scene, SceneEvaluation } from './types';
import { scheduleFitFor } from '@/lib/schedule';

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

/**
 * The floor under every room, which is not a weight.
 *
 * `venueSafety` was authored on all twenty-four scenes and then never read: not
 * in WEIGHTS, not in a gate, not on screen. Four separate reviewers found it
 * independently and all reached the same verdict, which is the correct one — a
 * model that appears to price safety and does not is strictly worse than one
 * that never mentioned it. The type said eleven dimensions. The utility
 * function had ten. The missing one was the only dimension a product that sends
 * students to meet strangers is not allowed to get wrong.
 *
 * The fix is deliberately NOT another weight. A weight is an exchange rate, and
 * saying safety is tradeable against novelty at some rate is a worse claim than
 * forgetting it. This is a gate: below the floor a room is not ranked at all,
 * at any score, for any pair.
 *
 * On the number: it is a judgement, like the ninety minutes in `tripCost`, and
 * it is stated rather than buried. Every room in this project scores between
 * 0.80 and 0.95, so **this floor currently excludes nothing**. That is not a
 * reason to leave it out. The failure it prevents — a room nobody checked
 * winning on charm — is expensive, the guard is free, and it is asserted
 * against a synthetic below-floor room so it cannot rot into decoration.
 *
 * It is also the honest limit of this layer: a number in a data file is not a
 * safety assessment. Deciding what makes a room safe needs domain expertise
 * this project does not have, which `roadmap.ts` says out loud. What the gate
 * buys is that the answer has somewhere to go when somebody who does have it
 * turns up.
 */

/**
 * Every numeric field the scorer declares about a scene.
 *
 * The single source of truth for "what this model looks at", so that claim 34
 * can check each one is either weighted or gated. `venueSafety` sat outside
 * both for months precisely because no list like this existed to check against.
 */
export const SCORED_FIELDS = [
  'pairSignal',
  'contextFit',
  'firstFifteenMinutesForecast',
  'scheduleFit',
  'travelFriction',
  'venueSafety',
  'attendanceLikelihood',
  'socialPressure',
  'noveltyValue',
  'explorationValue',
  'uncertainty',
] as const;

export const SAFETY_FLOOR = 0.75;

/** True when a room is below the floor and may not be ranked at any score. */
export function belowSafetyFloor(metrics: SceneEvaluation): boolean {
  return metrics.venueSafety < SAFETY_FLOOR;
}


/**
 * A hypothesis the system has adopted from feedback.
 *
 * This is the only mechanism by which last week can change this week, and it is
 * deliberately narrow: a learned hypothesis may re-weight an existing term. It
 * may not add a term, invent a dimension, or touch the data. One date should be
 * able to change how much something counts — never what the system is looking
 * at.
 */
export type Learned = 'pressure-over-extroversion';

export const LEARNED_LABEL: Record<Learned, string> = {
  'pressure-over-extroversion': 'unstructured pressure may matter more than extroversion',
};

/**
 * Weights, after whatever the system has learned.
 *
 * The adjustment is modest on purpose. Doubling a weight off a single evening
 * would be the behaviour of a system that believes one data point; raising the
 * cost of social pressure from 0.10 to 0.16 is a system that has *noticed*
 * something and is willing to act slightly differently while it finds out.
 */
export function weightsFor(learned: readonly Learned[] = []): Record<WeightKey, number> {
  const w: Record<WeightKey, number> = { ...WEIGHTS };
  if (learned.includes('pressure-over-extroversion')) {
    w.socialPressure = -0.16;
  }
  return w;
}

/**
 * The send bar.
 *
 * A scene that scores below this is not sent, even if it is the best of the
 * six. This is the difference between a ranking and a decision: `sort()` always
 * returns a first element, but a system that reasons about whether an
 * introduction should happen at all has to be able to return nothing.
 *
 * It is set where it is on purpose. In a normal week it clears the top of both
 * pairs comfortably, and it sits *above* COFFEE and STUDY BREAK for Maya ×
 * Jonah — meaning the system would rather send nothing than send those two.
 * For Priya × Theo exactly one opening clears it, which is the honest answer:
 * they have one good option this week, not six.
 */
export const SEND_THRESHOLD = 0.48;

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

/* ------------------------------------------------------------------------- */
/* Conditions — everything that can degrade a week                            */
/* ------------------------------------------------------------------------- */

export type Disruption = 'venue' | 'availability' | 'distance';

export type Conditions = {
  /**
   * `strained` is a whole-week condition: exam period, a double shift rota,
   * the week everyone is underwater. It does not change who these people are
   * or how well they fit — it changes whether *any* opening is worth spending
   * their one Wednesday on.
   */
  week: 'normal' | 'strained';
  /** Disruptions applied by the resilience test, cumulative. */
  disruptions: Disruption[];
  /** Scene ids removed from the candidate set entirely (the venue fell through). */
  excluded: string[];
  /** Hypotheses adopted from past feedback. Empty in week one. */
  learned?: readonly Learned[];
};

export const NO_CONDITIONS: Conditions = { week: 'normal', disruptions: [], excluded: [] };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const DISRUPTION_LABELS: Record<Disruption, { label: string; effect: string }> = {
  venue: { label: 'venue falls through', effect: 'removes this scene from the candidate set' },
  availability: { label: 'her shift moves', effect: 'schedule fit and attendance drop across every scene' },
  distance: { label: 'the walk doubles', effect: 'travel friction rises across every scene' },
};

/**
 * Applies conditions to a scene's metrics.
 *
 * Note what is deliberately *not* touched: `pairSignal` and `contextFit`. A bad
 * week does not make two people less compatible, and it does not make a gallery
 * a worse room for them. It makes them less able to show up and less able to
 * enjoy it if they do. Keeping the untouched fields untouched is what lets the
 * abstention be explained honestly — the pair was never the problem.
 */
export function applyConditions(
  metrics: SceneEvaluation,
  conditions: Conditions,
): SceneEvaluation {
  let m = { ...metrics };

  if (conditions.week === 'strained') {
    m = {
      ...m,
      scheduleFit: m.scheduleFit * 0.3,
      attendanceLikelihood: m.attendanceLikelihood * 0.4,
      // Tired people take longer to open up, and everything feels heavier.
      firstFifteenMinutesForecast: m.firstFifteenMinutesForecast * 0.65,
      socialPressure: clamp01(m.socialPressure * 1.35),
      uncertainty: clamp01(m.uncertainty + 0.25),
    };
  }

  if (conditions.disruptions.includes('availability')) {
    m = {
      ...m,
      scheduleFit: m.scheduleFit * 0.55,
      attendanceLikelihood: m.attendanceLikelihood * 0.62,
      uncertainty: clamp01(m.uncertainty + 0.1),
    };
  }

  if (conditions.disruptions.includes('distance')) {
    m = {
      ...m,
      travelFriction: clamp01(m.travelFriction + 0.35),
      attendanceLikelihood: m.attendanceLikelihood * 0.88,
    };
  }

  return m;
}

export function scoreScene(metrics: SceneEvaluation, learned: readonly Learned[] = []): number {
  const w = weightsFor(learned);
  return (Object.keys(w) as WeightKey[]).reduce((total, key) => total + w[key] * metrics[key], 0);
}

function contributionsFor(metrics: SceneEvaluation, learned: readonly Learned[] = []) {
  const w = weightsFor(learned);
  return (Object.keys(w) as WeightKey[]).map((key) => ({
    key,
    label: TERM_LABELS[key],
    value: metrics[key],
    weight: w[key],
    signed: w[key] * metrics[key],
  }));
}

/**
 * Ranks a pair's scenes, best first. Ties break on lower uncertainty — when
 * two openings look equally good, prefer the one we understand better.
 *
 * Excluded scenes are dropped, not scored to zero: a venue that fell through is
 * not a bad option, it is not an option.
 */
/**
 * The metrics the engine actually scores for a pair's scene.
 *
 * `scheduleFit` is derived from the two calendars rather than read from the
 * data file, so anything that scores a scene from `scene.metrics` directly is
 * scoring a slightly different evening from the one that ships. `exit.ts`,
 * `heldBack` and `doubleDate` each did, and each therefore produced a ranking
 * that disagreed with the ranking -- the same defect `lenses.ts` had.
 *
 * One function, so there is one answer.
 */
export function metricsFor(
  pair: MatchPair,
  scene: Scene,
  conditions: Conditions = NO_CONDITIONS,
): SceneEvaluation {
  return applyConditions(
    { ...scene.metrics, scheduleFit: scheduleFitFor(pair.personA, pair.personB, scene.time) },
    conditions,
  );
}

export function rankScenes(pair: MatchPair, conditions: Conditions = NO_CONDITIONS): RankedScene[] {
  return pair.scenes
    .filter((scene) => !conditions.excluded.includes(scene.id))
    .filter((scene) => !belowSafetyFloor(scene.metrics))
    .map((scene) => {
      /*
       * `scheduleFit` comes from the calendars, not from the data file.
       *
       * It was hand-authored on every scene and contradicted the availability
       * arrays it claimed to summarise -- 0.92 for an hour the two people are
       * not both free. Derived here so the one term that is a statement about
       * two real calendars is computed from those calendars.
       */
      const metrics = metricsFor(pair, scene, conditions);
      return {
        scene,
        utility: scoreScene(metrics, conditions.learned),
        contributions: contributionsFor(metrics, conditions.learned),
        rank: 0,
      };
    })
    .sort((a, b) => {
      const delta = b.utility - a.utility;
      if (Math.abs(delta) > 1e-9) return delta;
      return a.scene.metrics.uncertainty - b.scene.metrics.uncertainty;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function winningScene(pair: MatchPair, conditions: Conditions = NO_CONDITIONS): Scene | null {
  return rankScenes(pair, conditions)[0]?.scene ?? null;
}

/* ------------------------------------------------------------------------- */
/* Abstention                                                                 */
/* ------------------------------------------------------------------------- */

export type SendDecision =
  | { send: true; scene: Scene; utility: number; margin: number }
  | { send: false; best: RankedScene | null; shortfall: number; reason: string };

/**
 * Decides whether to send at all.
 *
 * Ditto delivers one match per Wednesday, so declining is not free — it costs
 * a person their whole week. That is exactly what makes it a real decision
 * rather than a UI state: the system has to believe the wait is worth more
 * than the best thing it can currently offer.
 */
export function sendDecision(
  pair: MatchPair,
  conditions: Conditions = NO_CONDITIONS,
): SendDecision {
  const ranked = rankScenes(pair, conditions);
  const best = ranked[0] ?? null;

  if (!best) {
    return {
      send: false,
      best: null,
      shortfall: SEND_THRESHOLD,
      reason: 'every candidate opening has been ruled out. there is nothing left to plan.',
    };
  }

  if (best.utility >= SEND_THRESHOLD) {
    return {
      send: true,
      scene: best.scene,
      utility: best.utility,
      margin: best.utility - SEND_THRESHOLD,
    };
  }

  return {
    send: false,
    best,
    shortfall: SEND_THRESHOLD - best.utility,
    reason: abstentionReason(best, conditions),
  };
}

/**
 * Why we are not sending — named against the specific field that failed, never
 * as a generic "no good matches this week".
 */
function abstentionReason(best: RankedScene, conditions: Conditions): string {
  const byKey = (k: WeightKey) => best.contributions.find((c) => c.key === k)?.value ?? 0;

  if (conditions.excluded.length > 0 && byKey('scheduleFit') < 0.35) {
    return 'the openings that survived the cancellations are the ones neither of them can reliably reach.';
  }
  if (byKey('attendanceLikelihood') < 0.42) {
    return 'the best remaining opening is one they would probably agree to and then not make.';
  }
  if (byKey('scheduleFit') < 0.35) {
    return 'both calendars have room this week. neither person does.';
  }
  if (byKey('uncertainty') > 0.6) {
    return 'we do not understand this week well enough to spend their one Wednesday on a guess.';
  }
  return 'nothing on offer this week is better than waiting for next one.';
}

/* ------------------------------------------------------------------------- */
/* Magnetism — the domain model, expressed as physics                         */
/* ------------------------------------------------------------------------- */

/**
 * 0..1 normalisation of a scene's utility against the best and worst *this pair*
 * can achieve. Drives the physical magnetism: how strongly the two polaroids are
 * pulled together, how clean the connection line is, how well artifacts settle.
 *
 * Normalising within the pair rather than globally is deliberate — the stage
 * should express "how good is this, for them" not "how good is this, absolutely".
 *
 * The one absolute rule layered on top: a scene below the send bar is capped, so
 * that even the best option in a bad week never physically settles. If the
 * system would not send it, the stage must not make it look inevitable.
 */
export function magnetismFor(
  pair: MatchPair,
  sceneId: string,
  conditions: Conditions = NO_CONDITIONS,
): number {
  const ranked = rankScenes(pair, conditions);
  if (ranked.length === 0) return 0;

  const best = ranked[0].utility;
  const worst = ranked[ranked.length - 1].utility;
  const found = ranked.find((r) => r.scene.id === sceneId);
  if (!found) return 0;

  const relative = best - worst < 1e-9 ? 0.5 : (found.utility - worst) / (best - worst);
  return found.utility < SEND_THRESHOLD ? relative * 0.4 : relative;
}

/**
 * Re-plans the venue while holding the pair fixed.
 *
 * The resilience invariant: when a venue falls through, a system that reasons
 * about `pair × context` only has to invalidate the context half. Rematching the
 * humans would be the wrong recovery — they were never the thing that failed.
 */
export function replanVenue(
  pair: MatchPair,
  brokenSceneId: string,
  conditions: Conditions = NO_CONDITIONS,
): RankedScene | null {
  const next: Conditions = {
    ...conditions,
    excluded: [...conditions.excluded, brokenSceneId],
  };
  return rankScenes(pair, next)[0] ?? null;
}
