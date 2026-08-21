'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE, SPRING } from '@/lib/motion';
import { shiftClock } from './TimeDial';
import type { Scene } from '@/lib/types';

/**
 * The verdict.
 *
 * Never a score. The strongest scene says "this one." and the weakest says
 * "calendar fit isn't human fit." — both of which carry more information than a
 * percentage, because they name *which* thing is wrong.
 *
 * The typographic rule that changed here: everything the product actually says
 * about two people is now set in the serif voice, and monospace is reserved for
 * the clock. The previous version put verdicts, annotations and locations all in
 * tiny uppercase mono, which is why observant copy still read as machine output.
 */
export function SceneHeadline({
  scene,
  isWinner,
  timeShift = 0,
}: {
  scene: Scene;
  isWinner: boolean;
  timeShift?: -1 | 0 | 1;
}) {
  const clock = shiftClock(scene.time, timeShift);

  return (
    <div className="pointer-events-none relative select-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.14, ease: EASE.exit } }}
          transition={{ ...SPRING.copy }}
        >
          <h2 className="font-display text-display uppercase leading-none text-paper">
            {scene.label}
          </h2>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-[0.82rem] tabular-nums text-tungsten">{clock}</span>
            <span className="font-voice text-[1.05rem] italic text-paper/50">
              {scene.location}
            </span>
            {timeShift !== 0 && (
              <span className="font-mono text-micro uppercase text-paper/55">
                {timeShift < 0 ? 'earlier' : 'later'} than planned
              </span>
            )}
          </p>

          <motion.p
            className={`mt-5 max-w-[20ch] font-voice text-say leading-[1.1] sm:max-w-[24ch]
              ${isWinner ? 'text-acid' : 'text-paper'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: DUR.settle, ease: EASE.settle }}
          >
            {scene.verdict}
          </motion.p>

          {scene.verdictSub && (
            <motion.p
              className="mt-3 max-w-[30ch] font-voice text-[1.15rem] leading-snug text-paper/65"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: DUR.settle, ease: EASE.settle }}
            >
              {scene.verdictSub}
            </motion.p>
          )}

          <motion.p
            className="mt-5 max-w-[32ch] font-hand text-[1.12rem] leading-snug text-tungsten"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: DUR.settle, ease: EASE.settle }}
          >
            {scene.annotation}
          </motion.p>

          {scene.thirdThing && (
            <motion.p
              className="mt-5 inline-flex items-center gap-2 border-l-2 border-ticket/60 pl-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: DUR.settle, ease: EASE.settle }}
            >
              <span className="font-mono text-micro uppercase text-ticket/70">third thing</span>
              <span className="font-voice text-[1.02rem] italic text-paper/70">
                {scene.thirdThing}
              </span>
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
