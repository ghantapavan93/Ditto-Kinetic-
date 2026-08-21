import type { MatchPair, Scene } from './types';
import { SEND_THRESHOLD, metricsFor, scoreScene } from './rankScenes';

/**
 * Four people.
 *
 * The thesis so far has been that the right person can still get the wrong
 * first date. A double date is that argument with one more turn in it: the
 * right two people can still be the wrong four. Two pairs who each work
 * separately do not add up — they interact, and the interaction is most of what
 * decides the evening.
 *
 * Nothing here is a new opinion about people. Every cross-term is computed off
 * dimensions the scorer already has, and the two that matter pull in opposite
 * directions off the *same* weakness:
 *
 * COVER. A fourth and fifth person give you somewhere to look. The pair who
 * cannot carry a first ten minutes alone benefits most, so the benefit is
 * proportional to exactly how badly they need it.
 *
 * ECLIPSE. The pair who start talking faster take the evening. The pair who
 * were struggling do not get rescued, they get talked over — and the penalty
 * is proportional to the same weakness that made cover valuable.
 *
 * DILUTION. You get half the conversation. This is the term that makes the
 * model interesting rather than flattering: it scales with how good your
 * evening was going to be *on its own*, so the better the date you were about
 * to have, the more a double date costs you. Without it every pair gains in
 * every room and the model just says double dates are nice, which is not a
 * finding, it is a failure to model anything.
 *
 * THE SPLIT is what separates them. An evening that breaks into two
 * conversations keeps the cover from the first stretch and loses the eclipse,
 * because once you are walking twenty feet behind the other two you are simply
 * on a date. An evening that cannot split is a group interview with a
 * scoreboard.
 *
 * And whether it splits is a property of the room, not of the people — which is
 * the original thesis arriving one more time, from a direction it was not
 * aimed at.
 */

const COVER = 0.18;
const ECLIPSE = 0.22;
const DILUTE = 0.19;

/**
 * How readily a room breaks into two conversations.
 *
 * A property of the format and the furniture, so it is keyed by room and is
 * identical for every set of people in it — asserted, because the moment this
 * varies by pair it has stopped being about the room and started being a second
 * opinion about the humans.
 */
export const SPLITS: Record<string, { value: number; why: string }> = {
  coffee: {
    value: 0.08,
    why: 'four chairs around one table. there is no second conversation to have.',
  },
  study: {
    value: 0.12,
    why: 'one table again, and nobody can leave without it being a statement.',
  },
  gallery: {
    value: 0.78,
    why: 'people drift at different speeds in front of different things. it splits itself.',
  },
  postshow: {
    value: 0.85,
    why: 'four people walking become two people walking twice, inside a block.',
  },
  mission: {
    value: 0.55,
    why: 'a task with two halves splits. a task with one half does not.',
  },
  group: {
    value: 0.3,
    why: 'already a crowd, so the split is into the room rather than into pairs.',
  },
};

export type Side = {
  pair: MatchPair;
  /** What this evening was worth to them on their own. */
  solo: number;
  /** Somewhere to look, worth most to whoever needs it most. */
  cover: number;
  /** Being talked over by the pair who warmed up faster. */
  eclipse: number;
  /** Half the conversation. Costs most to whoever had most to lose. */
  dilution: number;
  /** What the evening is worth to them as one of four. */
  joint: number;
  /** joint - solo. Negative means the double date cost them. */
  delta: number;
};

export type DoubleDate = {
  scene: Scene;
  split: number;
  splitWhy: string;
  a: Side;
  b: Side;
  /** True only when neither pair is made worse off and both still clear the bar. */
  worthIt: boolean;
  /** The pair the evening was taken from, when there is one. */
  costTo: MatchPair | null;
  /** Sum of both deltas. Deliberately not the decision. */
  net: number;
};

function side(pair: MatchPair, scene: Scene, otherF15: number, split: number): Side {
  const solo = scoreScene(metricsFor(pair, scene));
  const f15 = scene.metrics.firstFifteenMinutesForecast;

  // Splitting keeps some of the cover — the first stretch still happened
  // together — and removes almost all of the eclipse.
  const cover = (1 - f15) * COVER * (1 - 0.45 * split);
  const eclipse = Math.max(0, otherF15 - f15) * ECLIPSE * (1 - split);

  // The evening you were going to have, halved — unless the room gives it back
  // by splitting. This is why a strong pairing loses from a double date and a
  // struggling one gains, and why splitting is the whole variable.
  const dilution = solo * DILUTE * (1 - split);

  const joint = solo + cover - eclipse - dilution;

  return { pair, solo, cover, eclipse, dilution, joint, delta: joint - solo };
}

/**
 * Score one room for two pairs at once.
 *
 * Both pairs must have a room with this id — they do, because the six rooms are
 * the same six rooms for everybody. The scene objects differ per pair, which is
 * the point: the same café is a different evening depending who is at it.
 */
export function doubleDate(
  pairA: MatchPair,
  pairB: MatchPair,
  sceneId: string,
): DoubleDate | null {
  const sceneA = pairA.scenes.find((s) => s.id === sceneId);
  const sceneB = pairB.scenes.find((s) => s.id === sceneId);
  if (!sceneA || !sceneB) return null;

  const { value: split, why: splitWhy } = SPLITS[sceneId] ?? { value: 0.3, why: 'unknown room.' };

  const a = side(
    pairA,
    sceneA,
    sceneB.metrics.firstFifteenMinutesForecast,
    split,
  );
  const b = side(
    pairB,
    sceneB,
    sceneA.metrics.firstFifteenMinutesForecast,
    split,
  );

  // Both have to be no worse off AND still sendable. A double date that lifts
  // one evening by taking another is not a better evening, it is a transfer.
  const worthIt =
    a.delta >= 0 && b.delta >= 0 && a.joint >= SEND_THRESHOLD && b.joint >= SEND_THRESHOLD;

  const costTo = a.delta < 0 && a.delta <= b.delta ? pairA : b.delta < 0 ? pairB : null;

  return {
    scene: sceneA,
    split,
    splitWhy,
    a,
    b,
    worthIt,
    costTo,
    net: a.delta + b.delta,
  };
}

/** Every room, best joint outcome first. */
export function rankDoubles(pairA: MatchPair, pairB: MatchPair): DoubleDate[] {
  return pairA.scenes
    .map((s) => doubleDate(pairA, pairB, s.id))
    .filter((d): d is DoubleDate => Boolean(d))
    .sort((x, y) => Math.min(y.a.joint, y.b.joint) - Math.min(x.a.joint, x.b.joint));
}
