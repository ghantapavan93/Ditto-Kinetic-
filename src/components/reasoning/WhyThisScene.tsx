'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import type { Scene } from '@/lib/types';

/**
 * Three pieces of evidence and one admission.
 *
 * The fourth note is the important one. A system that can explain why it chose
 * something but cannot say what it still does not know is not being transparent,
 * it is being persuasive. The uncertainty note is rendered as translucent tape
 * so it reads as *attached but unresolved* — it never gets a tidy answer, in
 * this or any later screen.
 */
export function WhyThisScene({
  scene,
  open,
  onClose,
}: {
  scene: Scene;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="why"
          aria-label="Why this scene was chosen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-overlay flex justify-center px-gutter pb-[clamp(1rem,4vh,2.5rem)] sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[min(30rem,42vw)] sm:items-center sm:pb-0"
        >
          <div className="w-full max-w-[30rem]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[1.6rem] uppercase leading-none text-paper">why this one?</h3>
              <button
                onClick={onClose}
                className="font-mono text-micro uppercase text-paper/45 transition-colors hover:text-paper"
              >
                close
              </button>
            </div>

            <ul className="space-y-2.5">
              {scene.rationale.map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, y: 18, rotate: i % 2 === 0 ? -1.4 : 1.1 }}
                  animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -1.4 : 1.1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ ...SPRING.settle, delay: 0.06 + i * 0.09 }}
                  className="u-paper relative rounded-artifact px-4 py-3 pl-11"
                >
                  {/* masking tape */}
                  <span
                    aria-hidden
                    className="absolute -top-2 left-4 h-4 w-14 rotate-[-4deg] bg-paper-dim/70 shadow-tape"
                  />
                  <span className="absolute left-3.5 top-3 font-mono text-[0.7rem] font-bold text-cobalt">
                    0{i + 1}
                  </span>
                  <p className="font-editorial text-[0.94rem] leading-snug text-ink">{line}</p>
                </motion.li>
              ))}

              <motion.li
                initial={{ opacity: 0, y: 18, rotate: 0.8 }}
                animate={{ opacity: 1, y: 0, rotate: 0.8 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ ...SPRING.settle, delay: 0.36 }}
                className="relative rounded-artifact border border-dashed border-paper/25 bg-paper/[0.07] px-4 py-3 backdrop-blur-sm"
              >
                <p className="font-mono text-micro uppercase text-paper/45">what we don’t know yet</p>
                <p className="mt-1.5 font-editorial text-[0.94rem] leading-snug text-paper/80">
                  {scene.uncertainty}
                </p>
              </motion.li>
            </ul>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
