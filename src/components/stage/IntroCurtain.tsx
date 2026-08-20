'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

/**
 * The opening.
 *
 * No landing page, no feature list, no explanation before play. The stage is
 * already live and already lit behind this copy — the intro is three lines and
 * an instruction, and any input at all dismisses it.
 *
 * Ten seconds is the budget: the timestamp establishes *when*, the two cards
 * establish *who*, and "six ways to meet" establishes the only mechanic there
 * is. Everything after that is discovered by dragging.
 */
export function IntroCurtain({ onBegin }: { onBegin: () => void }) {
  useEffect(() => {
    const dismiss = () => onBegin();
    window.addEventListener('pointerdown', dismiss, { once: true });
    window.addEventListener('keydown', dismiss, { once: true });
    window.addEventListener('wheel', dismiss, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('wheel', dismiss);
    };
  }, [onBegin]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-overlay flex flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.5rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: DUR.settle, ease: EASE.settle }}
    >
      <motion.p
        className="font-mono text-label uppercase text-paper/60"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE.settle }}
      >
        WED 7:00 PM
      </motion.p>

      <div className="max-w-[min(46rem,92vw)]">
        <h1 className="font-display text-hero uppercase leading-[0.86] text-paper">
          {['same two', 'people.'].map((line, i) => (
            <motion.span
              key={line}
              className="block"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.7, ease: EASE.settle }}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mt-5 font-editorial text-lede font-medium text-acid"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.6, ease: EASE.settle }}
        >
          six ways to meet.
        </motion.p>
      </div>

      <div className="flex items-end justify-between gap-6">
        <PrototypeDisclosure />
        <motion.p
          className="shrink-0 font-mono text-label uppercase text-paper/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.55, 1] }}
          transition={{ delay: 0.95, duration: 2.2, ease: 'easeInOut' }}
        >
          drag the first scene
        </motion.p>
      </div>
    </motion.div>
  );
}
