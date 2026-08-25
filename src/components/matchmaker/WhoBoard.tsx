'use client';

import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { MM_COPY } from '@/data/matchmaking';
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

const FRICTION_SAYS = MM_COPY.friction;

/**
 * The two fields, drawn. Two people are two preference landscapes; what a
 * single score erases, two translucent fields and their lens restore. The
 * lens is sized by the harmonic join — a one-sided pair renders as two
 * big circles with almost nothing between them, which is the argument.
 */
function FieldOverlap({ e, seeker }: { e: CandidateEval; seeker: string }) {
  const spread = 46 - e.reciprocal * 26; // weaker join → circles further apart
  const cxA = 50 - spread / 2;
  const cxB = 50 + spread / 2;
  const rA = 16 + e.aToB * 14;
  const rB = 16 + e.bToA * 14;
  return (
    <div className="relative mx-auto mt-5 max-w-[30rem]">
      <svg viewBox="0 0 100 56" className="w-full" role="img" aria-label={`${seeker} and ${e.candidate.name}: two reads, one intersection`}>
        <defs>
          <clipPath id="mm-lens">
            <circle cx={cxA} cy={28} r={rA} />
          </clipPath>
        </defs>
        <circle cx={cxA} cy={28} r={rA} fill="#FFB865" fillOpacity="0.13" stroke="#FFB865" strokeOpacity="0.55" strokeWidth="0.4" />
        <circle cx={cxB} cy={28} r={rB} fill="#6E7BFF" fillOpacity="0.13" stroke="#6E7BFF" strokeOpacity="0.55" strokeWidth="0.4" />
        <g clipPath="url(#mm-lens)">
          <circle cx={cxB} cy={28} r={rB} fill="#5FE3AE" fillOpacity="0.28" stroke="#5FE3AE" strokeOpacity="0.9" strokeWidth="0.5" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <div className="text-left">
          <p className="font-editorial text-[0.8rem] text-paper">{seeker}</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-tungsten">{e.aToB.toFixed(2)}</p>
        </div>
        <p className="mt-16 font-mono text-[0.52rem] uppercase tracking-[0.18em] text-mint">{MM_COPY.fields.intersection} · {e.reciprocal.toFixed(2)}</p>
        <div className="text-right">
          <p className="font-editorial text-[0.8rem] text-paper">{e.candidate.name}</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-cobalt-glow">{e.bToA.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export function WhoBoard({
  run,
  bias,
  onBias,
  windowOpen,
  onToggleWindow,
}: {
  run: RunResult;
  bias: number;
  onBias: (value: number) => void;
  windowOpen: boolean;
  onToggleWindow: () => void;
}) {
  const inPlay = run.evals.filter((e) => e.eligible);
  const ranked = [...inPlay].sort((a, b) => b.reciprocal - a.reciprocal);

  return (
    <div>
      {/* the field */}
      <div className="mt-8">
        <p className="max-w-[30ch] font-display text-[clamp(1.3rem,3.2vw,2rem)] uppercase leading-[0.95] text-paper">
          {MM_COPY.who.mutualLine}
        </p>

        {ranked[0] && <FieldOverlap e={ranked[0]} seeker={run.model.name} />}

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
              /*
                The snap. When the field reorders, the incoming winner lands
                with the site's snap ease rather than drifting into place —
                a decision should feel like one.
              */
              animate={i === 0 && !e.exitedAt ? { scale: [1, 1.045, 1] } : { scale: 1 }}
              transition={{ layout: { duration: 0.5, ease: EASE.settle }, scale: { duration: 0.45, ease: EASE.snap } }}
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
