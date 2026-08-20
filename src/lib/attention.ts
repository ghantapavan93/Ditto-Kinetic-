/**
 * The attention budget.
 *
 * Every consumer product optimises for time spent. Ditto's stated purpose is
 * the opposite — get people off the app and into a room — which makes time
 * spent an inverted metric for them and, if you take it seriously, turns every
 * pixel into a cost rather than an achievement.
 *
 * Taking it seriously means being willing to point the instrument at yourself.
 * So the population measured here is this repository: fifteen surfaces, counted
 * from their own source, priced in seconds, and compared against what the real
 * product actually asks of somebody in a week.
 *
 * The result is not flattering and is not supposed to be. A site arguing that
 * interfaces should get out of the way costs orders of magnitude more attention
 * than the product it is arguing about. That is defensible — an argument is not
 * a product and is allowed to cost more — but it is only defensible if it is
 * said out loud with a number attached, which is what this file is for.
 *
 * Two rates, both assumptions, both stated rather than buried:
 *
 *   READING    220 words per minute, roughly average silent reading.
 *   DECIDING   1.4 seconds per control offered. A choice is not free even when
 *              it is declined, because it still has to be read and dismissed.
 *
 * Neither is measured and both are arguable. What is measured is the words and
 * the controls; the rates turn them into a currency.
 */

export const WORDS_PER_MINUTE = 220;
export const SECONDS_PER_DECISION = 1.4;

/**
 * What the shipping product asks for in a week.
 *
 * Read one text, decide, reply. Deliberately generous — this is the number the
 * rest of the page is measured against, so making it too small would rig the
 * comparison in the direction the page already wants to go.
 */
export const WEEKLY_BUDGET_SECONDS = 45;

export type Surface = {
  path: string;
  /**
   * `product` is a surface that could plausibly ship as part of the app.
   * `argument` is a surface that exists to make a case to a reader, and is
   * measured but not held to the budget — it is not competing for the same
   * attention.
   */
  kind: 'product' | 'argument';
  words: number;
  decisions: number;
};

export type Cost = {
  surface: Surface;
  readingSeconds: number;
  decidingSeconds: number;
  seconds: number;
  /** Multiples of a whole week's budget. */
  weeks: number;
};

export function costOf(surface: Surface): Cost {
  const readingSeconds = (surface.words / WORDS_PER_MINUTE) * 60;
  const decidingSeconds = surface.decisions * SECONDS_PER_DECISION;
  const seconds = readingSeconds + decidingSeconds;

  return {
    surface,
    readingSeconds,
    decidingSeconds,
    seconds,
    weeks: seconds / WEEKLY_BUDGET_SECONDS,
  };
}

export type Audit = {
  costs: Cost[];
  /** Everything, in seconds. */
  total: number;
  /** Only the surfaces that could ship. */
  productTotal: number;
  /** Only the surfaces that exist to argue. */
  argumentTotal: number;
  /** The cheapest surface, which is the one most worth being. */
  cheapest: Cost;
  /** The most expensive, which had better be earning it. */
  dearest: Cost;
  /** How many weeks of the real product this whole site costs. */
  weeksOfProduct: number;
};

export function audit(surfaces: readonly Surface[]): Audit {
  const costs = surfaces.map(costOf).sort((a, b) => b.seconds - a.seconds);
  const sum = (list: Cost[]) => list.reduce((t, c) => t + c.seconds, 0);

  const total = sum(costs);

  return {
    costs,
    total,
    productTotal: sum(costs.filter((c) => c.surface.kind === 'product')),
    argumentTotal: sum(costs.filter((c) => c.surface.kind === 'argument')),
    cheapest: costs[costs.length - 1],
    dearest: costs[0],
    weeksOfProduct: total / WEEKLY_BUDGET_SECONDS,
  };
}

/** Seconds, said the way a person would say them. */
export function saidAs(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${minutes.toFixed(minutes < 10 ? 1 : 0)} minutes`;
  return `${(minutes / 60).toFixed(1)} hours`;
}
