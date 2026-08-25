/**
 * Executable evals for the matchmaker — the concept's promises, run.
 *
 * Every case here calls the real engine with the real synthetic universe
 * and asserts a property, not a pinned name: dealbreakers never cross,
 * one-sided interest never masquerades as mutual, corrections beat
 * inference, private signals never surface, thin weeks abstain. The X-ray
 * surface runs this exact list in the browser and `npm run check` runs it
 * in the suite, so a green mark in the interface and a green mark in CI
 * are the same computation — there is no way to fake one without faking
 * both.
 *
 * SYNTHETIC PROTOTYPE LOGIC — these are this concept's policies under
 * test, not claims about Ditto's. See RESEARCH.md.
 */

import { ASKABLE, CANDIDATES, MAYA_MODEL, POOLS, PRIYA_MODEL } from '@/data/matchmaking';
import {
  actionCall, applyScenario, chooseQuestion, explainDecision, interventionFor,
  learningFrom, questionValue, runMatchmaker, withAnswer,
} from './matchmaker';
import { correctBelief, expireForWeek, retireSignal, reviseBelief, usable } from './personModel';

export type EvalResult = { pass: boolean; detail: string };
export type EvalCase = { id: string; title: string; rule: string; run: () => EvalResult };

const poolFor = (id: string) => CANDIDATES.filter((c) => POOLS[id].includes(c.id));

export const EVAL_CASES: EvalCase[] = [
  {
    id: 'strict-dealbreaker',
    title: 'strict dealbreaker',
    rule: 'a hard boundary is never crossed, at any setting',
    run: () => {
      const biases = [-1, -0.5, 0, 0.5, 1];
      const crossed = biases.some((b) => {
        const run = runMatchmaker({ ...MAYA_MODEL, similarityBias: b }, poolFor('maya'), 1);
        return run.evals.some((e) => e.candidate.smokes && e.eligible);
      });
      return { pass: !crossed, detail: crossed ? 'a smoker passed a hard smoking boundary' : `held across ${biases.length} bias settings` };
    },
  },
  {
    id: 'one-sided',
    title: 'one-sided match',
    rule: 'the highest one-way desire cannot outrank a mutual pair',
    run: () => {
      const run = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const dean = run.evals.find((e) => e.candidate.id === 'dean')!;
      const topAtoB = Math.max(...run.evals.map((e) => e.aToB));
      const selectedDean = run.decision.selected?.candidate.id === 'dean';
      const pass = dean.exitedAt === 'mutuality' && !selectedDean;
      return {
        pass,
        detail: `dean carries the pool's top A→B (${dean.aToB.toFixed(2)}${dean.aToB === topAtoB ? ', highest' : ''}) and still exits at mutuality (${dean.reciprocal.toFixed(2)})`,
      };
    },
  },
  {
    id: 'correction-overrides',
    title: 'explicit correction overrides inference',
    rule: 'nothing the model infers may displace a person’s correction',
    run: () => {
      const corrected = correctBelief(MAYA_MODEL.beliefs, 'energy', 'open');
      const after = reviseBelief(corrected, 'energy', 'model tries to firm this back up', 0.99);
      const b = after.find((x) => x.key === 'energy')!;
      const pass = b.firmness === 'open' && b.source === 'corrected' && !/tries to firm/.test(b.value);
      return { pass, detail: pass ? 'revision refused; correction stands' : 'an inference displaced a correction' };
    },
  },
  {
    id: 'temporary-expires',
    title: 'temporary context expires',
    rule: 'exam week is capacity, not personality',
    run: () => {
      const nextWeek = expireForWeek(MAYA_MODEL, 2);
      const pass = nextWeek.thisWeek === undefined && MAYA_MODEL.thisWeek?.mode === 'buried';
      return { pass, detail: pass ? '“buried” lived exactly one week' : 'temporary context leaked into a later week' };
    },
  },
  {
    id: 'travel-window-expires',
    title: 'travel window expires',
    rule: 'away eligibility ends when the window ends; home never rewrites',
    run: () => {
      const during = runMatchmaker(MAYA_MODEL, poolFor('maya'), 2);
      const after = runMatchmaker(MAYA_MODEL, poolFor('maya'), 4);
      const inezDuring = during.evals.find((e) => e.candidate.id === 'inez')!;
      const inezAfter = after.evals.find((e) => e.candidate.id === 'inez')!;
      const pass = inezDuring.eligible && !inezAfter.eligible;
      return { pass, detail: `inside the window: eligible · after it: ${inezAfter.eligible ? 'STILL ELIGIBLE' : 'gone, automatically'}` };
    },
  },
  {
    id: 'privacy-never-leaks',
    title: 'private signal never surfaces',
    rule: 'a private belief may gate; it may never explain',
    run: () => {
      const run = runMatchmaker(PRIYA_MODEL, poolFor('priya'), 1);
      const { internal, public: pub } = explainDecision(run);
      const internalNames = internal.some((l) => /politics/i.test(l));
      const leaked = pub.some((l) => /politic|religion|left|right|agnostic|hindu|christian/i.test(l));
      return {
        pass: internalNames && !leaked,
        detail: internalNames
          ? leaked ? 'a private value reached the public explanation' : 'gated internally on politics; the public account never mentions it'
          : 'scenario did not exercise a private gate',
      };
    },
  },
  {
    id: 'low-confidence-asks',
    title: 'low confidence → ask or abstain',
    rule: 'the system does not act on a coin-flip',
    run: () => {
      const thin = runMatchmaker(MAYA_MODEL, poolFor('maya'), 4);
      const call = actionCall(thin);
      const pass = call.action === 'ask' || call.action === 'abstain';
      return { pass, detail: `thin week resolves to “${call.action}” at confidence ${call.confidence.toFixed(2)}` };
    },
  },
  {
    id: 'abstention',
    title: 'no good match → abstain',
    rule: 'a thin week produces “not this Wednesday”, never a manufactured winner',
    run: () => {
      const run = runMatchmaker(MAYA_MODEL, poolFor('maya'), 4);
      const pass = run.decision.abstained && !run.decision.selected;
      return { pass, detail: pass ? `${run.decision.counts.pool} in, nobody sent` : 'a winner was manufactured from a thin week' };
    },
  },
  {
    id: 'momentum-quiet',
    title: 'strong momentum → no intervention',
    rule: 'the system leaving is a feature, not a failure state',
    run: () => {
      const call = interventionFor('strong');
      return { pass: call.intervention === 'none', detail: call.line };
    },
  },
  {
    id: 'hear-me-out-boundary',
    title: 'hear me out cannot cross a hard boundary',
    rule: 'exploration is a soft-preference privilege only',
    run: () => {
      const run = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const violation = run.evals.some((e) => !e.eligible && e.softViolation);
      const flagged = run.evals.find((e) => e.softViolation);
      return {
        pass: !violation && !!flagged,
        detail: violation ? 'an ineligible candidate was offered for exploration' : `explores only within soft ground (${flagged?.candidate.name})`,
      };
    },
  },
  {
    id: 'question-earns-itself',
    title: 'the question changes the answer',
    rule: 'ask only when some answer moves the decision; inert questions are refused',
    run: () => {
      const askable = ASKABLE.maya;
      const chosen = chooseQuestion(MAYA_MODEL, poolFor('maya'), 1, askable);
      const inert = questionValue(MAYA_MODEL, poolFor('maya'), 1, askable[1]);
      const pass = chosen !== null && chosen.question.key === 'novelty' && chosen.distinctWinners > 1 && inert === 1;
      return { pass, detail: `novelty question yields ${chosen?.distinctWinners ?? 0} possible winners; the inert one yields ${inert}` };
    },
  },
  {
    id: 'retirement-holds',
    title: '“never use that signal” retires the reasoning',
    rule: 'a retired signal stops moving any read, permanently',
    run: () => {
      const retired = { ...MAYA_MODEL, beliefs: retireSignal(MAYA_MODEL.beliefs, 'energy') };
      const before = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const after = runMatchmaker(retired, poolFor('maya'), 1);
      const jBefore = before.evals.find((e) => e.candidate.id === 'jonah')!.aToB;
      const jAfter = after.evals.find((e) => e.candidate.id === 'jonah')!.aToB;
      const consulted = usable(retired.beliefs).some((b) => b.key === 'energy');
      return {
        pass: !consulted && jBefore !== jAfter,
        detail: `the energy read moved from ${jBefore.toFixed(2)} to ${jAfter.toFixed(2)} once the signal stopped being consulted`,
      };
    },
  },
  {
    id: 'counterfactuals-deterministic',
    title: 'what would change this — and only this',
    rule: 'a scenario crosses exactly the boundary it names',
    run: () => {
      const base = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const thu = applyScenario(MAYA_MODEL, poolFor('maya'), 1, 'free-thursday');
      const thuRun = runMatchmaker(thu.model, thu.pool, thu.week);
      const nyc = applyScenario(MAYA_MODEL, poolFor('maya'), 1, 'nyc-window');
      const nycRun = runMatchmaker(nyc.model, nyc.pool, nyc.week);

      const leahBefore = base.evals.find((e) => e.candidate.id === 'leah')!;
      const leahAfter = thuRun.evals.find((e) => e.candidate.id === 'leah')!;
      const inezBefore = base.evals.find((e) => e.candidate.id === 'inez')!;
      const inezAfter = nycRun.evals.find((e) => e.candidate.id === 'inez')!;

      const pass =
        leahBefore.exitedAt === 'schedule' && leahAfter.exitedAt !== 'schedule' &&
        !inezBefore.eligible && inezAfter.eligible;
      return { pass, detail: `thursday frees leah (${leahBefore.exitedAt} → ${leahAfter.exitedAt ?? 'in the running'}); the window admits inez` };
    },
  },
  {
    id: 'venue-breaks-pair-holds',
    title: 'venue failure preserves the pair',
    rule: 'a broken place is never read as a broken match',
    run: () => {
      const l = learningFrom('venue-failed');
      const pass = l.hypothesis !== null && /preserve/.test(l.hypothesis) && l.heldAs === 'hypothesis';
      return { pass, detail: l.hypothesis ?? 'no reading produced' };
    },
  },
  {
    id: 'second-person',
    title: 'a different person gets a different Wednesday',
    rule: 'this is a system, not a prewritten movie',
    run: () => {
      const maya = runMatchmaker(withAnswer(MAYA_MODEL, ASKABLE.maya[0], 1), poolFor('maya'), 1);
      const priyaQ = chooseQuestion(PRIYA_MODEL, poolFor('priya'), 1, ASKABLE.priya);
      const priya = runMatchmaker(withAnswer(PRIYA_MODEL, ASKABLE.priya[0], 2), poolFor('priya'), 1);
      const pass =
        maya.decision.selected?.candidate.id === 'jonah' &&
        priya.decision.selected?.candidate.id === 'theo' &&
        priyaQ !== null && priyaQ.question.key !== 'novelty';
      return {
        pass,
        detail: `maya’s Wednesday: ${maya.decision.selected?.candidate.name ?? '—'} · priya’s: ${priya.decision.selected?.candidate.name ?? '—'} · her question was “${priyaQ?.question.key}”`,
      };
    },
  },
  {
    id: 'deterministic',
    title: 'same inputs, same Wednesday',
    rule: 'the whole run is reproducible byte for byte',
    run: () => {
      const a = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const b = runMatchmaker(MAYA_MODEL, poolFor('maya'), 1);
      const pass = JSON.stringify(a) === JSON.stringify(b);
      return { pass, detail: pass ? 'two runs, one byte stream' : 'nondeterminism detected' };
    },
  },
];

export function runAllEvals(): { case_: EvalCase; result: EvalResult }[] {
  return EVAL_CASES.map((case_) => ({ case_, result: case_.run() }));
}
