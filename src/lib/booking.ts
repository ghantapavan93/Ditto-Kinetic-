import { NO_CONDITIONS, SEND_THRESHOLD, rankScenes, type Conditions } from '@/lib/rankScenes';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * The week, planned as one thing.
 *
 * Every other part of this engine scores a pair as though it were the only pair
 * in the world. That is fine for arguing about which room suits two people and
 * wrong the moment more than one couple exists, which is the moment the product
 * exists at all.
 *
 * Two defects came out of it, both found by reading rather than by running:
 *
 *   1. Priya and Theo are sent to the campus cafe at 3:40. Noor and Sam are
 *      sent to the campus cafe at 4:15. A date is an hour. Those two bookings
 *      overlap by twenty-five minutes, in a room with a finite number of
 *      tables, and nothing anywhere noticed because nothing anywhere was
 *      looking at both pairs at once.
 *
 *   2. When a room falls through, the replan re-sorts by score and never reads
 *      the clock. Losing an 8:32 PM walk hands back a 5:18 PM errand — three
 *      hours before the thing it is replacing. The score was right. The evening
 *      had already happened.
 *
 * Both are the same mistake at different scales: a plan is not a ranking. A
 * ranking is an opinion about rooms; a plan has to survive other people and the
 * passage of time.
 *
 * This file is deliberately small. It does not model real venues, hours,
 * staffing or contracts — that is an operations business and `roadmap.ts` says
 * plainly it is out of scope. What it does is refuse to hand out a plan that is
 * already impossible on the two counts above.
 */

/** How long a first meeting occupies a room. The same hour `exit.ts` supplies. */
export const SITTING_MINUTES = 60;

/**
 * How many pairs one room can hold in overlapping hours.
 *
 * A judgement, stated rather than buried, like `tripCost`'s ninety minutes. One
 * is the strict reading and the right default: two Ditto pairs on first dates at
 * adjacent tables is not a coincidence either of them would enjoy, and the whole
 * premise of the product is that somebody thought about the room.
 */
export const ROOM_CAPACITY = 1;

/** Minutes past midnight for a `H:MM AM/PM` clock string, or null if unparseable. */
export function clockToMinutes(clock: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(clock.trim());
  if (!m) return null;
  const hour = Number(m[1]) % 12;
  const minutes = hour * 60 + Number(m[2]) + (m[3].toUpperCase() === 'PM' ? 720 : 0);
  return minutes;
}

/** Render minutes-past-midnight back to a clock, wrapping properly at both ends. */
export function minutesToClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(wrapped % 60).padStart(2, '0')} ${suffix}`;
}

export type Booking = {
  pairId: string;
  scene: Scene;
  /** Minutes past midnight. */
  from: number;
  to: number;
  utility: number;
};

/** Two bookings clash when they want the same room at an overlapping hour. */
export function clashes(a: Booking, b: Booking): boolean {
  if (a.scene.location !== b.scene.location) return false;
  return a.from < b.to && b.from < a.to;
}

export type WeekPlan = {
  booked: Booking[];
  /** Pairs moved off their best room because somebody else was already in it. */
  displaced: { pairId: string; from: Scene; to: Scene | null; reason: string }[];
  /** Pairs the week could not place at all. */
  unplaced: string[];
};

/**
 * Plan a whole week without double-booking a room.
 *
 * Best-utility-first, which is the honest ordering: if two pairs want the same
 * table, the pair the engine is more confident about keeps it, and the other is
 * offered their next room rather than the same room at an awkward angle. A pair
 * with nowhere left to go is not squeezed in — it is left unplaced, which is the
 * same abstention every other surface here already honours.
 */
export function planWeek(pairs: MatchPair[], conditions: Conditions = NO_CONDITIONS): WeekPlan {
  const candidates = pairs
    .map((pair) => ({ pair, ranked: rankScenes(pair, conditions) }))
    .filter((c) => c.ranked.length > 0 && c.ranked[0].utility >= SEND_THRESHOLD)
    .sort((a, b) => b.ranked[0].utility - a.ranked[0].utility);

  const booked: Booking[] = [];
  const displaced: WeekPlan['displaced'] = [];
  const unplaced: string[] = [];

  for (const { pair, ranked } of candidates) {
    const first = ranked[0].scene;
    let placed = false;

    for (const option of ranked) {
      if (option.utility < SEND_THRESHOLD) break;

      const from = clockToMinutes(option.scene.time);
      if (from === null) continue;

      const booking: Booking = {
        pairId: pair.id,
        scene: option.scene,
        from,
        to: from + SITTING_MINUTES,
        utility: option.utility,
      };

      const taken = booked.filter((b) => clashes(b, booking)).length;
      if (taken >= ROOM_CAPACITY) continue;

      booked.push(booking);
      placed = true;
      if (option.scene.id !== first.id) {
        displaced.push({
          pairId: pair.id,
          from: first,
          to: option.scene,
          reason: `${first.location} was already taken at ${first.time}`,
        });
      }
      break;
    }

    if (!placed) {
      unplaced.push(pair.id);
      displaced.push({
        pairId: pair.id,
        from: first,
        to: null,
        reason: 'every room that cleared the bar was already occupied',
      });
    }
  }

  return { booked, displaced, unplaced };
}

/**
 * The hour a replan must not start before.
 *
 * The latest of every room lost so far, because each cancellation happens at
 * that room's hour and the most recent one is when you found out. Anything
 * earlier has already happened.
 *
 * This exists because the stage and the store were computing it separately and
 * disagreeing: the stage took the maximum across `excluded`, the store used
 * only the scene it had just removed. On a second venue break they produced
 * different floors, so the headline and the panel could once again describe two
 * different evenings -- which is the exact bug the clock was added to fix, back
 * one level. One function, so there is one answer.
 */
export function replanFloor(pair: MatchPair, excluded: readonly string[]): number | null {
  let latest = -1;
  for (const id of excluded) {
    const lost = pair.scenes.find((scene) => scene.id === id);
    const at = lost ? clockToMinutes(lost.time) : null;
    if (at !== null) latest = Math.max(latest, at);
  }
  return latest < 0 ? null : latest;
}

/**
 * Replan after a room falls through, without travelling backwards in time.
 *
 * The old behaviour excluded the dead scene and re-sorted by score, which is
 * correct about rooms and silent about clocks. If the theatre cancels at eight,
 * the second-best evening being a 5:18 PM errand is not a replan, it is a
 * message telling somebody to attend something that already finished.
 *
 * `notBefore` is the floor — normally the hour the lost plan was due to start,
 * because that is when you find out. Anything earlier is not a candidate at any
 * score, and if nothing survives, the answer is that there is no evening left
 * this week, which the engine is already willing to say.
 */
export function replanAfter(
  pair: MatchPair,
  lostSceneId: string,
  notBefore: number,
  conditions: Conditions = NO_CONDITIONS,
): { scene: Scene; utility: number } | null {
  const options = rankScenes(pair, {
    ...conditions,
    excluded: [...conditions.excluded, lostSceneId],
  });

  for (const option of options) {
    if (option.utility < SEND_THRESHOLD) break;
    const start = clockToMinutes(option.scene.time);
    if (start === null || start < notBefore) continue;
    return { scene: option.scene, utility: option.utility };
  }
  return null;
}
