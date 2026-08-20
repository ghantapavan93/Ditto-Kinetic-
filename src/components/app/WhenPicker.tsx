'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DROP_DAY, label, readSchedule, type Window } from '@/lib/schedule';
import type { Person } from '@/lib/types';

/** The strip runs 11am to midnight — the only hours anybody offers. */
const DAY_START = 11 * 60;
const DAY_END = 24 * 60;
const span = (min: number) => ((min - DAY_START) / (DAY_END - DAY_START)) * 100;

/**
 * When, as opposed to whether.
 *
 * A scheduler that finds the hours two people are both unbooked has answered a
 * question adjacent to the one that matters. The window everybody is free in is
 * frequently the window nobody is any good in — a Sunday afternoon that runs
 * seven hours because neither of them has anything on, which is also why neither
 * of them will bring much to it.
 *
 * So both readings are drawn at once and the disagreement is the display. The
 * longest bar and the brightest bar are usually not the same bar, and once you
 * have seen that you cannot go back to sorting by overlap.
 *
 * Bar length is duration and bar brightness is joint energy, which is the pairing
 * that makes the point without a legend: the biggest thing on the screen being
 * the dimmest is the entire argument.
 */
export function WhenPicker({ a, b }: { a: Person; b: Person }) {
  const read = useMemo(() => readSchedule(a, b), [a, b]);
  const [picked, setPicked] = useState<Window | null>(null);
  const shown = picked ?? read.best;

  return (
    <section aria-label="When they are both actually free" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-paper/35">
          when
        </p>
        <p className="font-editorial text-[0.68rem] lowercase tracking-wide text-paper/25">
          {read.windows.length} shared windows
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        {read.windows.map((w) => {
          const isBest = w === read.best;
          const isLongest = w === read.longest;
          const active = shown === w;

          return (
            <button
              key={`${w.day}-${w.startMin}`}
              onClick={() => setPicked(w)}
              data-cursor="this hour"
              className="group block w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`font-editorial text-[0.72rem] lowercase tracking-wide transition-colors ${
                    active ? 'text-paper' : 'text-paper/45 group-hover:text-paper/80'
                  }`}
                >
                  {label(w)}
                </span>
                <span className="shrink-0 font-mono text-[0.58rem] tabular-nums text-paper/30">
                  {Math.round(w.minutes / 60)}h
                </span>
              </div>

              {/* length is duration, brightness is joint energy */}
              <div className="relative mt-1 h-[7px] w-full rounded-[2px] bg-paper/[0.06]">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-y-0 block rounded-[2px]"
                  style={{
                    left: `${span(w.startMin)}%`,
                    width: `${span(w.endMin) - span(w.startMin)}%`,
                    background: isBest ? '#2FD8A8' : '#F4EDE4',
                    opacity: 0.14 + w.jointEnergy * 0.72,
                  }}
                />
                {w.day === DROP_DAY && (
                  <span
                    aria-hidden
                    className="absolute -top-1 bottom-[-0.25rem] w-px bg-acid/70"
                    style={{ left: `${span(19 * 60)}%` }}
                  />
                )}
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[0.56rem] uppercase tracking-[0.12em]">
                <span className="text-paper/30">energy {w.jointEnergy.toFixed(2)}</span>
                {isBest && <span className="text-mint/70">best hour</span>}
                {isLongest && !isBest && <span className="text-acid/70">longest, and worst</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* the finding */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={read.disagree ? 'disagree' : 'agree'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-4 border-t border-paper/10 pt-3"
        >
          {read.disagree && read.longest && read.best ? (
            <p className="font-voice text-[1rem] leading-snug text-paper/80">
              the longest window is {read.longest.dayName} —{' '}
              {Math.round(read.longest.minutes / 60)} hours. it is also the worst hour on
              the board. they are both free because neither of them has anything on.
            </p>
          ) : (
            <p className="font-voice text-[1rem] leading-snug text-paper/70">
              the longest window is also the best one. that is the easy case, and it is not
              the usual one.
            </p>
          )}

          {/*
            What the drop day costs. Wednesday is a product decision, not a
            scheduling one, and scoring it against the rest of the week is the
            only way to see the price of it.
          */}
          {read.dropDayCost !== null && read.dropDayCost > 0.001 && read.onDropDay && (
            <p className="mt-3 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-acid/75">
              holding it to wednesday costs {read.dropDayCost.toFixed(2)} of joint energy —{' '}
              {label(read.onDropDay)} instead of {read.best && label(read.best)}.
            </p>
          )}
          {read.dropDayCost === 0 && (
            <p className="mt-3 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-mint/70">
              wednesday is genuinely their best hour. nothing is being given up.
            </p>
          )}
          {read.dropDayCost === null && (
            <p className="mt-3 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-acid/75">
              they share no hour at all on wednesday.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
