import type { MatchPair, Scene } from './types';
import {
  NO_CONDITIONS,
  SEND_THRESHOLD,
  rankScenes,
  weightsFor,
  type Conditions,
  type Learned,
  type WeightKey,
} from './rankScenes';

/**
 * Restraint.
 *
 * The system already knows how to decline — `sendDecision` has returned `send:
 * false` since early on. What it has never been able to do is say what it is
 * waiting for, and "no" without "not yet, because X" is indistinguishable from
 * a system that is simply broken.
 *
 * So this asks the only question that makes an abstention useful: what is the
 * smallest true thing that would have to change for this to send?
 *
 * It is arithmetic, not a script. Utility is linear in the metrics, so for a
 * dimension weighted `w` and a shortfall `s`, the required movement is exactly
 * `s / |w|`. Whether that movement is *available* is the interesting part: a
 * metric already at 0.94 has almost no headroom left, and asking it to reach
 * 1.3 is not a plan. Effort is therefore measured against the headroom that
 * actually exists, and anything needing more than all of it is reported as
 * impossible rather than quietly listed as the cheapest option.
 *
 * The honest failure mode is a real output here. When no single dimension can
 * clear the bar alone, that is not a gap in the analysis — it means the week is
 * wrong in more than one way at once, and saying so is more useful than
 * naming a fix that would not work.
 */

/** Dimensions the system can wait out. The rest are facts about the pair. */
const MOVABLE: Record<WeightKey, string> = {
  contextFit: 'a room that suits them better than anything open this week',
  firstFifteenMinutesForecast: 'something for the first ten minutes to be about',
  attendanceLikelihood: 'a night where both of them would actually turn up',
  scheduleFit: 'an hour that is genuinely free for both, not just technically',
  noveltyValue: 'somewhere neither of them has already been twice',
  explorationValue: 'a reason to try it beyond it being available',
  pairSignal: 'two different people',
  travelFriction: 'somewhere they do not both have to cross campus for',
  socialPressure: 'fewer people they know in the room',
  uncertainty: 'another week of knowing them',
};

export type Lift = {
  key: WeightKey;
  /** What the metric reads now. */
  from: number;
  /** Where it would have to get to. */
  to: number;
  /** How far that is, in metric units. */
  delta: number;
  /** 0..1 of the available headroom. Above 1 it cannot be done at all. */
  effort: number;
  impossible: boolean;
  says: string;
};

export type Restraint = {
  pair: MatchPair;
  /** The best room available, which still was not good enough. */
  best: Scene | null;
  utility: number;
  shortfall: number;
  /** Every dimension, cheapest first. */
  lifts: Lift[];
  /** The cheapest thing that would actually work, or null when none would. */
  waitingFor: Lift | null;
  /** True when no single dimension can clear the bar by itself. */
  needsMoreThanOneThing: boolean;
};

/**
 * What this pair is waiting for.
 *
 * `pairSignal` is included in the returned list and can never be the answer —
 * it is constant within a pair, so "two different people" is the one lift the
 * system is not allowed to reach for. It stays visible because a list that
 * quietly omitted it would be hiding the fact that the people were never the
 * variable.
 */
export function restraintFor(
  pair: MatchPair,
  conditions: Conditions = NO_CONDITIONS,
): Restraint {
  const ranked = rankScenes(pair, conditions);
  const top = ranked[0] ?? null;
  const weights = weightsFor(conditions.learned as readonly Learned[] | undefined);

  if (!top) {
    return {
      pair,
      best: null,
      utility: 0,
      shortfall: SEND_THRESHOLD,
      lifts: [],
      waitingFor: null,
      needsMoreThanOneThing: true,
    };
  }

  const shortfall = SEND_THRESHOLD - top.utility;

  const lifts: Lift[] = (Object.keys(MOVABLE) as WeightKey[]).map((key) => {
    const w = weights[key];
    const from = top.scene.metrics[key];
    const need = shortfall / Math.abs(w);

    // A positive weight wants the metric higher; a negative weight wants it
    // lower. Headroom is whatever distance remains in that direction.
    const up = w > 0;
    const to = up ? from + need : from - need;
    const headroom = up ? 1 - from : from;

    return {
      key,
      from,
      to,
      delta: need,
      effort: headroom <= 0 ? Infinity : need / headroom,
      impossible: need > headroom + 1e-9,
      says: MOVABLE[key],
    };
  });

  lifts.sort((a, b) => a.effort - b.effort);

  const reachable = lifts.filter((l) => !l.impossible && l.key !== 'pairSignal');

  return {
    pair,
    best: top.scene,
    utility: top.utility,
    shortfall,
    lifts,
    waitingFor: reachable[0] ?? null,
    needsMoreThanOneThing: reachable.length === 0,
  };
}

/** Everything the system declined to send, worst shortfall last. */
export function heldBack(
  pairs: readonly MatchPair[],
  conditions: Conditions = NO_CONDITIONS,
): Restraint[] {
  return pairs
    .map((p) => restraintFor(p, conditions))
    .filter((r) => r.utility < SEND_THRESHOLD)
    .sort((a, b) => a.shortfall - b.shortfall);
}
