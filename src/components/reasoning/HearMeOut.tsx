'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import type { MatchPair } from '@/lib/types';

/**
 * Stated preference versus revealed pattern.
 *
 * The interesting claim is not "the AI learned your type". It is that the user
 * described the *symptom* accurately and diagnosed it wrongly — they weren't
 * wrong about being uncomfortable, they were wrong about what caused it.
 *
 * Framed as a working hypothesis throughout, and it never asserts that the
 * history is more true than the person. It just disagrees, politely, and shows
 * its reasoning.
 */
export function HearMeOut({
  pair,
  open,
  onClose,
}: {
  pair: MatchPair;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="hmo"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={SPRING.copy}
          role="dialog"
          aria-label="Hear me out"
          className="pointer-events-auto absolute left-1/2 top-1/2 z-overlay w-[min(30rem,92vw)] -translate-x-1/2 -translate-y-1/2 border border-paper/12 bg-ink-soft/95 p-6 shadow-lift backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-[1.7rem] uppercase leading-none text-acid">hear me out.</p>
            <button
              onClick={onClose}
              className="font-mono text-micro uppercase text-paper/40 hover:text-paper"
            >
              close
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-y border-paper/10 py-4">
            <div>
              <p className="font-mono text-micro uppercase text-paper/30">you said</p>
              <p className="mt-1.5 font-editorial text-[0.98rem] leading-snug text-paper/80">
                “{pair.hearMeOut.stated}”
              </p>
            </div>
            <div>
              <p className="font-mono text-micro uppercase text-mint/70">history suggests</p>
              <p className="mt-1.5 font-editorial text-[0.98rem] leading-snug text-paper/80">
                {pair.hearMeOut.reading}
              </p>
            </div>
          </div>

          <p className="mt-5 font-editorial text-[1.05rem] leading-snug text-paper">
            {pair.hearMeOut.line}
          </p>

          <p className="mt-5 font-mono text-micro uppercase text-paper/30">
            working hypothesis · we may be wrong · change the scene and see
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
