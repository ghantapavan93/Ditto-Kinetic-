import { PAIRS } from '@/data/pairs';
import { WEEK_TWO } from '@/data/weekTwo';
import { HELD_BACK } from '@/data/heldBack';
import { SEND_THRESHOLD, rankScenes } from '@/lib/rankScenes';
import { SHAPES, read, requiredScaffolding, scaffolding, type Reading } from '@/lib/compiler';
import { coherence, fieldFor, gapFor } from '@/lib/gravity';
import { mutualWindows } from '@/lib/schedule';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * The possibility layer.
 *
 * One person says a sentence about their life, and the space around them fills
 * with possible human moments — not profiles, not a map of strangers, but
 * artifacts: a ticket stub with a time on it, a bookstore receipt, a table
 * light. Only when one of them clears the send bar does it approach, and only
 * when it arrives does anybody's photography develop.
 *
 * The rule that shapes every type in this file:
 *
 *   THE WORLD NEVER SHOWS YOU THE DATABASE.
 *
 * An unlocked candidate is an artifact and a time. It carries no name, no
 * face, no person reference — not hidden by the renderer, absent from the
 * object. `Candidate` cannot leak what it does not hold, and `npm run check`
 * serialises the whole candidate set and asserts that no person's name appears
 * anywhere in it. The lock is the only door to a person, and the lock is the
 * send bar.
 *
 * Everything physical is the machinery this site already asserts. Distance is
 * `gapFor` on the same utility the ranking computes. Instability is the same
 * incoherence that makes the gravity page wobble. Availability is the real
 * mutual-window arithmetic. Fit is the compiler's scaffolding requirement.
 * This file composes; it does not invent a second opinion.
 *
 * The population is two-tier on purpose, and honestly. Six pairs are fully
 * modelled — scenes, schedules, energies — and only they can become
 * candidates. The three held-back pairs are candidates too, and they can
 * never approach, because their evenings never clear the bar. They hover and
 * oscillate at a distance, which is not a decoration: it is what being held
 * back looks like from the possibility side.
 */

/** What a possibility looks like before it is anything. One per room kind. */
const ARTIFACT_FOR: Record<string, Candidate['artifact']> = {
  coffee: 'table',
  mission: 'receipt',
  gallery: 'photo',
  postshow: 'ticket',
  group: 'ticket',
  study: 'book',
  'harbour-walk': 'route',
  'lab-open-day': 'ticket',
  'record-fair': 'receipt',
  'late-canteen': 'table',
  'late-set': 'ticket',
  'exam-eve-coffee': 'table',
};

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** The three evenings the scrub moves between. Wednesday is the drop. */
export const SCRUB_DAYS = [3, 4, 5] as const;

export type Candidate = {
  /** Opaque. Deliberately not the pair id — see the claim on leakage. */
  id: string;
  artifact: 'ticket' | 'receipt' | 'photo' | 'table' | 'book' | 'route';
  /** `THU · 8:32 PM` — the room's own hour, on a day the two actually share. */
  when: string;
  /** Days this possibility genuinely exists on, from the mutual windows. */
  days: number[];
  /** Distance, from the same mapping the gravity page uses. */
  gap: number;
  /** 0..1 — how much of the field cancels. Drawn as oscillation. */
  jitter: number;
  /** True when the evening clears the send bar. Only these may approach. */
  clears: boolean;
  /** How well this answers the sentence. Lower is better. */
  misfit: number;
  /** Present on the scrubbed day. */
  availableToday: boolean;
};

/** The person exists only past the lock. */
export type LockedIntersection = {
  candidateId: string;
  pair: MatchPair;
  scene: Scene;
  utility: number;
  shape: { name: string; how: string };
  when: string;
};

export type World = {
  reading: Reading;
  day: (typeof SCRUB_DAYS)[number];
  candidates: Candidate[];
  /** The one possibility moving toward you, or null when nothing should. */
  locked: LockedIntersection | null;
};

/** Every fully-modelled pair. Only these twelve people exist at this fidelity. */
const POOL: MatchPair[] = [...PAIRS, WEEK_TWO, ...HELD_BACK];

/** Stable, non-identifying candidate ids, assigned by pool order. */
const CANDIDATE_ID = new Map<string, string>(POOL.map((p, i) => [p.id, `x${i + 1}`]));

/**
 * Open the world for one sentence on one evening.
 *
 * One candidate per pair: their best room for this sentence, chosen exactly
 * the way the compiler chooses — among rooms that clear the bar when any do,
 * by scaffolding fit; by the ranking otherwise. The lock is the best-fitting
 * candidate that clears the bar AND is available on the scrubbed day. Held-back
 * pairs produce candidates that can never lock, by construction.
 */
export function openWorld(sentence: string, day: (typeof SCRUB_DAYS)[number]): World {
  const reading = read(sentence);
  const need = requiredScaffolding(reading);

  const entries = POOL.map((pair) => {
    const ranked = rankScenes(pair);
    const clearing = ranked.filter((r) => r.utility >= SEND_THRESHOLD);

    // The same rule as the compiler: a preference reorders what already
    // clears; it never reaches below the bar to satisfy an ask.
    const eligible = clearing.length ? clearing : ranked;
    const best = [...eligible].sort((a, b) => {
      const da = Math.abs(scaffolding(a.scene) - need);
      const db = Math.abs(scaffolding(b.scene) - need);
      return Math.abs(da - db) < 0.02 ? b.utility - a.utility : da - db;
    })[0];

    const days = [...new Set(mutualWindows(pair.personA, pair.personB).map((w) => w.day))];
    const field = fieldFor(best.scene);

    const candidate: Candidate = {
      id: CANDIDATE_ID.get(pair.id)!,
      artifact: ARTIFACT_FOR[best.scene.id] ?? 'ticket',
      when: `${DAY_SHORT[days.includes(day) ? day : days[0] ?? day]} · ${best.scene.time}`,
      days,
      gap: gapFor(best.utility),
      jitter: 1 - coherence(field),
      clears: best.utility >= SEND_THRESHOLD,
      misfit: Math.abs(scaffolding(best.scene) - need),
      availableToday: days.includes(day),
    };

    return { pair, best, candidate };
  });

  const lockable = entries
    .filter((e) => e.candidate.clears && e.candidate.availableToday)
    .sort((a, b) =>
      Math.abs(a.candidate.misfit - b.candidate.misfit) < 0.02
        ? b.best.utility - a.best.utility
        : a.candidate.misfit - b.candidate.misfit,
    );

  const win = lockable[0] ?? null;

  return {
    reading,
    day,
    candidates: entries.map((e) => e.candidate),
    locked: win
      ? {
          candidateId: win.candidate.id,
          pair: win.pair,
          scene: win.best.scene,
          utility: win.best.utility,
          shape: SHAPES[win.best.scene.id] ?? { name: 'direct', how: '' },
          when: win.candidate.when,
        }
      : null,
  };
}
