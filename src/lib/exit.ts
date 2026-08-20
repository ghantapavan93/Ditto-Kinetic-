import type { MatchPair, Scene } from './types';
import { scoreScene } from './rankScenes';

/**
 * How it ends.
 *
 * Ditto picks the person, the time and the room. Nobody picks the ending, and
 * the ending is a large part of what somebody is actually agreeing to when they
 * say yes. An evening with no natural end is an open-ended commitment to a
 * stranger, and "I did not want to be stuck there" is a reason people decline a
 * first date that no matching system has a field for.
 *
 * It is already visible in this project's own copy, which is what makes it
 * worth reading rather than inventing. The mission is "ten minutes. go." The
 * post-show walk is "theatre exit → tacos" — the tacos are the end, and both
 * people can see it coming. The café is "two chairs, one table, nothing else
 * happening", which is a room you have to *perform* leaving.
 *
 * Two properties, because one is a trap. A room that ends itself but cannot
 * continue caps a good night at its own convenience; a room that continues but
 * never ends leaves the leaving to whoever is ruder. What you want is both —
 * an evening that closes on its own and extends without anybody having to
 * propose anything.
 *
 * This is deliberately a TWELFTH term, kept outside the scorer.
 * `rankScenes` is untouched, every existing claim still holds, and the addition
 * can be looked at rather than assumed. A model should have to earn a new
 * dimension, and the way it earns it is by the ranking changing — or by
 * visibly not changing, which is also an answer.
 */

/** Proposed weight for the twelfth term. Not in WEIGHTS, and not applied by default. */
export const EXIT_WEIGHT = 0.14;

/**
 * Below this, a room cannot end itself and the system has to end it for them.
 *
 * This threshold is the difference between the feature working and the feature
 * backfiring. Describing the absent ending of a café — "there is nowhere to go
 * from a table, and somebody has to ask" — is accurate and makes saying yes
 * *harder*, which is the opposite of the point. Where a room supplies no
 * ending, the honest move is not to report the gap. It is to fill it: state a
 * length, tell both people the same length, and take the responsibility for
 * ending the evening off the two of them.
 */
export const NEEDS_AN_ENDING = 0.3;

export const EXITS: Record<
  string,
  {
    endsItself: number;
    extends_: number;
    how: string;
    ifItGoesWell: string;
    /**
     * How long we would declare it, in minutes, when the room declares nothing.
     * The closing time is computed from the scene rather than written into the
     * copy — the first version said "at 4:40" and was correct for exactly one
     * of the two cafés on this site.
     */
    lengthMin?: number;
    /** Built from `lengthMin` and the scene's own start time. */
    supplied?: (endsAt: string) => string;
  }
> = {
  coffee: {
    endsItself: 0.12,
    extends_: 0.1,
    how: 'a cup is empty in twenty minutes. after that you are two people at a table deciding who says it first.',
    ifItGoesWell: 'there is nowhere to go from a table except somewhere else, and somebody has to ask.',
    lengthMin: 60,
    supplied: (endsAt) =>
      `so we have made it an hour, and told you both the same thing. at ${endsAt} it is over because we said so — neither of you has to be the one who ends it.`,
  },
  study: {
    endsItself: 0.18,
    extends_: 0.15,
    how: 'the steps do not close. neither of you will be the one to stand up.',
    ifItGoesWell: 'a bench does not become a second location.',
    lengthMin: 40,
    supplied: (endsAt) =>
      `so we have said forty minutes out loud to both of you — it closes at ${endsAt}. the clock is ours. staying past it is a decision you made, not one you failed to avoid.`,
  },
  group: {
    endsItself: 0.45,
    extends_: 0.5,
    how: 'you can leave a group without leaving a person, which is the one mercy of it.',
    ifItGoesWell: 'you peel off together, and that is its own small declaration.',
  },
  gallery: {
    endsItself: 0.68,
    extends_: 0.6,
    how: 'it closes at nine whether or not either of you is ready. nobody has to decide.',
    ifItGoesWell: 'the street outside is the second half, if you want it.',
  },
  mission: {
    endsItself: 0.72,
    extends_: 0.7,
    how: 'ten minutes was the deal. the deal ending is not a rejection.',
    ifItGoesWell: 'you have an object now. an object is a reason to go somewhere else.',
  },
  postshow: {
    endsItself: 0.9,
    extends_: 0.85,
    how: 'the tacos are the end. you finish them and you are already outside and already walking.',
    ifItGoesWell: 'the walk simply keeps going. nobody proposes anything.',
  },
};

export type ExitRead = {
  scene: Scene;
  endsItself: number;
  extends_: number;
  /** The mean of the two. A good exit closes AND continues. */
  quality: number;
  how: string;
  ifItGoesWell: string;
  /** The ending we provide, when the room provides none. */
  supplied: string | null;
  /** True when the room cannot end itself and we have to. */
  needsAnEnding: boolean;
  /** Utility as the scorer has it today. */
  base: number;
  /** Utility with the twelfth term added. */
  withExit: number;
  /**
   * How far the scorer's existing view of this room sits from its exit
   * quality. Large values are the interesting ones — they are where the eleven
   * dimensions are not already pricing the ending in by accident.
   */
  blindSpot: number;
};

/**
 * Read every room twice: as the scorer has it, and with the ending priced in.
 *
 * `blindSpot` is the number worth looking at. Exit quality correlates with
 * `contextFit` — a room that hands two people something to do also tends to
 * hand them a way out — so much of the ending is already being captured
 * indirectly. Where that correlation breaks is where the model is genuinely
 * missing something rather than merely not naming it.
 */
/** "3:40 PM" plus N minutes, back in the same shape. */
function endingClock(start: string, addMin: number): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(start.trim());
  if (!m) return start;

  const hour12 = Number(m[1]) % 12;
  const base = hour12 * 60 + Number(m[2]) + (m[3].toUpperCase() === 'PM' ? 720 : 0);
  const end = (base + addMin) % 1440;

  const h = Math.floor(end / 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const shown = h % 12 === 0 ? 12 : h % 12;
  return `${shown}:${String(end % 60).padStart(2, '0')} ${suffix}`;
}

export function readExits(pair: MatchPair): ExitRead[] {
  return pair.scenes
    .map((scene) => {
      const e = EXITS[scene.id];
      const quality = (e.endsItself + e.extends_) / 2;
      const base = scoreScene(scene.metrics);

      return {
        scene,
        endsItself: e.endsItself,
        extends_: e.extends_,
        quality,
        how: e.how,
        ifItGoesWell: e.ifItGoesWell,
        supplied: e.supplied
          ? e.supplied(endingClock(scene.time, e.lengthMin ?? 60))
          : null,
        needsAnEnding: e.endsItself < NEEDS_AN_ENDING,
        base,
        withExit: base + EXIT_WEIGHT * quality,
        blindSpot: Math.abs(quality - scene.metrics.contextFit),
      };
    })
    .sort((a, b) => b.withExit - a.withExit);
}

export type ExitVerdict = {
  reads: ExitRead[];
  /** The ranking as it stands. */
  before: string[];
  /** The ranking once the ending counts. */
  after: string[];
  /** True when adding the term actually reorders anything. */
  reorders: boolean;
  /** The room the eleven dimensions understand least well. */
  worstBlindSpot: ExitRead | null;
  /** The room you have to perform leaving. */
  hardestToLeave: ExitRead | null;
};

export function exitVerdict(pair: MatchPair): ExitVerdict {
  const reads = readExits(pair);

  const before = [...reads].sort((a, b) => b.base - a.base).map((r) => r.scene.id);
  const after = reads.map((r) => r.scene.id);

  return {
    reads,
    before,
    after,
    reorders: before.join() !== after.join(),
    worstBlindSpot: [...reads].sort((a, b) => b.blindSpot - a.blindSpot)[0] ?? null,
    hardestToLeave: [...reads].sort((a, b) => a.endsItself - b.endsItself)[0] ?? null,
  };
}
