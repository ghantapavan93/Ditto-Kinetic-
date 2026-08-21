import { POPULATION, buildCampus, type Campus } from '@/lib/campus';
import { SEND_THRESHOLD } from '@/lib/rankScenes';

/**
 * The world: every campus at once.
 *
 * `/network` is one campus. This is the scale above it, and it exists because
 * it is the question Ditto actually faces — they grow school by school, and
 * the intuitive promise of that growth is that each new school makes every
 * existing student's matching better. More people, better odds.
 *
 * That promise is wrong, and this layer is here to say so with a number.
 *
 * A match is not a candidate. It is an evening, in a room, on a Wednesday, and
 * an evening has to be gettable-to. Adding a school forty minutes away adds
 * ninety-six people to the pool and almost nobody to the set of people you
 * could actually have dinner with this week. The pool grows linearly. The
 * reachable pool barely moves.
 *
 * What scale does buy is stranger and better, and it is the second half of the
 * argument: a candidate forty minutes away has to clear a much higher bar to
 * be worth the trip. So the cross-campus intersections that survive are, by
 * construction, exceptional — they had to be. Scale does not widen the funnel.
 * It raises the floor on what is allowed through it.
 *
 * And there is a third thing, which ties this back to the layer it was built
 * on. On one campus the missing edge — two people with no mutual anybody — is
 * rare and has to be hunted for. Across two campuses *every* edge is missing.
 * There is no friend to make the introduction, no party where it happens by
 * itself, no version of this that occurs without a system. The cross-campus
 * intersection is the purest form of the thing `/network` went looking for.
 *
 * On honesty: the per-candidate utilities here are a stated modelling
 * assumption, not a measurement — running the full eleven-term ranker over
 * every pair on eight campuses is not what this act is about. So the claim
 * suite does not assert the numbers. It asserts that the *conclusion* survives
 * re-rolling the assumption. Across 300 re-rolls spanning many seeds and a
 * range of distribution shapes, eight times the pool never once bought more
 * than four times the options, your own campus is never less than twice
 * over-represented among survivors, and at least three of the seven schools
 * you expanded to contribute nothing at all. An argument that only works at
 * one setting of a knob is not an argument, so the knob gets turned.
 */

/** Eight schools: yours, and the seven Ditto expanded to. */
export const SCHOOLS = 8;

/** Fictional. No real institution is named or implied anywhere in this project. */
const NAMES = [
  'your campus',
  'the college across the river',
  'the state school, north',
  'the art school downtown',
  'the tech institute',
  'the women’s college',
  'the ag school, two towns over',
  'the university in the next city',
] as const;

/** Minutes of travel, one way, from yours. Yours is zero by definition. */
const MINUTES = [0, 18, 26, 34, 41, 55, 78, 96] as const;

export type School = {
  id: string;
  name: string;
  minutes: number;
  /** Where it sits in the world scene. */
  at: [number, number, number];
  campus: Campus;
};

/**
 * What a trip costs an evening, in utility.
 *
 * Ninety minutes each way spends a whole point — which is to say it spends more
 * than the entire scale a scene is scored on, and no evening survives it. This
 * is the only number in the model that is a judgement rather than a draw, and
 * it is stated here rather than buried: an hour and a half on a bus, twice, is
 * not a first date. It is a commitment made before anybody has agreed to one.
 */
export function tripCost(minutes: number): number {
  return minutes / 90;
}

/** Deterministic 0..1 stream, same generator the campus uses. */
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

export type Candidate = {
  school: number;
  /** Opaque. The world never hands out a person. */
  id: string;
  /** The best evening these two could have, before travel is priced in. */
  utility: number;
  /** After travel. This is the one that decides. */
  net: number;
  clears: boolean;
};

export type World = {
  schools: School[];
  candidates: Candidate[];
  /** Everyone, everywhere. */
  pool: number;
  /** Everyone on yours. */
  local: number;
  /** Candidates whose evening still clears the bar once the trip is priced. */
  reachable: Candidate[];
  /** Of those, the share who are on your own campus. */
  localShare: number;
  /** Cross-campus survivors, best first. The rare ones. */
  worthTheTrip: Candidate[];
  /** Median utility of local survivors, for comparison against the trip-takers. */
  localMedian: number;
  /** The furthest school anybody survives from. */
  furthest: number;
  /**
   * What eight times the people actually bought.
   *
   * Survivors across the whole world, over survivors on your campus alone.
   * The headline of the act: this number is never anywhere near eight.
   */
  multiplier: number;
  /** Schools that contribute nobody at all. */
  deadSchools: number;
};

/**
 * Draw a pair utility.
 *
 * Most people are a mediocre evening with most people; a few are a very good
 * one. Cubing a uniform draw gives that shape — a long flat run of mediocrity
 * with a thin tail — and `shape` lets the claim suite re-roll the assumption to
 * check the conclusion is not an artefact of it.
 */
function drawUtility(rand: () => number, shape: number): number {
  return Math.pow(rand(), shape);
}

export function buildWorld(seed = 4152026, shape = 3): World {
  const rand = seeded(seed);

  const schools: School[] = [];
  for (let i = 0; i < SCHOOLS; i++) {
    // Yours at the origin; the rest on a ring, pushed out by travel time so
    // the scene's distances mean the same thing the model's minutes mean.
    const angle = (i / (SCHOOLS - 1)) * Math.PI * 2 + 0.6;
    const radius = MINUTES[i] * 0.115;
    schools.push({
      id: `school-${i}`,
      name: NAMES[i],
      minutes: MINUTES[i],
      at: i === 0 ? [0, 0, 0] : [Math.cos(angle) * radius, (i % 3) - 1, Math.sin(angle) * radius * 0.72],
      campus: buildCampus(20260820 + i * 977),
    });
  }

  const candidates: Candidate[] = [];
  for (let s = 0; s < SCHOOLS; s++) {
    const cost = tripCost(MINUTES[s]);
    for (let p = 0; p < POPULATION; p++) {
      const utility = drawUtility(rand, shape);
      const net = utility - cost;
      candidates.push({
        school: s,
        id: `w-${s}-${p}`,
        utility,
        net,
        clears: net >= SEND_THRESHOLD,
      });
    }
  }

  const reachable = candidates.filter((c) => c.clears);
  const localSurvivors = reachable.filter((c) => c.school === 0);
  const worthTheTrip = reachable
    .filter((c) => c.school !== 0)
    .sort((a, b) => b.utility - a.utility);

  const sortedLocal = [...localSurvivors].sort((a, b) => a.utility - b.utility);
  const localMedian = sortedLocal.length
    ? sortedLocal[Math.floor(sortedLocal.length / 2)].utility
    : 0;

  return {
    schools,
    candidates,
    pool: candidates.length,
    local: POPULATION,
    reachable,
    localShare: reachable.length ? localSurvivors.length / reachable.length : 1,
    worthTheTrip,
    localMedian,
    furthest: worthTheTrip.length ? Math.max(...worthTheTrip.map((c) => MINUTES[c.school])) : 0,
    multiplier: localSurvivors.length ? reachable.length / localSurvivors.length : 1,
    deadSchools: schools.filter((_, i) => i > 0 && !reachable.some((c) => c.school === i)).length,
  };
}

/**
 * The bar a candidate at this school has to clear to be worth going.
 *
 * This is the number the whole act turns on: it is not the same bar for
 * everybody, and the difference is entirely travel.
 */
export function barAt(minutes: number): number {
  return SEND_THRESHOLD + tripCost(minutes);
}

/** How many of a school's people could possibly clear its bar. */
export function survivorsAt(world: World, school: number): Candidate[] {
  return world.reachable.filter((c) => c.school === school);
}
