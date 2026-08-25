/**
 * The matchmaker — who should meet, decided inspectably.
 *
 * FIRST SCENE begins after a pair exists. This module is the step before:
 * one seeker, a small synthetic universe, and a Wednesday decision that can
 * be traced, replayed, counterfactualed and refused. The dishonesty it
 * corrects is the single compatibility score — a number that averages two
 * people into one and calls the average a match. Here every read keeps its
 * direction: A→B and B→A are computed separately and joined by a harmonic
 * mean, which a one-sided pair cannot fake.
 *
 * The rules, as decisions:
 *
 *   - hard boundaries gate before anything scores. They are not weights,
 *     for the same reason venue safety is not a weight downstream.
 *   - the pipeline is ordered loss: eligibility → mutuality → this week's
 *     hours → real friction → a viable first scene. Each stage records who
 *     it removed and why, because "why not that person?" deserves as good
 *     an answer as "why this one?".
 *   - distance is friction, not miles. Forty-five minutes and two
 *     transfers is further than seventeen flat miles, and a buried week
 *     shrinks everyone's tolerance.
 *   - the system may abstain. A thin week produces "not this Wednesday",
 *     never a manufactured winner.
 *   - the model can propose exploring a SOFT preference (hear me out); it
 *     can never explore across a HARD one, and "never use that signal"
 *     retires the reasoning permanently.
 *
 * POLICY BEFORE MODEL: everything in this file is deterministic. A language
 * model may interpret free text or draft the human sentence, but whether a
 * candidate is eligible, whether privacy holds, and whether the system may
 * act are decided here, in code a reviewer can read.
 *
 * SYNTHETIC PROTOTYPE LOGIC — this is not Ditto's engine, and no claim is
 * made about theirs. See RESEARCH.md.
 */

import type { AskableQuestion, CandidateProfile } from '@/data/matchmaking';
import { expireForWeek, usable, type PersonModel } from './personModel';

/* ----------------------------------------------------------------------- */
/* Tuning                                                                  */
/* ----------------------------------------------------------------------- */

/**
 * The mutuality bar. Below this reciprocal read, a candidacy is not sent —
 * 0.55 sits deliberately above the harmonic mean a lopsided pair can reach
 * when one direction is weak (0.85 against 0.2 joins at 0.32), so
 * one-sidedness fails structurally rather than by luck.
 */
export const MUTUAL_BAR = 0.55;

/** Selection needs this much confidence to act without asking. */
export const CONFIDENCE_TO_ACT = 0.6;

/** How far the friction tolerance shrinks when the week is buried. */
const FRICTION_CEILING_MIN = { normal: 50, buried: 30 } as const;

/* ----------------------------------------------------------------------- */
/* Result shapes                                                           */
/* ----------------------------------------------------------------------- */

export type CandidateEval = {
  candidate: CandidateProfile;
  /** Independent directions. Displayed as two numbers, never one. */
  aToB: number;
  bToA: number;
  /** Harmonic mean of the two directions. */
  reciprocal: number;
  frictionRead: 'easy' | 'a-little-far' | 'heavy';
  scheduleFit: boolean;
  sceneViable: boolean;
  eligible: boolean;
  /** Internal, unredacted. Never rendered to a consumer surface. */
  gateReason?: string;
  exitedAt?: 'eligibility' | 'mutuality' | 'schedule' | 'friction' | 'scene';
  /** Consumer sentence for the held-back envelope. Already redacted. */
  heldBack?: string;
  /** A strong candidate violating one SOFT preference — the hear-me-out. */
  softViolation?: { key: string; line: string };
};

export type MatchDecision = {
  selected?: CandidateEval;
  heldBack: CandidateEval[];
  abstained: boolean;
  abstainLine?: string;
  counts: { pool: number; eligible: number; mutual: number; scheduled: number; lowFriction: number; sceneViable: number };
};

export type TraceEvent = { step: number; type: string; detail: string };

export type RunResult = {
  decision: MatchDecision;
  evals: CandidateEval[];
  trace: TraceEvent[];
  model: PersonModel;
  week: number;
};

export type ActionCall = {
  action: 'act' | 'suggest' | 'ask' | 'abstain';
  confidence: number;
  consequence: 'low' | 'meaningful' | 'high';
  reversible: boolean;
  why: string;
};

/* ----------------------------------------------------------------------- */
/* The read, one candidate at a time                                       */
/* ----------------------------------------------------------------------- */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * What the seeker's model wants energy-wise, honouring retirement: a
 * retired energy signal reads as no target at all, which is the practical
 * meaning of "never use that signal".
 */
function energyTarget(model: PersonModel): number | null {
  if (model.tuning?.energyTarget !== undefined) return model.tuning.energyTarget;
  const belief = usable(model.beliefs).find((b) => b.key === 'energy');
  if (!belief) return null;
  if (/very outgoing/.test(belief.value)) return 0.8;
  if (/daylight|flat after/.test(belief.value)) return 0.4;
  return 0.5;
}

/**
 * The seeker's side of the read. Anchors and complements trade under
 * `similarityBias` — the clone↔surprise axis — and the energy term uses
 * the model's target when one survives. The constants are judgements:
 * a base of 0.3 so nobody starts at zero, anchor and complement capped so
 * quantity cannot substitute for direction.
 */
export function desireFor(model: PersonModel, c: CandidateProfile): number {
  const anchorTerm = Math.min(1, c.anchors.length * 0.25);
  const compTerm = Math.min(1, c.complements.length * 0.3);
  const anchorW = 0.35 - 0.25 * model.similarityBias;
  const compW = 0.35 + 0.25 * model.similarityBias;

  const target = energyTarget(model);
  const energyFit = target === null ? 0.5 : 1 - Math.abs(c.energy - target);

  return clamp01(0.3 + anchorW * anchorTerm + compW * compTerm + 0.2 * energyFit);
}

/** Two directions joined so the weaker one dominates. */
export function reciprocalOf(aToB: number, bToA: number): number {
  if (aToB <= 0 || bToA <= 0) return 0;
  return (2 * aToB * bToA) / (aToB + bToA);
}

/** Friction as lived, not as drawn on a map. */
export function frictionReadFor(c: CandidateProfile, buried: boolean): CandidateEval['frictionRead'] {
  const ceiling = buried ? FRICTION_CEILING_MIN.buried : FRICTION_CEILING_MIN.normal;
  if (c.travel.minutes > ceiling || c.travel.transfers >= (buried ? 2 : 3)) return 'heavy';
  if (c.travel.minutes <= 20 && c.travel.transfers <= 1) return 'easy';
  return 'a-little-far';
}

/**
 * Hard gates only. Soft preferences never appear here — that asymmetry is
 * the whole point of firmness — and the internal reason is allowed to name
 * a private belief because this string never leaves the engine unredacted.
 */
function gate(model: PersonModel, c: CandidateProfile, week: number): { ok: boolean; reason?: string } {
  const beliefs = usable(model.beliefs);

  const smoking = beliefs.find((b) => b.key === 'smoking');
  if (smoking?.firmness === 'hard' && c.smokes) return { ok: false, reason: 'hard boundary: smoking' };

  const politics = beliefs.find((b) => b.key === 'politics');
  if (politics?.firmness === 'hard' && !c.sharesPolitics) {
    return { ok: false, reason: 'hard boundary: politics (private)' };
  }

  const compatible =
    model.intent === c.intent ||
    (model.intent === 'serious' && c.intent === 'life-partner') ||
    (model.intent === 'life-partner' && c.intent === 'serious');
  if (!compatible) return { ok: false, reason: 'intent mismatch' };

  if (c.base === 'away-city') {
    const window = model.awayWindows.find(
      (w) => w.optedIn && w.city === c.awayCity && week >= w.fromWeek && week <= w.toWeek,
    );
    if (!window) return { ok: false, reason: 'outside any active travel window' };
  }

  return { ok: true };
}

/* ----------------------------------------------------------------------- */
/* The run                                                                 */
/* ----------------------------------------------------------------------- */

/**
 * One Wednesday, decided. Ordered loss with a full trace; the counts the
 * X-ray shows are these counts, not decoration.
 */
export function runMatchmaker(rawModel: PersonModel, pool: CandidateProfile[], week: number): RunResult {
  const model = expireForWeek(rawModel, week);
  const buried = model.thisWeek?.mode === 'buried';
  const trace: TraceEvent[] = [];
  let step = 0;
  const log = (type: string, detail: string) => trace.push({ step: step++, type, detail });

  log('ProfileHydrated', `${model.name} · ${usable(model.beliefs).length} live signals · week ${week}`);
  log('CandidatePoolRetrieved', `${pool.length} candidates, all synthetic`);

  const evals: CandidateEval[] = pool.map((c) => {
    const g = gate(model, c, week);
    const aToB = desireFor(model, c);
    const bToA = c.interestBack;
    const reciprocal = reciprocalOf(aToB, bToA);
    const frictionRead = frictionReadFor(c, buried);
    const scheduleFit = c.freeWeeks.includes(week);
    const sceneViable = !buried || c.energy <= 0.65;

    const e: CandidateEval = {
      candidate: c, aToB, bToA, reciprocal, frictionRead, scheduleFit, sceneViable,
      eligible: g.ok, gateReason: g.reason,
    };

    if (!g.ok) {
      e.exitedAt = 'eligibility';
      log('HardConstraintRejected', `${c.name}: ${g.reason}`);
      return e;
    }
    log('MutualityEvaluated', `${c.name}: ${aToB.toFixed(2)} → · ← ${bToA.toFixed(2)} (joins at ${reciprocal.toFixed(2)})`);
    if (reciprocal < MUTUAL_BAR) {
      e.exitedAt = 'mutuality';
      e.heldBack = 'the interest doesn’t run both ways yet';
      log('CandidateHeldBack', `${c.name}: one-sided (${reciprocal.toFixed(2)} < ${MUTUAL_BAR})`);
      return e;
    }
    log('AvailabilityEvaluated', `${c.name}: ${scheduleFit ? 'shares an hour this week' : 'no shared hour this week'}`);
    if (!scheduleFit) {
      e.exitedAt = 'schedule';
      e.heldBack = 'no shared hour this week — the week, not the person';
      log('CandidateHeldBack', `${c.name}: schedule`);
      return e;
    }
    log('TravelFrictionEvaluated', `${c.name}: ${c.travel.minutes} min · ${c.travel.transfers} transfers → ${frictionRead}`);
    if (frictionRead === 'heavy') {
      e.exitedAt = 'friction';
      e.heldBack = buried
        ? 'a little far for the week she’s actually having'
        : 'the journey outweighs the evening';
      log('CandidateHeldBack', `${c.name}: friction`);
      return e;
    }
    log('SceneViabilityEvaluated', `${c.name}: ${sceneViable ? 'a workable first hour exists' : 'no low-pressure opening this week'}`);
    if (!sceneViable) {
      e.exitedAt = 'scene';
      e.heldBack = 'no first hour that fits this week’s capacity';
      log('CandidateHeldBack', `${c.name}: scene viability`);
      return e;
    }

    const energyBelief = usable(model.beliefs).find((b) => b.key === 'energy');
    if (energyBelief?.firmness === 'soft' && /very outgoing/.test(energyBelief.value) && c.energy < 0.55) {
      e.softViolation = {
        key: 'energy',
        line: 'breaks the stated pattern on social energy — kept in anyway',
      };
    }
    return e;
  });

  const survivors = evals
    .filter((e) => !e.exitedAt)
    .sort((a, b) => b.reciprocal - a.reciprocal || a.candidate.id.localeCompare(b.candidate.id));

  const counts = {
    pool: pool.length,
    eligible: evals.filter((e) => e.eligible).length,
    mutual: evals.filter((e) => e.eligible && e.reciprocal >= MUTUAL_BAR).length,
    scheduled: evals.filter((e) => e.eligible && e.reciprocal >= MUTUAL_BAR && e.scheduleFit).length,
    lowFriction: evals.filter((e) => e.eligible && e.reciprocal >= MUTUAL_BAR && e.scheduleFit && e.frictionRead !== 'heavy').length,
    sceneViable: survivors.length,
  };

  const heldBack = evals.filter((e) => e.heldBack);
  const winner = survivors[0];

  let decision: MatchDecision;
  if (!winner || winner.reciprocal < MUTUAL_BAR + 0.05) {
    decision = {
      heldBack, abstained: true,
      abstainLine: 'I found people. I didn’t find one worth spending your Wednesday on.',
      counts,
    };
    log('Abstained', `nothing above the bar with margin — not this Wednesday`);
  } else {
    decision = { selected: winner, heldBack, abstained: false, counts };
    log('CandidateSelected', `${winner.candidate.name} · reciprocal ${winner.reciprocal.toFixed(2)}`);
    log('PrivacyFilterPassed', 'explanation contains no private signal');
  }

  return { decision, evals, trace, model, week };
}

/* ----------------------------------------------------------------------- */
/* The question budget                                                     */
/* ----------------------------------------------------------------------- */

/** Apply one answer without touching the belief record. */
export function withAnswer(model: PersonModel, q: AskableQuestion, optionIndex: number): PersonModel {
  const effect = q.options[optionIndex].effect;
  if (effect.kind === 'bias') return { ...model, similarityBias: effect.value };
  if (effect.kind === 'energy-target') return { ...model, tuning: { ...model.tuning, energyTarget: effect.value } };
  return model;
}

/**
 * A question is worth its interruption only if some answer changes who
 * Wednesday belongs to. Measured by simulation, not vibes: run every
 * answer, count distinct winners. One winner means the system already
 * knew; it should not have asked.
 */
export function questionValue(model: PersonModel, pool: CandidateProfile[], week: number, q: AskableQuestion): number {
  const winners = new Set(
    q.options.map((_, i) => runMatchmaker(withAnswer(model, q, i), pool, week).decision.selected?.candidate.id ?? 'abstain'),
  );
  return winners.size;
}

/** The one question to ask, if any earns the interruption. */
export function chooseQuestion(model: PersonModel, pool: CandidateProfile[], week: number, askable: AskableQuestion[]): { question: AskableQuestion; distinctWinners: number } | null {
  let best: { question: AskableQuestion; distinctWinners: number } | null = null;
  for (const q of askable) {
    const distinctWinners = questionValue(model, pool, week, q);
    if (!best || distinctWinners > best.distinctWinners) best = { question: q, distinctWinners };
  }
  return best && best.distinctWinners > 1 ? best : null;
}

/* ----------------------------------------------------------------------- */
/* Explanation and its privacy filter                                      */
/* ----------------------------------------------------------------------- */

/**
 * internal reasons → privacy filter → what a person may see.
 *
 * The internal list may name private beliefs; the public list may not,
 * and the filter removes by construction rather than by review: any line
 * derived from a belief marked private never enters the public set.
 */
export function explainDecision(run: RunResult): { internal: string[]; public: string[] } {
  const internal: string[] = [];
  const pub: string[] = [];
  const privateKeys = new Set(run.model.beliefs.filter((b) => b.isPrivate).map((b) => b.key));

  for (const e of run.evals) {
    if (e.gateReason) {
      internal.push(`${e.candidate.name}: ${e.gateReason}`);
      const touchesPrivate = [...privateKeys].some((k) => (e.gateReason ?? '').includes(k));
      if (!touchesPrivate) pub.push(`${e.candidate.name}: outside a stated boundary`);
      // A private gate produces silence, not a euphemism — the candidate
      // simply does not appear in anyone's public accounting.
    } else if (e.heldBack) {
      internal.push(`${e.candidate.name}: ${e.heldBack}`);
      pub.push(`${e.candidate.name}: ${e.heldBack}`);
    }
  }

  const s = run.decision.selected;
  if (s) {
    pub.push(
      `${s.candidate.name}: wants this too (${s.bToA.toFixed(2)} their side) · ${s.frictionRead === 'easy' ? 'easy to get to' : 'worth the trip'} · a first hour exists that fits the week`,
    );
  }
  return { internal, public: pub };
}

/* ----------------------------------------------------------------------- */
/* Counterfactuals — what would change this?                               */
/* ----------------------------------------------------------------------- */

export type Scenario = 'free-thursday' | 'nyc-window' | 'ease-the-week';

/** One deterministic change, then the same engine. Nothing else moves. */
export function applyScenario(model: PersonModel, pool: CandidateProfile[], week: number, s: Scenario): { model: PersonModel; pool: CandidateProfile[]; week: number } {
  if (s === 'free-thursday') {
    return {
      model, week,
      pool: pool.map((c) => (c.id === 'leah' ? { ...c, freeWeeks: [...c.freeWeeks, week] } : c)),
    };
  }
  if (s === 'nyc-window') {
    const opened = model.awayWindows.map((w) => (w.city === 'New York' ? { ...w, fromWeek: week } : w));
    return { model: { ...model, awayWindows: opened }, pool, week };
  }
  return { model: { ...model, thisWeek: undefined }, pool, week };
}

/* ----------------------------------------------------------------------- */
/* Action policy                                                           */
/* ----------------------------------------------------------------------- */

/** CONFIDENCE × CONSEQUENCE × REVERSIBILITY, stated as policy. */
export function actionCall(run: RunResult): ActionCall {
  const s = run.decision.selected;
  if (!s) {
    return { action: 'abstain', confidence: 0, consequence: 'high', reversible: false, why: 'introducing two people is not reversible; a thin week does not clear the bar' };
  }
  const margin = s.reciprocal - MUTUAL_BAR;
  const confidence = clamp01(0.5 + margin * 2);
  if (confidence >= CONFIDENCE_TO_ACT) {
    return { action: 'suggest', confidence, consequence: 'meaningful', reversible: true, why: 'confident enough to propose; the person still owns the yes' };
  }
  return { action: 'ask', confidence, consequence: 'meaningful', reversible: true, why: 'one answer would settle it — ask, don’t guess' };
}

/* ----------------------------------------------------------------------- */
/* After — outcomes, hypotheses, and knowing when to leave                 */
/* ----------------------------------------------------------------------- */

export type Outcome =
  | 'date-happened' | 'date-didnt-happen' | 'conversation-continued'
  | 'they-extended-the-evening' | 'both-want-another' | 'venue-failed'
  | 'rejected-recommendation-not-person';

/**
 * Outcome is evidence; hypothesis is interpretation. The two never merge:
 * the return names a possible learning and holds it at observed-level
 * confidence, and nothing here rewrites an explicit belief — `reviseBelief`
 * would refuse anyway, which is the invariant doing its job.
 */
export function learningFrom(outcome: Outcome): { hypothesis: string | null; heldAs: 'hypothesis'; note: string } {
  const map: Partial<Record<Outcome, string>> = {
    'they-extended-the-evening': 'balanced energy may matter more than the stated "very outgoing" — possible learning, not a fact',
    'both-want-another': 'the low-pressure opening carried it — scene choice, not chemistry alone',
    'venue-failed': 'nothing about the pair — preserve them, replan the place',
    'rejected-recommendation-not-person': 'the reasoning missed, the person didn’t — review the signal, keep the candidate pool intact',
  };
  return {
    hypothesis: map[outcome] ?? null,
    heldAs: 'hypothesis',
    note: 'outcomes update hypotheses; only the person updates their own record',
  };
}

/** Strong independent momentum ends the system's involvement. A feature. */
export function interventionFor(momentum: 'none' | 'some' | 'strong'): { intervention: 'plan' | 'nudge' | 'none'; line: string } {
  if (momentum === 'strong') return { intervention: 'none', line: 'they’re doing fine without us.' };
  if (momentum === 'some') return { intervention: 'nudge', line: 'one gentle option, then quiet.' };
  return { intervention: 'plan', line: 'still our job this week.' };
}
