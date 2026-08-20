import { SURFACES } from '@/data/attentionInventory';
import { costOf } from '@/lib/attention';

/**
 * Autonomy levels.
 *
 * Borrowed in shape from self-driving, and the shape is the only thing worth
 * borrowing: a ladder from "you do everything" to "you are told where to be",
 * where each rung is defined by what the system takes over rather than by how
 * clever it is.
 *
 * The reason it belongs at the end of this project is that it is the same
 * argument as the attention budget seen from the other side. Every rung buys
 * back time by removing a decision, and every removed decision is one you no
 * longer get to make. Autonomy is not a feature, it is a trade, and nobody
 * prices the half being paid in.
 *
 * Three quantities, and keeping them apart is most of the work. The first
 * version collapsed the first two and produced a ladder where autonomy made
 * attention go *up*, which is obviously wrong and was worth being wrong about:
 *
 *   EXPLAINING  what it costs to understand a level, measured from the real
 *               inventory — the surfaces of this site that describe it.
 *   ATTENDING   what the level costs its user in a week. Modelled, not
 *               measured, because this project deliberately has no browse
 *               surface and there is nothing to count for level 0.
 *   SURRENDERED how many of the nine decisions the system has taken.
 *
 * They point in different directions, and the disagreement is the finding.
 *
 * The second thing worth being wrong about first: levels 4 and 5 transfer
 * exactly the same decisions. Every enumeration of them comes out identical,
 * which looked like a modelling bug and is not — it is the actual difference.
 * Level 5 does not decide anything level 4 has not already decided. What it
 * removes is the *asking*: the moment where a plan is put in front of you and
 * you say yes. So the last rung buys no additional autonomy at all. It only
 * withdraws consent, and it is strictly worse for it.
 *
 * One decision is never on the table at any level. Whether you actually go is
 * yours, permanently, and a system that took that one would not be arranging an
 * evening any more — it would be arranging a person.
 */

/** Everything standing between two strangers and a first date. */
export const DECISIONS = [
  'who is even worth considering',
  'which one of them',
  'whether to say anything',
  'what to open with',
  'whether to propose meeting',
  'which night',
  'which room',
  'how long it runs',
  'whether you actually go',
] as const;

export type Decision = (typeof DECISIONS)[number];

/** The one that never transfers, at any level. */
export const INALIENABLE: Decision = 'whether you actually go';

export type Level = {
  n: number;
  name: string;
  /** What the system has taken over by this rung. Cumulative. */
  takes: Decision[];
  /** Routes in this project that exist at this level. */
  surfaces: string[];
  says: string;
  /**
   * Whether a plan is put in front of you before it happens. This is the line
   * between levels 4 and 5, and the only thing separating them.
   */
  confirms: boolean;
  /** Roughly what this costs its user in a week, in seconds. Modelled. */
  weekly: number;
  /** True when nothing here was built, and the page has to say why. */
  unbuilt?: boolean;
};

export const LEVELS: Level[] = [
  {
    n: 0,
    name: 'you browse',
    takes: [],
    surfaces: [],
    says: 'a deck of faces and your own judgement. every dating app, and the thing ditto exists to refuse — so there is no surface for it here.',
    confirms: true,
    weekly: 1200,
  },
  {
    n: 1,
    name: 'it picks someone',
    takes: ['who is even worth considering', 'which one of them'],
    surfaces: ['/wednesday'],
    says: 'one person, once a week. the browsing is gone and everything after it is still yours.',
    confirms: true,
    weekly: 240,
  },
  {
    n: 2,
    name: 'and where',
    takes: ['who is even worth considering', 'which one of them', 'which room'],
    surfaces: ['/wednesday', '/'],
    says: 'the room stops being a default and becomes a decision, which is the whole argument of this site.',
    confirms: true,
    weekly: 150,
  },
  {
    n: 3,
    name: 'and when',
    takes: [
      'who is even worth considering',
      'which one of them',
      'which room',
      'which night',
    ],
    surfaces: ['/wednesday', '/', '/app'],
    says: 'availability reconciled between two people, on energy rather than on overlap.',
    confirms: true,
    weekly: 90,
  },
  {
    n: 4,
    name: 'and the whole introduction',
    takes: [
      'who is even worth considering',
      'which one of them',
      'which room',
      'which night',
      'whether to say anything',
      'what to open with',
      'whether to propose meeting',
      'how long it runs',
    ],
    surfaces: ['/wednesday', '/', '/app', '/compiler', '/ending'],
    says: 'you say one sentence about your life and an evening arrives with an ending already attached.',
    confirms: true,
    weekly: 45,
  },
  {
    n: 5,
    name: 'a standing instruction',
    takes: [
      'who is even worth considering',
      'which one of them',
      'which room',
      'which night',
      'whether to say anything',
      'what to open with',
      'whether to propose meeting',
      'how long it runs',
    ],
    surfaces: [],
    unbuilt: true,
    says: '"i want more interesting people in my life", and then nothing until thursday, 7:40, wear something warm. no confirmation, no moment where you agreed to this one.',
    confirms: false,
    weekly: 8,
  },
];

export type Rung = {
  level: Level;
  /** Measured: what this site charges to explain the level. */
  explaining: number;
  /** Modelled: what the level charges its user in a week. */
  attending: number;
  /** Decisions the system has taken. */
  surrendered: number;
  /** Decisions still yours. */
  yours: number;
  /** Weekly seconds saved against the rung below. */
  saved: number;
  /** Decisions handed over against the rung below. */
  given: number;
  /** Seconds a week bought per decision surrendered. Null when none changed. */
  boughtPerDecision: number | null;
};

/**
 * Price the ladder.
 *
 * Level 5 has no surfaces, so the one number here that cannot be measured is
 * what it costs to explain — there is nothing to look at. Calling that near
 * zero is honest, and it is exactly what makes the rung dangerous: on both
 * attention axes, level 5 is the obvious answer. It only loses when the third
 * quantity is priced.
 */
export function ladder(): Rung[] {
  const costFor = (paths: string[]) =>
    paths.reduce((total, path) => {
      const surface = SURFACES.find((s) => s.path === path);
      return total + (surface ? costOf(surface).seconds : 0);
    }, 0);

  return LEVELS.map((level, i) => {
    const previous = i > 0 ? LEVELS[i - 1] : null;
    const saved = previous ? previous.weekly - level.weekly : 0;
    const given = previous ? level.takes.length - previous.takes.length : 0;

    return {
      level,
      explaining: level.unbuilt ? 8 : costFor(level.surfaces),
      attending: level.weekly,
      surrendered: level.takes.length,
      yours: DECISIONS.length - level.takes.length,
      saved,
      given,
      boughtPerDecision: given > 0 ? saved / given : null,
    };
  });
}

/**
 * The last rung worth climbing.
 *
 * Defined by consent rather than by arithmetic, and that is the point. Every
 * rung up to four hands over decisions and still puts the result in front of
 * you before it happens. The fifth hands over nothing further — the decision
 * sets are identical — and removes the asking, so it is the first rung that
 * costs something without buying anything.
 */
export function lastWorthClimbing(rungs: Rung[]): Rung {
  const confirming = rungs.filter((r) => r.level.confirms);
  return confirming[confirming.length - 1];
}

/** True when a rung takes nothing new and only withdraws consent. */
export function isConsentOnly(rungs: Rung[], i: number): boolean {
  const previous = rungs[i - 1];
  if (!previous) return false;
  return rungs[i].given === 0 && previous.level.confirms && !rungs[i].level.confirms;
}
