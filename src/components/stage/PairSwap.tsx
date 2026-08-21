'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePrototype } from '@/store/prototypeStore';

/**
 * The swap, in DOM.
 *
 * Two beats the canvas cannot do on its own.
 *
 * The sheet: while the photographs are receded and dark, a strip of empty
 * frames passes across the stage. It is the moment the piece admits it has a
 * *set* of people rather than these two — which is what makes the next part
 * land, because the engine is about to be handed a different pair and asked
 * the same question.
 *
 * The line: one sentence, once, and then it leaves. It is the whole proof, and
 * over-explaining it would turn evidence into a claim. Nothing about it says
 * "as you can see" — it just states what happened and gets out.
 */
export function PairSwap() {
  const swapPhase = usePrototype((s) => s.swapPhase);
  const swapLine = usePrototype((s) => s.swapLine);
  const inSheet = swapPhase !== 'idle';

  return (
    <>
      <AnimatePresence>
        {inSheet && (
          <motion.div
            key="sheet"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.28 }}
            className="pointer-events-none absolute inset-0 z-artifacts grid place-items-center"
          >
            <motion.div
              className="flex gap-2"
              initial={{ x: -70, filter: 'blur(3px)' }}
              animate={{ x: 40, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="block rounded-[1px] border border-paper/15 bg-paper/[0.05]"
                  style={{ width: 46, height: 58 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: i === 2 || i === 3 ? 0.5 : 0.2, y: 0 }}
                  transition={{ delay: i * 0.045, duration: 0.4 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swapLine && (
          <motion.p
            key="line"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.8 } }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-[clamp(8rem,19vh,11.5rem)] left-1/2 z-overlay -translate-x-1/2 text-center font-voice text-[1.3rem] leading-relaxed text-tungsten"
          >
            same rooms.
            <br />
            different people.
            <br />
            <span className="text-acid">different answer.</span>
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
