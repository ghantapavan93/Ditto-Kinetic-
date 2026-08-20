import { z } from 'zod';

/**
 * Post-date feedback interpretation.
 *
 * Two implementations sit behind one schema: a deterministic local reader that
 * always works, and an optional model call that is allowed to be better. The
 * schema is the contract between them, and it is validated on the way out of
 * the model — a malformed completion degrades to the local reader rather than
 * reaching the interface.
 *
 * Note the shape: `inferredHypotheses` carry evidence and a confidence, and
 * `uncertainty` is a required array. There is no field in which this object can
 * express certainty about a person.
 */

export const FeedbackInterpretation = z.object({
  preserve: z.array(z.string()).max(4),
  increase: z.array(z.string()).max(4),
  decrease: z.array(z.string()).max(4),
  inferredHypotheses: z
    .array(
      z.object({
        hypothesis: z.string().min(3).max(180),
        evidence: z.string().min(3).max(180),
        confidence: z.enum(['low', 'medium', 'high']),
      }),
    )
    .max(3),
  uncertainty: z.array(z.string()).max(3),
});

export type FeedbackInterpretation = z.infer<typeof FeedbackInterpretation>;

/** Phrases the local reader looks for, and what each one implies. */
const SIGNALS: { test: RegExp; bucket: 'increase' | 'decrease' | 'preserve'; label: string }[] = [
  { test: /\bwalk(ing|ed)?\b/i, bucket: 'increase', label: 'movement during the opening' },
  { test: /\bafter (the )?(show|film|movie|gig|game)\b/i, bucket: 'increase', label: 'a shared event beforehand' },
  { test: /\beasy|easier|relaxed|comfortable\b/i, bucket: 'preserve', label: 'low-pressure settings' },
  { test: /\boutgoing|energetic|loud|chatty\b/i, bucket: 'preserve', label: 'higher-energy people' },
  { test: /\bquiet|awkward|silence|stall(ed)?\b/i, bucket: 'decrease', label: 'openings with no shared object' },
  { test: /\binterview|questions|grill(ed|ing)?\b/i, bucket: 'decrease', label: 'seated face-to-face starts' },
  { test: /\blate|tired|exhausted|rushed\b/i, bucket: 'decrease', label: 'late-evening slots' },
  { test: /\bcoffee|caf[eé]\b/i, bucket: 'decrease', label: 'café tables as a default venue' },
  { test: /\bfood|tacos|dinner|eat(ing)?\b/i, bucket: 'increase', label: 'food as a second beat' },
  { test: /\bshort|quick|brief\b/i, bucket: 'preserve', label: 'a short first window' },
];

/** Fragments the receipt highlights. Returned as [start, end) offsets. */
export function highlightRanges(text: string): { start: number; end: number; kind: 'up' | 'down' }[] {
  const ranges: { start: number; end: number; kind: 'up' | 'down' }[] = [];
  for (const signal of SIGNALS) {
    const match = signal.test.exec(text);
    if (!match || match.index < 0) continue;
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: signal.bucket === 'decrease' ? 'down' : 'up',
    });
  }
  return ranges.sort((a, b) => a.start - b.start).filter((r, i, arr) => i === 0 || r.start >= arr[i - 1].end);
}

/**
 * Deterministic interpretation. No network, no model, no randomness.
 * This is what ships if `/api/feedback` is unavailable — which, by default,
 * it is.
 */
export function interpretLocally(text: string): FeedbackInterpretation {
  const hits = SIGNALS.filter((s) => s.test.test(text));
  const bucket = (name: 'increase' | 'decrease' | 'preserve') =>
    Array.from(new Set(hits.filter((h) => h.bucket === name).map((h) => h.label))).slice(0, 3);

  const mentionsEnergy = /\boutgoing|energetic|loud|chatty\b/i.test(text);
  const mentionsEase = /\beasy|easier|relaxed|comfortable|fine\b/i.test(text);
  const mentionsMotion = /\bwalk(ing|ed)?|after (the )?(show|film|movie)\b/i.test(text);

  const inferred: FeedbackInterpretation['inferredHypotheses'] = [];

  if (mentionsEnergy && mentionsEase) {
    inferred.push({
      hypothesis: 'energy was never the problem. unstructured pressure might be.',
      evidence: 'they described someone more outgoing than expected and still called it easy.',
      confidence: 'medium',
    });
  }
  if (mentionsMotion) {
    inferred.push({
      hypothesis: 'openings that are already in motion outperform openings that begin seated.',
      evidence: 'the part they volunteered first involved movement, not conversation.',
      confidence: mentionsEase ? 'medium' : 'low',
    });
  }
  if (inferred.length === 0) {
    inferred.push({
      hypothesis: 'not enough signal in one sentence to move anything yet.',
      evidence: 'no repeated pattern across their previous openings.',
      confidence: 'low',
    });
  }

  return {
    preserve: bucket('preserve'),
    increase: bucket('increase'),
    decrease: bucket('decrease'),
    inferredHypotheses: inferred.slice(0, 3),
    uncertainty: [
      'one date is one data point.',
      'we cannot separate the person from the setting yet.',
    ],
  };
}
