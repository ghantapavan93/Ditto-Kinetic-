'use client';

import { motion } from 'framer-motion';
import type { Phase } from '@/lib/types';

/**
 * The journey rail.
 *
 * The previous build was one screen that happened to have several states, and
 * it read that way — you could not tell there was anything past the stage. This
 * is the smallest thing that fixes it: four stops, a filled dot for where you
 * are, hollow for what is still ahead.
 *
 * Not a navigation bar. You cannot click it, because the product does not let
 * you skip to the date — the whole argument is that the plan has to be earned
 * in order. It only tells you the shape of what is coming.
 *
 * On narrow screens it collapses to `02 / 04`, which carries the same fact in
 * the space available.
 */

const STOPS: { key: string; label: string; phases: Phase[] }[] = [
  { key: 'match', label: 'match', phases: ['intro'] },
  { key: 'scene', label: 'scene', phases: ['exploring', 'selected', 'reasoning', 'decision'] },
  { key: 'date', label: 'date', phases: ['handoff', 'quiet'] },
  { key: 'after', label: 'after', phases: ['post-date', 'memory'] },
];

export function JourneyRail({ phase }: { phase: Phase }) {
  const activeIndex = Math.max(
    0,
    STOPS.findIndex((s) => s.phases.includes(phase)),
  );

  return (
    <>
      {/*
        A horizontal rail, centred under the header.

        The first version ran down the left edge and printed straight through
        the scene copy, which also sits left — a collision that only became
        visible in a real browser. Across the top it has a lane of its own.
      */}
      <nav
        aria-label="Progress through the introduction"
        className="pointer-events-none absolute left-1/2 top-[calc(50%-11rem)] z-artifacts hidden -translate-x-1/2 items-center gap-0 lg:flex"
      >
        {STOPS.map((stop, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={stop.key} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.span
                  aria-hidden
                  className="block rounded-full"
                  animate={{
                    width: active ? 7 : 5,
                    height: active ? 7 : 5,
                    backgroundColor: active ? '#FFB865' : done ? '#F5EFE3' : 'transparent',
                    borderColor: done || active ? 'transparent' : 'rgba(245,239,227,0.26)',
                  }}
                  transition={{ duration: 0.4 }}
                  style={{ borderWidth: 1, borderStyle: 'solid' }}
                />
                <motion.span
                  className="font-editorial text-[0.66rem] lowercase tracking-[0.16em]"
                  animate={{
                    opacity: active ? 1 : done ? 0.45 : 0.2,
                    color: active ? '#FFB865' : '#F5EFE3',
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {stop.label}
                </motion.span>
              </div>
              {i < STOPS.length - 1 && (
                <span
                  aria-hidden
                  className="mx-3 block h-px w-10"
                  style={{
                    background: done ? 'rgba(245,239,227,0.35)' : 'rgba(245,239,227,0.12)',
                  }}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* narrow: the same fact, one line, tucked under the top bar */}
      <p className="pointer-events-none absolute left-1/2 top-[calc(50%-9rem)] z-artifacts -translate-x-1/2 font-mono text-micro uppercase tabular-nums text-paper/25 lg:hidden">
        {String(activeIndex + 1).padStart(2, '0')} / {String(STOPS.length).padStart(2, '0')}
        <span className="ml-2 text-tungsten/50">{STOPS[activeIndex]?.label}</span>
      </p>
    </>
  );
}
