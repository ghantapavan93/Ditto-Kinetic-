/**
 * The living profile.
 *
 * Onboarding is where dating apps do their most confident lying. Twenty
 * questions in, the app presents a finished profile — interests, a type, a
 * personality read — and the implication is that it now knows you. It does not.
 * It knows twenty answers, most of which were guesses about yourself made at
 * speed on a signup screen.
 *
 * This models the same thing honestly. A profile here is a set of beliefs, each
 * carrying a confidence and a provenance, and it is allowed to be mostly empty.
 * The unknowns are rendered as unknowns rather than quietly defaulted, because
 * the gaps are the most truthful part of the object and hiding them is what
 * makes the rest of it a claim.
 *
 * Three properties are enforced here rather than described in copy:
 *
 * Confidence converges on a ceiling well short of certainty. Evidence closes a
 * fraction of the remaining distance to `CONFIDENCE_CEILING` and never more, so
 * no amount of answering can produce certainty about a person — a system that
 * can reach 1.0 about someone has stopped modelling a human being.
 *
 * The convergence is genuinely asymptotic in the arithmetic and lands exactly
 * on the ceiling once float64 runs out of room to represent the gap, which
 * takes tens of rounds of answering the same questions. That is a rounding
 * artifact rather than a design property, and the property worth stating is the
 * one that holds unconditionally: nothing here ever exceeds the ceiling, and
 * the ceiling is not certainty.
 *
 * Every belief names where it came from. A belief the system cannot source is
 * one it should not be acting on, and provenance is the difference between "we
 * observed this" and "we assumed this".
 *
 * And an answer that changes nothing is reported as changing nothing. That is
 * the case the whole file exists for: it lets the product admit that a question
 * was worthless, which is the only way it can justify asking so few.
 */

export const CONFIDENCE_CEILING = 0.92;

/** Below this, the system will not act on a belief or show it as a read. */
export const ACTIONABLE = 0.45;

export type Provenance =
  /** They typed or picked it. Cheap to get, easy to be wrong about yourself. */
  | 'stated'
  /** Inferred from an answer that was about something else. */
  | 'inferred'
  /** Seen in what actually happened. The only expensive kind. */
  | 'observed';

export type Trait = {
  id: string;
  /** Written as a claim about a person, not as a category. */
  label: string;
  confidence: number;
  provenance: Provenance;
  /** Null until something has actually supported it. */
  since: string | null;
};

export type Effect = {
  trait: string;
  /** 0..1 — how much of the remaining distance to the ceiling this closes. */
  strength: number;
  provenance: Provenance;
};

export type Answer = {
  id: string;
  label: string;
  effects: Effect[];
};

export type Question = {
  id: string;
  prompt: string;
  /** Shown after answering, in the system's own voice. */
  note: string;
  answers: Answer[];
};

export type Change = {
  trait: Trait;
  from: number;
  to: number;
  /** True when this belief had no support at all before now. */
  isNew: boolean;
};

/**
 * Fold one answer into the profile.
 *
 * The confidence update is deliberately asymptotic rather than additive:
 * `c + (CEILING - c) * strength`. Early evidence about someone moves a belief a
 * long way and later evidence moves it less, which is both how belief should
 * behave and the mechanism that makes certainty unreachable. Additive updates
 * would let four confident answers manufacture a person.
 */
export function applyAnswer(
  traits: readonly Trait[],
  answer: Answer,
  when: string,
): { traits: Trait[]; changes: Change[]; informative: boolean } {
  const changes: Change[] = [];

  const next = traits.map((trait) => {
    const effect = answer.effects.find((e) => e.trait === trait.id);
    if (!effect) return trait;

    const to = trait.confidence + (CONFIDENCE_CEILING - trait.confidence) * effect.strength;
    const updated: Trait = {
      ...trait,
      confidence: to,
      // Provenance only ever gets weaker-to-stronger. Something observed does
      // not become merely stated because a later answer also touched it.
      provenance: rank(effect.provenance) > rank(trait.provenance) ? effect.provenance : trait.provenance,
      since: when,
    };

    changes.push({
      trait: updated,
      from: trait.confidence,
      to,
      isNew: trait.since === null,
    });

    return updated;
  });

  return { traits: next, changes, informative: changes.length > 0 };
}

const ORDER: Record<Provenance, number> = { stated: 0, inferred: 1, observed: 2 };
const rank = (p: Provenance) => ORDER[p];

/** What the system will actually act on, strongest first. */
export function actionable(traits: readonly Trait[]): Trait[] {
  return traits
    .filter((t) => t.confidence >= ACTIONABLE)
    .sort((a, b) => b.confidence - a.confidence);
}

/** What it still has no view on. Rendered, never hidden. */
export function unknowns(traits: readonly Trait[]): Trait[] {
  return traits.filter((t) => t.confidence < ACTIONABLE);
}
