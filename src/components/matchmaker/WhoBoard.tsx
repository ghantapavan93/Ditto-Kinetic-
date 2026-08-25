'use client';

import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { MM_COPY, type AskableQuestion } from '@/data/matchmaking';
import type { CandidateEval, RunResult } from '@/lib/matchmaker';

/**
 * WHO — the question that earns its interruption, then the field it moves.
 *
 * The adaptive question is chosen by measurement (see `chooseQuestion`):
 * the surface only ever shows a question whose answers produce different
 * Wednesdays, and says so. The candidate rail draws both directions of
 * every read — A→B and B→A as separate bars meeting at the harmonic join —
 * because one score can hide two completely different dates. The
 * clone↔surprise slider is labelled for what it is: an explanatory
 * instrument for one term of the read, keyboard-operable, not a production
 * control.
 */

function DirectionBars({ e }: { e: CandidateEval }) {
  return (
    <div className="mt-2 grid gap-1">
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 font-mono text-[0.5rem] uppercase text-paper/55">a → b</span>
        <span className="relative block h-[4px] flex-1 rounded-full bg-paper/10">
          <span className="absolute inset-y-0 left-0 rounded-full bg-tungsten/80" style={{ width: `${e.aToB * 100}%` }} />
        </span>
        <span className="w-8 shrink-0 text-right font-mono text-[0.55rem] tabular-nums text-paper/62">{e.aToB.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 font-mono text-[0.5rem] uppercase text-paper/55">b → a</span>
        <span className="relative block h-[4px] flex-1 rounded-full bg-paper/10">
          <span className="absolute inset-y-0 left-0 rounded-full bg-cobalt-glow/80" style={{ width: `${e.bToA * 100}%` }} />
        </span>
        <span className="w-8 shrink-0 text-right font-mono text-[0.55rem] tabular-nums text-paper/62">{e.bToA.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 font-mono text-[0.5rem] uppercase text-mint">joins</span>
        <span className="relative block h-[4px] flex-1 rounded-full bg-paper/10">
          <span className="absolute inset-y-0 left-0 rounded-full bg-mint/80" style={{ width: `${e.reciprocal * 100}%` }} />
        </span>
        <span className="w-8 shrink-0 text-right font-mono text-[0.55rem] tabular-nums text-mint">{e.reciprocal.toFixed(2)}</span>
      </div>
    </div>
  );
}

const FRICTION_SAYS: Record<CandidateEval['frictionRead'], string> = {
  easy: 'easy to get to',
  'a-little-far': 'a little far this week',
  heavy: 'the journey outweighs the evening',
};

export function WhoBoard({
  run,
  question,
  answered,
  onAnswer,
  bias,
  onBias,
  windowOpen,
  onToggleWindow,
}: {
  run: RunResult;
  question: { question: AskableQuestion; distinctWinners: number } | null;
  answered: number | null;
  onAnswer: (index: number) => void;
  bias: number;
  onBias: (value: number) => void;
  windowOpen: boolean;
  onToggleWindow: () => void;
}) {
  const inPlay = run.evals.filter((e) => e.eligible);
  const ranked = [...inPlay].sort((a, b) => b.reciprocal - a.reciprocal);

  return (
    <div>
      {/* the one question */}
      {question && (
        <div className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-5 py-4">
          <p className="font-editorial text-[0.72rem] lowercase text-paper/62">{MM_COPY.question.setup}</p>
          <p className="mt-3 font-voice text-[clamp(1.15rem,2.6vw,1.5rem)] italic leading-snug text-paper">
            {question.question.prompt}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {question.question.options.map((o, i) => (
              <button
                key={o.label}
                onClick={() => onAnswer(i)}
                aria-pressed={answered === i}
                className={`min-h-[44px] border px-4 py-2 font-mono text-micro uppercase transition-colors ${
                  answered === i ? 'border-acid text-acid' : 'border-paper/25 text-paper/80 hover:border-paper/60 hover:text-paper'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {answered !== null && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 font-display text-[1rem] uppercase text-mint">
              {MM_COPY.question.done}
            </motion.p>
          )}
          <p className="mt-2 font-editorial text-[0.68rem] lowercase text-paper/55">{MM_COPY.question.measured}</p>
        </div>
      )}

      {/* the field */}
      <div className="mt-8">
        <p className="max-w-[30ch] font-display text-[clamp(1.3rem,3.2vw,2rem)] uppercase leading-[0.95] text-paper">
          {MM_COPY.who.mutualLine}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="mm-bias" className="font-mono text-micro uppercase text-paper/62">{MM_COPY.who.clone}</label>
          <input
            id="mm-bias"
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={bias}
            onChange={(e) => onBias(Number(e.target.value))}
            className="h-1 w-56 max-w-full accent-tungsten"
            aria-label="similarity to surprise, explanatory instrument"
          />
          <span className="font-mono text-micro uppercase text-paper/62">{MM_COPY.who.surprise}</span>
        </div>
        <p className="mt-1.5 font-editorial text-[0.68rem] lowercase text-paper/55">{MM_COPY.who.sliderNote}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ranked.map((e, i) => (
            <motion.div
              key={e.candidate.id}
              layout
              transition={{ duration: 0.5, ease: EASE.settle }}
              className={`rounded-artifact border px-4 py-3.5 ${
                i === 0 && !e.exitedAt ? 'border-mint/35 bg-mint/[0.05]' : 'border-paper/12 bg-paper/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */}
                <img src={e.candidate.photo} alt="" className="h-12 w-12 shrink-0 rounded-[2px] object-cover opacity-85 saturate-[0.8]" />
                <div className="min-w-0">
                  <p className="font-editorial text-[0.92rem] text-paper">{e.candidate.name}
                    <span className="ml-2 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-paper/55">{e.candidate.year}</span>
                  </p>
                  <p className="truncate font-voice text-[0.85rem] italic text-paper/62">{e.candidate.line}</p>
                </div>
              </div>
              <DirectionBars e={e} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-paper/62">
                  {e.candidate.travel.minutes} min · {e.candidate.travel.transfers} transfers
                </span>
                <span className={`font-editorial text-[0.68rem] lowercase ${e.frictionRead === 'heavy' ? 'text-acid' : 'text-paper/62'}`}>
                  {FRICTION_SAYS[e.frictionRead]}
                </span>
                {e.exitedAt && <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-tungsten">held · {e.exitedAt}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 font-editorial text-[0.8rem] lowercase text-paper/62">{MM_COPY.who.frictionLine}</p>

        {/* the travel window */}
        <div className="mt-5 rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">away window · from “where u going next”</p>
              <p className="mt-1 font-editorial text-[0.85rem] text-paper/80">New York · weeks 2–3 · opted in</p>
            </div>
            <button
              onClick={onToggleWindow}
              aria-pressed={windowOpen}
              className={`min-h-[44px] border px-4 py-2 font-mono text-micro uppercase transition-colors ${
                windowOpen ? 'border-mint/60 text-mint' : 'border-paper/25 text-paper/80 hover:border-paper/60 hover:text-paper'
              }`}
            >
              {windowOpen ? 'window active' : 'step into the window'}
            </button>
          </div>
          <p className="mt-2 font-editorial text-[0.68rem] lowercase text-paper/55">{MM_COPY.who.windowLine}</p>
        </div>
      </div>
    </div>
  );
}
