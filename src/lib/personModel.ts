/**
 * The person model — what the matchmaker actually holds after onboarding.
 *
 * The observed join flow collects around two dozen answers. The dishonesty
 * this module corrects is treating those answers as facts: an answer is a
 * sentence a person typed on a Tuesday, and a system that stores it as truth
 * has already failed them twice — once by over-trusting the words, once by
 * never letting the words expire.
 *
 * So everything here is a `Belief`: a value plus where it came from, how
 * firm it is, how sure the system is, whether it is private, and when it
 * stops being true on its own. The rules are decisions, not formulas:
 *
 *   - a stated preference is not automatically a boundary. "usually taller"
 *     compiles soft; "super important" compiles hard. The person outranks
 *     the compiler at all times.
 *   - an explicit correction beats any inference, at any confidence.
 *   - temporary context expires by construction. Exam week is capacity,
 *     not personality.
 *   - a retired signal is never consulted again. Rejecting the reasoning
 *     is different from rejecting the candidate, and the model records
 *     which one happened.
 *
 * Out of scope, deliberately: nothing here reads a face. Photos are
 * identity, not features — no attractiveness, orientation, ethnicity or
 * personality is ever inferred from an image, and the eval suite holds the
 * engine to the rest of these rules.
 *
 * SYNTHETIC PROTOTYPE LOGIC — this is not Ditto's model. See RESEARCH.md.
 */

/** Where a belief came from. The interface voice derives from this. */
export type BeliefSource = 'explicit' | 'observed' | 'inferred' | 'corrected' | 'temporary';

/** What force a preference exerts on the candidate pool. */
export type Firmness = 'hard' | 'soft' | 'open' | 'unknown';

export type BeliefStatus = 'live' | 'expired' | 'retired';

export type Belief = {
  /** Stable key the engine matches on: 'smoking', 'height', 'politics'… */
  key: string;
  /** Short label for the signal card. Lowercase, like everything spoken. */
  label: string;
  /** The value as held, in words. */
  value: string;
  firmness: Firmness;
  source: BeliefSource;
  /** 0..1 — displayed, never hidden. Uncertainty is a feature here. */
  confidence: number;
  /**
   * Private beliefs may gate eligibility but can never surface in an
   * explanation or anything the other person sees. The redaction step
   * enforces it; an eval proves it.
   */
  isPrivate: boolean;
  /** Prototype week this stops being true on its own, when temporary. */
  expiresAfterWeek?: number;
  status: BeliefStatus;
  /** The raw words that produced this belief, for the compiler view. */
  saidAs?: string;
};

/** "this week i'm…" — capacity, never personality. Expires by construction. */
export type TemporaryContext = {
  mode: 'social' | 'low-key' | 'buried' | 'spontaneous' | 'group' | 'open';
  week: number;
};

/** A travel window. Never rewrites home; opens a second, expiring universe. */
export type AwayWindow = {
  city: string;
  fromWeek: number;
  toWeek: number;
  /** Both sides must have opted into travel-context introductions. */
  optedIn: boolean;
};

export type Intent = 'life-partner' | 'serious' | 'casual' | 'friends' | 'unsure';
export type Pace = 'more-faster' | 'steady' | 'fewer-better' | 'wait';

/** The person as the matchmaker holds them. Everything downstream derives. */
export type PersonModel = {
  id: string;
  name: string;
  campus: string;
  beliefs: Belief[];
  intent: Intent;
  pace: Pace;
  thisWeek?: TemporaryContext;
  awayWindows: AwayWindow[];
  /** −1 clone me … +1 surprise me. Unknown starts at 0 and low confidence. */
  similarityBias: number;
  /** The free-text line and the system's proposed reading of it. */
  oneThing?: { said: string; readAs: string; confirmed: boolean };
  /**
   * Adjustments an adaptive answer is allowed to make without rewriting a
   * belief — the answer tunes the read, the beliefs stay the record.
   */
  tuning?: { energyTarget?: number };
};

/**
 * How sure the compiler is allowed to be about its own classification.
 * An inference is never allowed to reach the certainty of a statement —
 * the gap is what makes "you said" and "I'm inferring" different sentences.
 */
export const EXPLICIT_CONFIDENCE = 0.9;
export const INFERRED_CEILING = 0.62;

/**
 * The compiler: WHAT YOU SAID → WHAT I THINK IT MEANS.
 *
 * The observed flow's own follow-up pattern ("does your match have to share
 * your politics?" — doesn't matter / kinda / super important) is already a
 * firmness question, so the compiler honours it: importance is the person
 * classifying their own preference, and it lands as open, soft or hard
 * accordingly. Hedged phrasing ("usually", "mostly") caps at soft even
 * when no importance was asked — a habit is not a boundary until its owner
 * says it is.
 */
export function classifyAnswer(input: {
  key: string;
  label: string;
  said: string;
  isPrivate?: boolean;
  importance?: 'none' | 'some' | 'super';
  temporaryForWeek?: number;
}): Belief {
  const hedged = /\b(usually|mostly|probably|tend|prefer|lean)\b/i.test(input.said);
  const refusal = /\b(don'?t|never|won'?t|no)\b/i.test(input.said);

  let firmness: Firmness;
  if (input.importance === 'super') firmness = 'hard';
  else if (input.importance === 'some') firmness = 'soft';
  else if (input.importance === 'none') firmness = 'open';
  else if (refusal && !hedged) firmness = 'hard';
  else if (hedged) firmness = 'soft';
  else firmness = 'soft';

  return {
    key: input.key,
    label: input.label,
    value: input.said,
    firmness,
    source: input.temporaryForWeek !== undefined ? 'temporary' : 'explicit',
    confidence: EXPLICIT_CONFIDENCE,
    isPrivate: input.isPrivate ?? false,
    expiresAfterWeek: input.temporaryForWeek,
    status: 'live',
    saidAs: input.said,
  };
}

/**
 * Explicit correction overrides inference. This is an invariant, not a
 * heuristic: the corrected belief takes the person's firmness verbatim,
 * carries source 'corrected', and sits at explicit confidence. Nothing the
 * model later infers may displace it — `reviseBelief` refuses.
 */
export function correctBelief(beliefs: Belief[], key: string, firmness: Firmness): Belief[] {
  return beliefs.map((b) =>
    b.key === key
      ? { ...b, firmness, source: 'corrected' as const, confidence: EXPLICIT_CONFIDENCE }
      : b,
  );
}

/**
 * The model proposing a change to its own belief. Allowed only when the
 * standing belief is not explicit or corrected — the person's own words
 * are never overwritten by a guess, no matter how confident the guess.
 */
export function reviseBelief(beliefs: Belief[], key: string, value: string, confidence: number): Belief[] {
  return beliefs.map((b) => {
    if (b.key !== key) return b;
    if (b.source === 'explicit' || b.source === 'corrected') return b;
    return { ...b, value, source: 'inferred', confidence: Math.min(confidence, INFERRED_CEILING) };
  });
}

/**
 * "never use that signal." Rejecting the reasoning, not the candidate.
 * A retired belief stays visible in the model — the person can see what
 * the system agreed to stop consulting — but the engine treats it as gone.
 */
export function retireSignal(beliefs: Belief[], key: string): Belief[] {
  return beliefs.map((b) => (b.key === key ? { ...b, status: 'retired' as const } : b));
}

/** Advance the clock: temporary context and away windows expire on their own. */
export function expireForWeek(model: PersonModel, week: number): PersonModel {
  return {
    ...model,
    beliefs: model.beliefs.map((b) =>
      b.expiresAfterWeek !== undefined && week > b.expiresAfterWeek && b.status === 'live'
        ? { ...b, status: 'expired' as const }
        : b,
    ),
    thisWeek: model.thisWeek && model.thisWeek.week === week ? model.thisWeek : undefined,
    awayWindows: model.awayWindows.filter((w) => week <= w.toWeek),
  };
}

/** The beliefs the engine may consult: live, and never retired. */
export function usable(beliefs: Belief[]): Belief[] {
  return beliefs.filter((b) => b.status === 'live');
}

/** The signals the system should admit it does not have. */
export function unknownSignals(model: PersonModel): Belief[] {
  return model.beliefs.filter((b) => b.firmness === 'unknown' && b.status === 'live');
}
