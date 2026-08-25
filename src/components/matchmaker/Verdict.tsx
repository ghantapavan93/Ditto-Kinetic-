'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { MM_COPY } from '@/data/matchmaking';
import { learningFrom, interventionFor, type Outcome, type RunResult, type Scenario } from '@/lib/matchmaker';

/**
 * WHY / WHY NOT, then WEDNESDAY.
 *
 * The system explains its holds with the same seriousness as its pick, and
 * every held-back envelope answers "what would change this?" with a real
 * counterfactual — the same engine, one named signal moved, before and
 * after shown honestly (sometimes crossing one boundary only reveals the
 * next one, and the surface says so rather than pretending a SNAP).
 *
 * The hear-me-out card carries the third option that matters: "never use
 * that signal" rejects the reasoning rather than the person, and the
 * retirement is permanent, engine-enforced, eval-proven.
 */

const OUTCOMES: { key: Outcome; label: string }[] = [
  { key: 'they-extended-the-evening', label: 'they extended the evening' },
  { key: 'both-want-another', label: 'both want another' },
  { key: 'venue-failed', label: 'the venue failed' },
  { key: 'rejected-recommendation-not-person', label: 'rejected the reasoning, not the person' },
];

export function Verdict({
  run,
  thinWeek,
  onToggleThinWeek,
  onScenario,
  scenarioNote,
  onHearMeOut,
}: {
  run: RunResult;
  thinWeek: boolean;
  onToggleThinWeek: () => void;
  onScenario: (s: Scenario) => void;
  scenarioNote: string | null;
  onHearMeOut: (choice: 'trust' | 'not-now' | 'never') => void;
}) {
  const [changing, setChanging] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const selected = run.decision.selected;
  const hearMeOut = run.evals.find((e) => e.softViolation && !e.exitedAt);

  return (
    <div>
      {/* wednesday itself */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onToggleThinWeek}
          aria-pressed={thinWeek}
          className={`min-h-[44px] border px-4 py-2 font-mono text-micro uppercase transition-colors ${
            thinWeek ? 'border-acid text-acid' : 'border-paper/25 text-paper/80 hover:border-paper/60 hover:text-paper'
          }`}
        >
          {thinWeek ? MM_COPY.wednesday.normal : MM_COPY.wednesday.thin}
        </button>
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-paper/55">week {run.week}</span>
      </div>

      <AnimatePresence mode="wait">
        {run.decision.abstained ? (
          <motion.div
            key="abstain"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE.settle }}
            className="mt-5 border-l-2 border-acid pl-5"
          >
            <p className="font-display text-[clamp(1.6rem,4.5vw,2.6rem)] uppercase leading-[0.92] text-paper">
              {MM_COPY.wednesday.abstainA}
            </p>
            <p className="mt-3 max-w-[36ch] font-voice text-[clamp(1rem,2.3vw,1.3rem)] italic leading-snug text-paper/80">
              {MM_COPY.wednesday.abstainB}
            </p>
            <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper/55">
              {run.decision.counts.pool} in · {run.decision.counts.eligible} eligible · {run.decision.counts.mutual} mutual · {run.decision.counts.scheduled} share an hour · 0 sent
            </p>
          </motion.div>
        ) : (
          <motion.div key="picked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE.settle }} className="mt-5">
            {/* selected */}
            {selected && (
              <div className="rounded-artifact border border-mint/35 bg-mint/[0.05] px-5 py-4">
                <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-mint">{MM_COPY.whyNot.selected}</p>
                <div className="mt-2 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */}
                  <img src={selected.candidate.photo} alt="" className="h-16 w-16 shrink-0 rounded-[2px] object-cover" />
                  <div>
                    <p className="font-display text-[1.4rem] uppercase leading-none text-paper">{selected.candidate.name}</p>
                    <p className="mt-1.5 font-editorial text-[0.78rem] lowercase text-paper/70">
                      {MM_COPY.selectedLine}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* hear me out */}
            {hearMeOut && (
              <div className="mt-4 rounded-artifact border border-tungsten/40 bg-paper/[0.02] px-5 py-4">
                <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-tungsten">{MM_COPY.whyNot.hearMeOut}</p>
                <p className="mt-2 max-w-[52ch] font-voice text-[0.98rem] italic leading-snug text-paper/85">{MM_COPY.whyNot.hearBody}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onHearMeOut('trust')} className="min-h-[44px] border border-mint/50 px-4 py-2 font-mono text-micro uppercase text-mint transition-colors hover:bg-mint hover:text-ink">{MM_COPY.whyNot.trust}</button>
                  <button onClick={() => onHearMeOut('not-now')} className="min-h-[44px] border border-paper/25 px-4 py-2 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60">{MM_COPY.whyNot.notNow}</button>
                  <button onClick={() => onHearMeOut('never')} className="min-h-[44px] border border-acid/50 px-4 py-2 font-mono text-micro uppercase text-acid transition-colors hover:bg-acid hover:text-ink">{MM_COPY.whyNot.never}</button>
                </div>
                <p className="mt-2 font-editorial text-[0.68rem] lowercase text-paper/55">{MM_COPY.hearFootnote}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* held back */}
      <div className="mt-6">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.whyNot.heldBack}</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {run.decision.heldBack.map((e) => (
            <div key={e.candidate.id} className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-editorial text-[0.9rem] text-paper/85">{e.candidate.name}</p>
                <button
                  onClick={() => setChanging((c) => (c === e.candidate.id ? null : e.candidate.id))}
                  className="py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-tungsten underline-offset-4 hover:underline"
                >
                  {MM_COPY.whyNot.change}
                </button>
              </div>
              <p className="mt-1 font-voice text-[0.88rem] italic text-paper/70">{e.heldBack}</p>

              <AnimatePresence>
                {changing === e.candidate.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 border-t border-paper/10 pt-3 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-paper/62">
                      <p>mutuality · {e.reciprocal.toFixed(2)} {e.reciprocal >= 0.55 ? '· strong' : '· under the bar'}</p>
                      <p className="mt-1">schedule · {e.scheduleFit ? 'shares an hour' : 'none this week'}</p>
                      <p className="mt-1">friction · {e.frictionRead}</p>
                      <p className="mt-1">first hour · {e.sceneViable ? 'viable' : 'not this week'}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.candidate.id === 'leah' && (
                        <button onClick={() => onScenario('free-thursday')} className="min-h-[44px] border border-paper/25 px-3 py-1.5 font-mono text-[0.6rem] uppercase text-paper/80 hover:border-tungsten/60 hover:text-tungsten">thursday frees up</button>
                      )}
                      {e.candidate.id === 'rosa' && (
                        <button onClick={() => onScenario('ease-the-week')} className="min-h-[44px] border border-paper/25 px-3 py-1.5 font-mono text-[0.6rem] uppercase text-paper/80 hover:border-tungsten/60 hover:text-tungsten">the week eases</button>
                      )}
                      {e.candidate.id === 'inez' && (
                        <button onClick={() => onScenario('nyc-window')} className="min-h-[44px] border border-paper/25 px-3 py-1.5 font-mono text-[0.6rem] uppercase text-paper/80 hover:border-tungsten/60 hover:text-tungsten">the window opens</button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {scenarioNote && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 border-l-2 border-tungsten pl-3 font-editorial text-[0.8rem] lowercase text-paper/80">
            {scenarioNote}
          </motion.p>
        )}
      </div>

      {/* after — outcomes become hypotheses, then the system leaves */}
      <div className="mt-8 border-t border-paper/[0.09] pt-5">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.after.eyebrow}</p>
        <p className="mt-2 font-editorial text-[0.8rem] lowercase text-paper/70">{MM_COPY.after.line}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              onClick={() => setOutcome(o.key)}
              aria-pressed={outcome === o.key}
              className={`min-h-[44px] border px-3 py-1.5 font-mono text-[0.6rem] uppercase transition-colors ${
                outcome === o.key ? 'border-tungsten text-tungsten' : 'border-paper/25 text-paper/70 hover:border-paper/60'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {outcome && (
          <motion.p key={outcome} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 max-w-[52ch] font-voice text-[0.95rem] italic text-paper/80">
            possible learning: {learningFrom(outcome).hypothesis ?? 'nothing yet — one evening is one evening.'}
          </motion.p>
        )}
        <p className="mt-4 font-editorial text-[0.8rem] lowercase text-paper/70">{MM_COPY.after.momentum}</p>
        <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-mint">
          intervention · none — {interventionFor('strong').line}
        </p>
      </div>
    </div>
  );
}
