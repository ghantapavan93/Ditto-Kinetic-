import { buildCampus, POPULATION, type Campus } from './campus';

/**
 * Social weather.
 *
 * Not a forecast. A reading of how much of a population is actually available
 * to each other on a given night — which is a real, changing property of a
 * campus and something no matching system appears to look at. Matching treats
 * the world as a database that happens to be queried on a Wednesday. It is a
 * world, and on some Wednesdays there is nothing in it.
 *
 * The rule that separates this from a mood board: every number is AGGREGATED
 * FROM THE POPULATION, never authored per day. Writing "Wednesday feels closed"
 * would be set dressing. Computing that sixty-one of ninety-six people are too
 * flat to be worth introducing to anybody, and that four of six rooms are shut,
 * is a reading — and it can come out differently than expected, which is the
 * only reason to compute it.
 *
 * Three pressures generate the week, and they are deliberately in tension:
 *
 *   RHYTHM      a campus is not equally alive on every night
 *   DISPOSITION people differ, and the same Tuesday is not the same Tuesday
 *   PRESSURE    midterms flatten everybody, unevenly and not on the weekend
 *
 * `openings` is deliberately named as a possibility rather than a match. These
 * are pairs who share an hour worth using; nothing here scores whether they
 * should meet, because the generated ninety are people with availability and no
 * scenes. Calling them matches would be claiming an evening had been evaluated
 * when only a calendar has.
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** A campus is not equally alive on every night, before anything else happens. */
const RHYTHM = [0.6, 0.46, 0.54, 0.72, 0.8, 0.86, 0.68];

/** Midterms flatten the week and leave the weekend mostly alone. */
const PRESSURE = [0.06, 0.34, 0.38, 0.42, 0.3, 0.12, 0.04];

/** Below this, somebody is present but not really available to anybody. */
export const ALIVE = 0.42;

/** Two people need at least this much joint energy for the hour to be worth using. */
export const WORTH_USING = 0.46;

function seeded(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Week = {
  campus: Campus;
  /** energy[person][day]. Zero means not out at all. */
  energy: number[][];
  /** Rooms open, by day. */
  venuesOpen: number[];
};

export const VENUES = 6;

/**
 * Generate the week.
 *
 * `strained` is the same idea as the stage's strained week, applied to ninety-six
 * people instead of two: midterm pressure roughly doubles and two more rooms
 * shut. The campus does not get uniformly worse — it gets lumpier, which is what
 * makes some nights still worth using.
 */
export function buildWeek(strained = false): Week {
  const campus = buildCampus();
  const rand = seeded(strained ? 776611 : 20260821);

  const energy: number[][] = [];
  for (let i = 0; i < POPULATION; i++) {
    const disposition = 0.42 + rand() * 0.5;
    const row: number[] = [];

    for (let d = 0; d < 7; d++) {
      const out = rand() < RHYTHM[d] * (0.72 + disposition * 0.4);
      if (!out) {
        row.push(0);
        continue;
      }
      const drag = PRESSURE[d] * (strained ? 1.9 : 1) * (0.55 + rand() * 0.9);
      row.push(Math.max(0, Math.min(1, disposition * RHYTHM[d] * 1.25 - drag)));
    }
    energy.push(row);
  }

  const venuesOpen = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const shut = Math.round((1 - RHYTHM[d]) * 3) + (strained ? 2 : 0);
    return Math.max(0, VENUES - shut);
  });

  return { campus, energy, venuesOpen };
}

export type DayRead = {
  day: number;
  name: string;
  /** Out of the house at all. */
  free: number;
  /** Out, and with enough left to be worth introducing to somebody. */
  alive: number;
  /** Pairs sharing an hour worth using. Not matches — nothing is scored here. */
  openings: number;
  venuesOpen: number;
  /** Mean energy across everybody who is out. 0..1. Drives the temperature. */
  warmth: number;
  /**
   * Of the people who came out, the share with anything left. This is the
   * number the headcount hides: a campus can be nearly full and nearly dead.
   */
  density: number;
  /** True when the night is worth using at all. */
  worthForcing: boolean;
};

/**
 * Read one night.
 *
 * `openings` walks every pair rather than sampling, because the whole claim is
 * that the number is aggregated rather than asserted, and a sampled number is
 * an estimate wearing a fact's clothes. Ninety-six people is 4,560 pairs, which
 * is nothing.
 */
export function readDay(week: Week, day: number): DayRead {
  const col = week.energy.map((row) => row[day]);

  const free = col.filter((e) => e > 0).length;
  const aliveList: number[] = [];
  for (let i = 0; i < col.length; i++) if (col[i] >= ALIVE) aliveList.push(i);

  let openings = 0;
  for (let a = 0; a < aliveList.length; a++) {
    for (let b = a + 1; b < aliveList.length; b++) {
      // The less present person governs, exactly as in the two-person scheduler.
      if (Math.min(col[aliveList[a]], col[aliveList[b]]) >= WORTH_USING) openings++;
    }
  }

  const outEnergies = col.filter((e) => e > 0);
  const warmth = outEnergies.length
    ? outEnergies.reduce((t, e) => t + e, 0) / outEnergies.length
    : 0;

  return {
    day,
    name: DAYS[day],
    free,
    alive: aliveList.length,
    density: free ? aliveList.length / free : 0,
    openings,
    venuesOpen: week.venuesOpen[day],
    warmth,
    // A night needs somewhere to go and somebody to go with. Either alone is
    // not an evening, and forcing one is how you spend a person's week badly.
    worthForcing: week.venuesOpen[day] > 0 && openings > 0,
  };
}

export type WeatherRead = {
  days: DayRead[];
  /** The night with the most people out. */
  fullest: DayRead;
  /** The night with the most pairs who could actually use an hour. */
  best: DayRead;
  /**
   * The night that most flatters a headcount and least deserves it — the widest
   * gap between how full the campus looks and how much of it is usable.
   */
  emptiestFullNight: DayRead;
  /** Nights the system should decline entirely. */
  closed: DayRead[];
  /** What the drop day actually looks like this week. */
  dropDay: DayRead;
};

export function readWeather(week: Week): WeatherRead {
  const days = [0, 1, 2, 3, 4, 5, 6].map((d) => readDay(week, d));

  const fullest = [...days].sort((a, b) => b.free - a.free)[0];
  const best = [...days].sort((a, b) => b.openings - a.openings)[0];

  // The interesting night is not the emptiest one. It is the one that looks
  // busy and is not — a headcount would call it a good night and be wrong by
  // more than an order of magnitude.
  const emptiestFullNight = [...days]
    .filter((d) => d.free >= fullest.free * 0.6)
    .sort((a, b) => a.density - b.density)[0];

  return {
    days,
    fullest,
    best,
    emptiestFullNight,
    closed: days.filter((d) => !d.worthForcing),
    dropDay: days[3],
  };
}
