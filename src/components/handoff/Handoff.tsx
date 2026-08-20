'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { play } from '@/components/shared/sound';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * The handoff.
 *
 * Ditto's own manifesto says technology should "make the introduction, then get
 * out of the way." This is that sentence, executed: the richest screen in the
 * piece deletes itself down to a single text message, and then down to one line.
 *
 * Nothing here is a call to action. There is no next step, no carousel, no
 * "discover more". The interface has finished its job and the correct thing for
 * it to do is stop.
 */

type Stage = 'composing' | 'sent' | 'quiet';

export function Handoff({
  pair,
  scene,
  soundOn,
  onQuiet,
  onFeedback,
}: {
  pair: MatchPair;
  scene: Scene;
  soundOn: boolean;
  onQuiet: () => void;
  onFeedback: () => void;
}) {
  const [stage, setStage] = useState<Stage>('composing');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage('sent');
      play('send', soundOn);
    }, 1250);
    const t2 = setTimeout(() => {
      setStage('quiet');
      onQuiet();
    }, 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onQuiet, soundOn]);

  return (
    <div className="absolute inset-0 z-overlay grid place-items-center px-gutter">
      {/*
        No `mode="wait"` here, deliberately.
        This is the last beat of the whole piece — "go have a real life" — and
        `wait` would gate it behind the message card's exit animation
        completing. Any stall in that animation (a backgrounded tab pausing
        rAF, for instance) means the ending simply never arrives. Both stages
        are stacked in one grid cell instead, so the quiet screen mounts the
        moment the state changes and the card leaves underneath it.
      */}
      <AnimatePresence>
        {stage !== 'quiet' && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)', transition: { duration: 0.4 } }}
            transition={SPRING.copy}
            className="col-start-1 row-start-1 w-full max-w-[23rem]"
          >
            <p className="mb-2.5 text-center font-mono text-micro uppercase text-paper/35">Ditto</p>

            <motion.div
              layout
              className="rounded-[1.35rem] rounded-bl-md bg-cobalt px-5 py-4 shadow-lift"
            >
              <p className="font-editorial text-[1.05rem] font-medium leading-snug text-paper-bright">
                {pair.personA.name}, meet {pair.personB.name}.
              </p>
              <p className="mt-3 font-mono text-[0.82rem] uppercase tracking-wide text-paper-bright/80">
                Thursday · {scene.time}
              </p>
              <p className="font-mono text-[0.82rem] uppercase tracking-wide text-paper-bright/80">
                {scene.location}
              </p>

              <AnimatePresence>
                {stage === 'sent' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.25, duration: 0.45 }}
                    className="mt-3 overflow-hidden font-editorial text-[0.95rem] leading-snug text-paper-bright/90"
                  >
                    you’ll have something to talk about before you have to figure out what to
                    talk about.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.p
              className="mt-2 text-right font-mono text-micro uppercase text-paper/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 'sent' ? 1 : 0 }}
              transition={{ delay: 0.4 }}
            >
              delivered
            </motion.p>
          </motion.div>
        )}

        {stage === 'quiet' && (
          <motion.div
            key="quiet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="col-start-1 row-start-1 flex flex-col items-center text-center"
          >
            <h2 className="font-display text-[clamp(2rem,7vw,4.5rem)] uppercase leading-none text-paper">
              go have a real life.
            </h2>
            <p className="mt-4 font-mono text-micro uppercase text-paper/30">
              Ditto will be quiet now.
            </p>

            {/*
              One link, well below the fold of attention, and it is not a
              re-engagement hook — it is the loop that closes after the date
              has actually happened.
            */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.8 }}
              onClick={onFeedback}
              className="mt-14 border-b border-paper/20 pb-0.5 font-mono text-micro uppercase text-paper/35 transition-colors hover:border-paper/60 hover:text-paper/80"
            >
              — later that week —
            </motion.button>

            <PrototypeDisclosure className="mt-16 text-center" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
