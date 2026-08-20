import type { MatchPair, Person } from './types';
import { SEND_THRESHOLD, rankScenes } from './rankScenes';

/**
 * Your odds, and what a guarantee would cost somebody else.
 *
 * The observed onboarding ends on a slot machine: a computed personal
 * probability — "you have a 70% chance of matching on drop day" — followed by
 * "invite a friend for a guaranteed match", placed twenty-four steps in and
 * before any payoff. It is the sharpest mechanic in the funnel and the number
 * is the whole trick.
 *
 * The number is not the problem. A personal, computed probability is genuinely
 * more honest than a progress bar, and showing it is the right instinct. Two
 * things done to it are the problem, and both are fixable without giving up the
 * mechanic:
 *
 * FIRST, the number arrives undecomposed. "70%" with no account of what made it
 * seventy cannot be acted on, only reacted to — which is what makes it feel like
 * a slot machine rather than a readout. Everything here is decomposed into
 * contributions that sum to the whole, so the figure can be argued with.
 *
 * SECOND, and this is the real objection: the offer is *certainty*, and
 * certainty is not the platform's to sell. One match per person per Wednesday
 * is a closed system. A guaranteed match for you is not generosity toward you;
 * it is a match somebody else receives whether or not it clears their bar. The
 * guarantee is funded by another person's evening, and they were not asked.
 *
 * So odds here are capped below one, permanently, for the same reason profile
 * confidence is capped: the honest ceiling on a claim about another human being
 * is never certainty. `guaranteeCost` computes who would actually pay.
 */

/**
 * Nobody is ever guaranteed a match. The cap is not a tuning constant — it is
 * the claim, and raising it to 1 would mean promising somebody else's week.
 */
export const ODDS_CEILING = 0.86;

/** A week has this many plausible social hours. Used to normalise, not to judge. */
const WEEKLY_HOURS = 40;

export type Factor = {
  key: string;
  label: string;
  /** What this contributes to the odds, in points. Signed. */
  points: number;
  /** Said in the second person, because it is about you. */
  says: string;
  /**
   * The same factor phrased as something a person could actually go and do.
   * A label is a noun and a move is a verb, and "the cheapest thing you could
   * do is how well we know you" is not a sentence anybody can act on.
   */
  asMove: string;
  /** True when you can actually change this. */
  actionable: boolean;
};

export type Odds = {
  value: number;
  factors: Factor[];
  /** The cheapest real thing you could do. Never "invite a friend". */
  bestMove: Factor | null;
};

/**
 * Compute a personal probability from things that are actually true.
 *
 * Every input is read off data that already exists — the hours a person
 * offered, how many separate days they span, and how many rooms clear the send
 * bar for them. Nothing is invented to make the number move, which is the
 * difference between a readout and a slot machine.
 *
 * Spread is weighted above raw hours on purpose: three evenings of two hours
 * beat one evening of six, because a match needs to intersect somebody *else's*
 * week, and one long block is a single chance to do it.
 */
export function oddsFor(person: Person, pair: MatchPair, knownConfidence: number): Odds {
  const minutes = person.availability.reduce((t, s) => t + (s.endMin - s.startMin), 0);
  const hours = minutes / 60;
  const days = new Set(person.availability.map((s) => s.day)).size;

  const sendable = rankScenes(pair).filter((r) => r.utility >= SEND_THRESHOLD).length;
  const rooms = pair.scenes.length;

  const factors: Factor[] = [
    {
      key: 'spread',
      label: 'days you offered',
      points: Math.min(0.3, days * 0.1),
      says: `${days} separate ${days === 1 ? 'day' : 'days'} — spread beats length, because it has to intersect someone else's week`,
      asMove: 'offer one more day',
      actionable: true,
    },
    {
      key: 'hours',
      label: 'hours you offered',
      points: Math.min(0.22, (hours / WEEKLY_HOURS) * 0.5),
      says: `${Math.round(hours)} hours in total`,
      asMove: 'open up another couple of hours',
      actionable: true,
    },
    {
      key: 'known',
      label: 'how well we know you',
      points: knownConfidence * 0.26,
      says:
        knownConfidence < 0.5
          ? 'thin — we have very little to match on yet, and we will not pretend otherwise'
          : 'enough to act on, and still not much',
      asMove: 'answer one more question',
      actionable: true,
    },
    {
      key: 'rooms',
      label: 'rooms that would work',
      points: (sendable / rooms) * 0.2,
      says: `${sendable} of ${rooms} rooms clear the bar for you — this one is ours to fix, not yours`,
      asMove: 'nothing — this one is on us',
      actionable: false,
    },
  ];

  const raw = factors.reduce((t, f) => t + f.points, 0);
  const value = Math.min(ODDS_CEILING, raw);

  const bestMove =
    [...factors]
      .filter((f) => f.actionable)
      .sort((a, b) => a.points - b.points)[0] ?? null;

  return { value, factors, bestMove };
}

export type GuaranteeCost = {
  /** How far past the honest ceiling a guarantee sits. */
  gap: number;
  /** The pair whose evening would fund it. */
  fundedBy: MatchPair | null;
  /** What their evening scores. Below the bar, by construction. */
  theirUtility: number;
  /** How far below the bar they are. */
  theirShortfall: number;
};

/**
 * Who pays for a guarantee.
 *
 * One match per person per Wednesday makes this a closed system: a guaranteed
 * match cannot be manufactured, only reassigned. To guarantee you somebody, the
 * system has to send an evening that did not clear the bar — and the person on
 * the other end of it is real, did not ask, and gets a worse Wednesday so that
 * yours is certain.
 *
 * The candidates are drawn from the pairs actually held back this week, so this
 * is not a hypothetical: it names the specific evening that would be spent.
 */
export function guaranteeCost(odds: number, heldBackPairs: readonly MatchPair[]): GuaranteeCost {
  const candidates = heldBackPairs
    .map((p) => ({ pair: p, utility: rankScenes(p)[0]?.utility ?? 0 }))
    .filter((c) => c.utility < SEND_THRESHOLD)
    // The cheapest one to sacrifice is the closest to the bar, which is exactly
    // what makes it the easiest to justify and the most worth naming.
    .sort((a, b) => b.utility - a.utility);

  const chosen = candidates[0] ?? null;

  return {
    gap: 1 - odds,
    fundedBy: chosen?.pair ?? null,
    theirUtility: chosen?.utility ?? 0,
    theirShortfall: chosen ? SEND_THRESHOLD - chosen.utility : 0,
  };
}
