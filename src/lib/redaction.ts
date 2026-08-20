/**
 * Private signals, rendered without being rendered.
 *
 * Ditto holds reads on the person you were matched with. You are not entitled
 * to them, and neither is the interface — a system that will show you its
 * private read on somebody the moment you tap the right thing does not have a
 * private read, it has a delayed one.
 *
 * But hiding them completely is its own dishonesty. If the system never admits
 * it is holding anything, you cannot audit what it does with it, and "we have
 * no other data" is a much bigger claim than "we have data we will not show
 * you". So the shape is public and the content is not: you can see how many
 * reads exist and roughly how much is written, and you can never see a word.
 *
 * The engineering detail is the entire point, and it is why this is a module
 * rather than a CSS class.
 *
 * A blurred `<p>` is not private. The text is still in the DOM, still in view
 * source, still selectable, still read aloud by a screen reader, and still one
 * devtools inspection away from being fully legible. Every "blurred preview" in
 * every product works this way and every one of them is a decorative promise.
 *
 * So nothing here is text. There is no string to uncover, because no string was
 * ever produced. What gets drawn is a set of word-shaped widths generated from
 * a seed — typographic rhythm with no language inside it. Turning off the blur
 * reveals grey rectangles. Selecting it copies nothing. There is nothing behind
 * the glass, which is the only version of frosted glass that means anything.
 */

/** Deterministic 0..1 stream, so a person's redaction never reshuffles. */
function seeded(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RedactedLine = {
  /** Word widths in `ch`, in order. Never characters — there are none. */
  words: number[];
};

export type RedactedSignal = {
  id: string;
  /** Public: what kind of read this is. Safe, because it names no content. */
  kind: string;
  /** Public: how sure we are. Also safe, and the useful part for auditing. */
  confidence: number;
  lines: RedactedLine[];
};

/**
 * Build the shape of a sentence nobody wrote.
 *
 * Word lengths are drawn from a rough English-like distribution — mostly three
 * to eight characters, occasionally longer — because uniformly sized blocks
 * read as a loading skeleton rather than as withheld writing. The last line of
 * each signal is short, the way a real last line is.
 */
export function redact(id: string, lineCount: number): RedactedLine[] {
  const rand = seeded(id);
  const lines: RedactedLine[] = [];

  for (let l = 0; l < lineCount; l++) {
    const last = l === lineCount - 1;
    // A full line runs to about 46ch; a closing line stops early.
    let budget = last ? 12 + rand() * 16 : 38 + rand() * 10;
    const words: number[] = [];

    while (budget > 2) {
      const roll = rand();
      const width = roll < 0.16 ? 2 + rand() * 2 : roll < 0.82 ? 3 + rand() * 5 : 8 + rand() * 5;
      const w = Math.min(width, budget);
      words.push(Number(w.toFixed(2)));
      budget -= w + 1;
    }

    lines.push({ words });
  }

  return lines;
}

/**
 * SYNTHETIC. What the system is holding about the other person.
 *
 * Only `kind` and `confidence` are ever public. The reads themselves do not
 * exist as text anywhere in this codebase — there is no hidden constant to
 * find, which is what makes the claim on the surface true rather than a design
 * intention.
 */
export function privateSignals(personId: string): RedactedSignal[] {
  const spec: { id: string; kind: string; confidence: number; lines: number }[] = [
    { id: 'pattern', kind: 'a pattern across four evenings', confidence: 0.71, lines: 3 },
    { id: 'said', kind: 'something they told us in confidence', confidence: 0.88, lines: 2 },
    { id: 'declined', kind: 'why they said no to someone else', confidence: 0.64, lines: 3 },
    { id: 'timing', kind: 'a week they asked us not to match them', confidence: 0.92, lines: 2 },
  ];

  return spec.map((s) => ({
    id: s.id,
    kind: s.kind,
    confidence: s.confidence,
    lines: redact(`${personId}:${s.id}`, s.lines),
  }));
}
