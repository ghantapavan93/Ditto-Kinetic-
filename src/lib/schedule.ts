import type { AvailabilitySlot, Person } from './types';

/**
 * Free is not the same as alive.
 *
 * The evidenced shape of the funnel is that both people fill in an availability
 * scheduler, a mutual slot is found, and then four out of five matched pairs
 * never actually meet. A scheduler that solves for *overlap* has answered a
 * different question from the one that decides whether an evening happens.
 *
 * Two hours where you are both technically unbooked at the end of a fourteen
 * hour day is not the same object as ninety minutes when you are both awake.
 * The distinction already exists in the data — every availability slot has
 * carried an `energy` since the beginning — and nothing has ever read it.
 *
 * Three rules, and each of them is a decision rather than a formula:
 *
 * Joint energy is the MINIMUM of the two, never the average. Averaging lets one
 * person's enthusiasm cover for the other's exhaustion, and produces a slot that
 * looks good on paper and has one person asleep in it. You cannot be more
 * present than the less present person.
 *
 * Length past about ninety minutes stops counting. A first meeting needs enough
 * room and then stops needing more, so a seven-hour window is not four times
 * better than a ninety-minute one — it is the same, at whatever energy it holds.
 * Without this, the longest window always wins, which is exactly the bug.
 *
 * And the drop day is a constraint, not a preference. Wednesday is a product
 * decision. Scoring it alongside everything else is the only way to see what it
 * costs, which is a thing worth being able to look at.
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** A first meeting needs about this long. More is not better. */
export const ENOUGH_MINUTES = 90;

/** Ditto drops on Wednesday. 3 = Wednesday. */
export const DROP_DAY = 3;

export type Window = {
  day: number;
  dayName: string;
  startMin: number;
  endMin: number;
  minutes: number;
  /** The less-present person governs. */
  jointEnergy: number;
  /** 0..1 — is there room for a first meeting? Caps at ENOUGH_MINUTES. */
  adequacy: number;
  /** jointEnergy × adequacy. */
  score: number;
};

function clockOf(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`;
}

export function label(w: Window): string {
  return `${w.dayName} ${clockOf(w.startMin)}–${clockOf(w.endMin)}`;
}

function overlap(a: AvailabilitySlot, b: AvailabilitySlot): Window | null {
  if (a.day !== b.day) return null;
  const startMin = Math.max(a.startMin, b.startMin);
  const endMin = Math.min(a.endMin, b.endMin);
  const minutes = endMin - startMin;
  if (minutes <= 0) return null;

  const jointEnergy = Math.min(a.energy, b.energy);
  const adequacy = Math.min(1, minutes / ENOUGH_MINUTES);

  return {
    day: a.day,
    dayName: DAYS[a.day],
    startMin,
    endMin,
    minutes,
    jointEnergy,
    adequacy,
    score: jointEnergy * adequacy,
  };
}

/** Every hour the two of them genuinely share, best first. */
export function mutualWindows(a: Person, b: Person): Window[] {
  const out: Window[] = [];
  for (const slotA of a.availability) {
    for (const slotB of b.availability) {
      const w = overlap(slotA, slotB);
      if (w) out.push(w);
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

export type ScheduleRead = {
  windows: Window[];
  /** What a scheduler solving for energy picks. */
  best: Window | null;
  /** What a scheduler solving for overlap picks. */
  longest: Window | null;
  /** True when those are different — i.e. when solving for overlap is wrong. */
  disagree: boolean;
  /** The best window that actually falls on drop day, if any. */
  onDropDay: Window | null;
  /**
   * What insisting on Wednesday costs, in score. Zero when the best window is
   * already on Wednesday, and null when Wednesday has no mutual hour at all —
   * which is a different and worse situation than a small cost.
   */
  dropDayCost: number | null;
};

export function readSchedule(a: Person, b: Person): ScheduleRead {
  const windows = mutualWindows(a, b);
  const best = windows[0] ?? null;

  const longest = [...windows].sort((x, y) => y.minutes - x.minutes)[0] ?? null;
  const onDropDay = windows.find((w) => w.day === DROP_DAY) ?? null;

  return {
    windows,
    best,
    longest,
    disagree: Boolean(best && longest && best !== longest),
    onDropDay,
    dropDayCost: best && onDropDay ? best.score - onDropDay.score : null,
  };
}
