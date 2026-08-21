'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

/**
 * The opening.
 *
 * No landing page, no feature list, no explanation before play. The stage is
 * already live and already lit behind this copy.
 *
 * It opens the way the real product opens: a text arrives. One bubble, three
 * words, and it leaves again — which is both accurate to Ditto's actual
 * delivery mechanism and the fastest possible way to establish that something
 * has already happened before you got here. Only then do the two photographs
 * get named.
 *
 * Any input at all skips the whole thing.
 */
export function IntroCurtain({ onBegin }: { onBegin: () => void }) {
  const [beat, setBeat] = useState<'text' | 'people'>('text');

  useEffect(() => {
    const t = setTimeout(() => setBeat('people'), 1900);
    return () => clearTimeout(t);
  }, []);

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
        WED · 7:00 PM
      </motion.p>

      {/* Beat one: the text that would actually have arrived. */}
      <AnimatePresence>
        {beat === 'text' && (
          <motion.div
            key="sms"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 30 }}
          >
            <p className="mb-2 font-mono text-micro uppercase text-paper/55">Ditto</p>
            <p className="rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-editorial text-lede font-medium text-paper-bright shadow-lift">
              found someone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat two: the two people it is about. */}
      <div className="max-w-[min(46rem,92vw)]">
        <AnimatePresence>
          {beat === 'people' && (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-display text-hero uppercase leading-[0.86] text-paper">
                {['same two', 'people.'].map((line, i) => (
                  <motion.span
                    key={line}
                    className="block"
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.7, ease: EASE.settle }}
                  >
                    {line}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                className="mt-5 font-editorial text-lede font-medium text-acid"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.6, ease: EASE.settle }}
              >
                six ways to meet.
              </motion.p>

              <motion.p
                className="mt-2 font-editorial text-[0.95rem] text-paper/62"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                but where changes everything.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-end justify-between gap-6">
        <PrototypeDisclosure />
        {/*
          Keeps breathing until somebody moves.

          This pulsed once and stopped, which turned the only affordance on the
          opening screen into a caption. A visitor who reads and hesitates was
          left with a static card and no interactive element anywhere in the
          DOM -- measured: zero buttons, zero links, and nothing that ever
          advances on its own. The gesture is forgiving (any pointer press
          works, not just a drag), so the fix is to say so and to keep the
          invitation alive rather than to take the first choice away by
          auto-advancing. The stage is about choosing; it should not choose.
        */}
        <motion.p
          className="shrink-0 font-mono text-label uppercase text-paper/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: beat === 'people' ? [0.35, 1, 0.35] : 0 }}
          transition={{
            delay: 0.7,
            duration: 2.6,
            ease: 'easeInOut',
            repeat: beat === 'people' ? Infinity : 0,
          }}
        >
          drag it &mdash; or tap anywhere
        </motion.p>
      </div>
    </motion.div>
  );
}
