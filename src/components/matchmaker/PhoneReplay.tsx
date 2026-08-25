'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { FLOW_STEPS, MM_COPY, type FlowStep } from '@/data/matchmaking';

/**
 * The observed onboarding, replayed inside a phone.
 *
 * A few representative questions are actually answerable; the rest arrive
 * as a fast stack, because the point is not to make a reviewer re-type a
 * signup — it is to make the volume of surrendered information physical.
 * Every card carries its provenance chip: OBSERVED for what the live flow
 * asked, PROPOSED for this concept's additions. Nothing here pixel-copies
 * a private screen; it is a reconstruction, and it says so.
 */
export function PhoneReplay({
  mode,
  onDone,
}: {
  /** 'replay' walks the interactive beats; 'skip' goes straight to speed. */
  mode: 'replay' | 'skip';
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const interactive = useMemo(() => FLOW_STEPS.filter((s) => s.interactive), []);
  const rest = useMemo(() => FLOW_STEPS.filter((s) => !s.interactive), []);

  type Beat = { kind: 'ask'; index: number } | { kind: 'stack' } | { kind: 'finding' } | { kind: 'payoff'; line: number };
  const [beat, setBeat] = useState<Beat>(mode === 'replay' ? { kind: 'ask', index: 0 } : { kind: 'stack' });
  const [picked, setPicked] = useState<Record<string, string>>({});

  const advance = (from: Beat) => {
    if (from.kind === 'ask') {
      const next = from.index + 1;
      setBeat(next < interactive.length ? { kind: 'ask', index: next } : { kind: 'stack' });
    }
  };

  useEffect(() => {
    if (beat.kind === 'stack') {
      const t = setTimeout(() => setBeat({ kind: 'finding' }), reduced ? 400 : rest.length * 90 + 900);
      return () => clearTimeout(t);
    }
    if (beat.kind === 'finding') {
      const t = setTimeout(() => setBeat({ kind: 'payoff', line: 0 }), reduced ? 500 : 1700);
      return () => clearTimeout(t);
    }
    if (beat.kind === 'payoff') {
      if (beat.line < 2) {
        const t = setTimeout(() => setBeat({ kind: 'payoff', line: beat.line + 1 }), reduced ? 350 : 1350);
        return () => clearTimeout(t);
      }
      const t = setTimeout(onDone, reduced ? 400 : 1500);
      return () => clearTimeout(t);
    }
  }, [beat, onDone, reduced, rest.length]);

  const step: FlowStep | null = beat.kind === 'ask' ? interactive[beat.index] : null;

  return (
    <motion.div
      className="relative mx-auto flex h-[min(78vh,760px)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[2.6rem] border-[9px] border-ink bg-ink-soft"
      style={{ boxShadow: 'inset 0 1px 0 rgba(244,237,228,0.12), inset 0 0 50px rgba(0,0,0,0.5), 0 30px 70px rgba(0,0,0,0.55)' }}
      initial={false}
      animate={beat.kind === 'payoff' ? { rotateX: 8, scale: 0.96, opacity: 0.9 } : { rotateX: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE.settle }}
    >
      {/* status bar */}
      <div aria-hidden className="relative h-[30px] shrink-0">
        <div className="absolute left-1/2 top-[5px] h-[20px] w-[96px] -translate-x-1/2 rounded-full bg-ink" />
        <div className="flex items-center justify-between px-5 pt-[9px]">
          <span className="font-mono text-[0.55rem] tabular-nums text-paper/62">7:00</span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-paper/62">{MM_COPY.cold.label}</span>
        </div>
      </div>

      {/* flow header, as observed: title, back arrow, progress segments */}
      <div className="shrink-0 px-5 pb-2 pt-1">
        <p className="text-center font-voice text-[1.05rem] text-paper/85">{MM_COPY.phone.header}</p>
        <div aria-hidden className="mt-2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[2px] flex-1 rounded-full bg-paper/25" />
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <AnimatePresence mode="wait">
          {step && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE.settle }}
              className="pt-2"
            >
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.26em] text-paper/55">{MM_COPY.phone.sender}</p>
              <p className="mt-1.5 w-fit rounded-[1.1rem] rounded-bl-md bg-paper-bright px-4 py-2.5 font-editorial text-[0.95rem] text-ink">
                {step.prompt} {step.bold && <strong className="font-semibold">{step.bold}</strong>}?
              </p>
              <span className={`mt-2 inline-block rounded-[2px] px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] ${step.kind === 'observed' ? 'bg-paper/10 text-paper/62' : 'bg-mint/15 text-mint'}`}>
                {step.kind}
              </span>
              {step.privacy && (
                <p className="mt-2 text-right font-mono text-[0.55rem] uppercase tracking-[0.12em] text-paper/55">🔒 {step.privacy}</p>
              )}

              <div className="mt-4 flex flex-col items-end gap-2.5">
                {(step.options ?? ['New York']).map((o) => {
                  const chosen = picked[step.id] === o;
                  return (
                    <button
                      key={o}
                      onClick={() => {
                        setPicked((p) => ({ ...p, [step.id]: o }));
                        setTimeout(() => advance(beat), 340);
                      }}
                      className={`min-h-[44px] w-[78%] rounded-[1.4rem] border px-4 py-2.5 text-left font-editorial text-[0.9rem] backdrop-blur-sm transition-colors ${
                        chosen ? 'border-cobalt-glow/60 bg-cobalt/60 text-paper-bright' : 'border-paper/20 bg-paper/[0.07] text-paper/85 hover:border-paper/45'
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {step.note && <p className="mt-3 font-editorial text-[0.7rem] lowercase text-paper/55">{step.note}</p>}
            </motion.div>
          )}

          {beat.kind === 'stack' && (
            <motion.div key="stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
              <p className="font-editorial text-[0.72rem] lowercase text-paper/55">{MM_COPY.phone.accelNote}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {rest.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={reduced ? false : { opacity: 0, x: 26 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduced ? 0 : i * 0.09, duration: 0.3, ease: EASE.settle }}
                    className="flex items-center justify-between gap-2 rounded-artifact border border-paper/10 bg-paper/[0.03] px-3 py-1.5"
                  >
                    <span className="truncate font-editorial text-[0.78rem] lowercase text-paper/80">
                      {s.prompt} <strong>{s.bold}</strong>
                    </span>
                    <span className={`shrink-0 font-mono text-[0.5rem] uppercase tracking-[0.14em] ${s.kind === 'observed' ? 'text-paper/55' : 'text-mint'}`}>
                      {s.privacy ? '🔒 ' : ''}{s.kind}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {beat.kind === 'finding' && (
            <motion.div
              key="finding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center gap-3 pt-10"
            >
              <motion.span
                aria-hidden
                className="block h-2 w-2 rounded-full bg-paper/70"
                animate={reduced ? {} : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p className="font-voice text-[1.15rem] italic text-paper/85">{MM_COPY.phone.finding}</p>
            </motion.div>
          )}

          {beat.kind === 'payoff' && (
            <motion.div key="payoff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-start justify-center gap-5 pt-6">
              {[MM_COPY.payoff.a, MM_COPY.payoff.b, MM_COPY.payoff.c].slice(0, beat.line + 1).map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE.settle }}
                  className={`font-display uppercase leading-[0.95] ${i === 2 ? 'text-[1.5rem] text-acid' : 'text-[1.35rem] text-paper'}`}
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div aria-hidden className="absolute bottom-[7px] left-1/2 h-[3px] w-[100px] -translate-x-1/2 rounded-full bg-paper/20" />
    </motion.div>
  );
}
