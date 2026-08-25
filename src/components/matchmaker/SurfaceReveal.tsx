'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { FLOW_STEPS, MM_COPY, type AskableQuestion } from '@/data/matchmaking';
import type { RunResult } from '@/lib/matchmaker';

/**
 * The magic reveal — the consumer's whole first minute, compressed.
 *
 * Twenty-four answers accumulate as cards. Then almost all of them fall
 * away, because they were answers the system already had. What is left is
 * the one uncertainty worth an interruption; the question appears, the
 * answer physically reorders the field, SNAP, found someone. Everything
 * else the page knows — travel windows, retirement, held-back reasons,
 * the trace — stays one glass-pull away and never interrupts this line.
 */

type Beat = 'accumulate' | 'fall' | 'claim' | 'question' | 'snap' | 'found';

export function SurfaceReveal({
  run,
  question,
  answered,
  onAnswer,
  onOpen,
}: {
  run: RunResult;
  question: { question: AskableQuestion; distinctWinners: number } | null;
  answered: number | null;
  onAnswer: (i: number) => void;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<Beat>('accumulate');

  useEffect(() => {
    if (beat === 'accumulate') {
      const t = setTimeout(() => setBeat('fall'), reduced ? 300 : 2100);
      return () => clearTimeout(t);
    }
    if (beat === 'fall') {
      const t = setTimeout(() => setBeat('claim'), reduced ? 300 : 1900);
      return () => clearTimeout(t);
    }
    if (beat === 'claim') {
      const t = setTimeout(() => setBeat('question'), reduced ? 400 : 2600);
      return () => clearTimeout(t);
    }
    if (beat === 'question' && answered !== null) {
      const t = setTimeout(() => setBeat('snap'), 350);
      return () => clearTimeout(t);
    }
    if (beat === 'snap') {
      const t = setTimeout(() => setBeat('found'), reduced ? 500 : 2100);
      return () => clearTimeout(t);
    }
  }, [beat, answered, reduced]);

  /** The cards that fall are the ones the engine did not need to ask about. */
  const falling = useMemo(() => FLOW_STEPS.filter((s) => s.id !== 'this-week'), []);
  const ranked = useMemo(
    () => run.evals.filter((e) => e.eligible && !e.exitedAt).sort((a, b) => b.reciprocal - a.reciprocal).slice(0, 3),
    [run],
  );
  const winner = ranked[0];

  return (
    <div className="relative min-h-[58vh]">
      {/* the answers, held — then let go */}
      <AnimatePresence>
        {(beat === 'accumulate' || beat === 'fall') && (
          <motion.div key="cards" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.surface.accumulate}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {falling.map((s, i) => (
                <motion.span
                  key={s.id}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: -14 }}
                  animate={
                    beat === 'fall'
                      ? { opacity: 0, y: 60, rotate: (i % 5) - 2, transition: { delay: (i % 9) * 0.07, duration: 0.6, ease: EASE.exit } }
                      : { opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: EASE.settle } }
                  }
                  className="rounded-artifact border border-paper/15 bg-paper/[0.03] px-2.5 py-1 font-editorial text-[0.68rem] lowercase text-paper/70"
                >
                  {s.bold ?? s.id}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the claim */}
      <AnimatePresence>
        {beat === 'claim' && (
          <motion.div key="claim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <p className="font-display text-[clamp(1.8rem,5.5vw,3.4rem)] uppercase leading-[0.92] text-paper">
              {MM_COPY.surface.moreDataA}
              <br />
              {MM_COPY.surface.moreDataB}
              <br />
              {MM_COPY.surface.moreDataC}
            </p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 1.1, duration: 0.5, ease: EASE.settle }}
              className="mt-5 font-display text-[clamp(1.2rem,3.4vw,2rem)] uppercase leading-[0.95] text-acid"
            >
              {MM_COPY.surface.askA}
              <br />
              {MM_COPY.surface.askB}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the one question */}
      <AnimatePresence>
        {(beat === 'question' || beat === 'snap' || beat === 'found') && question && (
          <motion.div key="q" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE.settle }}>
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-tungsten">{MM_COPY.surface.oneLeft}</p>
            <p className="mt-3 max-w-[34ch] font-voice text-[clamp(1.3rem,3vw,1.9rem)] italic leading-snug text-paper">
              {question.question.prompt}
            </p>
            {beat === 'question' && (
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
            )}

            {/* the field, physically moved */}
            {(beat === 'snap' || beat === 'found') && (
              <div className="mt-6">
                <div className="grid max-w-[26rem] gap-2">
                  {ranked.map((e, i) => (
                    <motion.div
                      key={e.candidate.id}
                      layout
                      animate={i === 0 ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ layout: { duration: 0.6, ease: EASE.settle }, scale: { duration: 0.5, ease: EASE.snap } }}
                      className={`flex items-center gap-3 rounded-artifact border px-3 py-2 ${
                        i === 0 ? 'border-mint/40 bg-mint/[0.06]' : 'border-paper/12 bg-paper/[0.02] opacity-70'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */}
                      <img src={e.candidate.photo} alt="" className="h-9 w-9 rounded-[2px] object-cover" />
                      <span className="font-editorial text-[0.88rem] text-paper">{e.candidate.name}</span>
                      <span className="ml-auto font-mono text-[0.6rem] tabular-nums text-mint">{e.reciprocal.toFixed(2)}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.35, ease: EASE.snap }}
                  className="mt-4 font-display text-[1.3rem] uppercase text-acid"
                >
                  {MM_COPY.surface.snap}
                </motion.p>
              </div>
            )}

            {/* found someone → the ask → open */}
            {beat === 'found' && winner && (
              <motion.div key="found" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE.settle }} className="mt-8">
                <p className="w-fit rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-editorial text-lede font-medium text-paper-bright shadow-lift">
                  {MM_COPY.bridge.found}
                </p>
                <p className="mt-5 font-display text-[clamp(1.8rem,5.5vw,3.4rem)] uppercase leading-[0.9] text-paper">
                  {run.model.name} <span className="text-acid">×</span> {winner.candidate.name}
                </p>
                <p className="mt-4 font-voice text-[clamp(1.2rem,2.8vw,1.7rem)] italic text-paper/85">{MM_COPY.bridge.ask}</p>
                <button
                  onClick={onOpen}
                  data-cursor="into the room"
                  className="u-sheen mt-5 min-h-[44px] border border-acid bg-acid px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-transparent hover:text-acid"
                >
                  {MM_COPY.bridge.cta}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
