/**
 * SYNTHETIC. What the system believed before tonight.
 *
 * A learning loop is only legible if you can see what it is learning *from*.
 * These are the standing hypotheses about one person — dated, sourced, and
 * hedged — so that when one of them gets struck through after a single date,
 * the strike is visibly a revision rather than an initialisation.
 *
 * Note the `since` and `source` fields. A belief the system cannot say where it
 * got is a belief it should not be acting on, and being able to show the
 * provenance is the difference between memory and assertion.
 */

export type Standing = 'held' | 'strengthened' | 'struck' | 'new';

export type MemoryCard = {
  id: string;
  text: string;
  standing: Standing;
  /** Where this came from. Never "the model decided". */
  source: string;
  since: string;
  /** Higher sits closer to the front of the board. */
  weight: number;
};

/** What was on the board before tonight. */
export const MEMORY_BEFORE: MemoryCard[] = [
  {
    id: 'outgoing',
    text: 'prefers people who are not too outgoing',
    standing: 'held',
    source: 'they wrote it, week one',
    since: 'wk 1',
    weight: 0.9,
  },
  {
    id: 'plan',
    text: 'wants a plan, not a suggestion',
    standing: 'held',
    source: 'three cancellations on open-ended nights',
    since: 'wk 2',
    weight: 0.6,
  },
  {
    id: 'walking',
    text: 'opens up somewhere into the second hour',
    standing: 'held',
    source: 'two feedback notes mentioning "after a while"',
    since: 'wk 3',
    weight: 0.45,
  },
];

/**
 * What the board looks like after tonight.
 *
 * One belief is struck, not deleted — a learning system that quietly overwrites
 * what it used to think is impossible to audit, and the strike is the only
 * honest record that it was ever wrong. One belief moves forward because the
 * night supported it. One arrives.
 */
export const MEMORY_AFTER: MemoryCard[] = [
  {
    id: 'pressure',
    text: 'unstructured pressure may matter more than extroversion',
    standing: 'new',
    source: 'tonight — "more outgoing than expected" and "weirdly easy" in one sentence',
    since: 'tonight',
    weight: 1,
  },
  {
    id: 'walking',
    text: 'opens up once the evening is already in motion',
    standing: 'strengthened',
    source: 'three notes now, including tonight',
    since: 'wk 3',
    weight: 0.8,
  },
  {
    id: 'plan',
    text: 'wants a plan, not a suggestion',
    standing: 'held',
    source: 'three cancellations on open-ended nights',
    since: 'wk 2',
    weight: 0.6,
  },
  {
    id: 'outgoing',
    text: 'prefers people who are not too outgoing',
    standing: 'struck',
    source: 'contradicted tonight by their own account of the evening',
    since: 'wk 1',
    weight: 0.2,
  },
];
