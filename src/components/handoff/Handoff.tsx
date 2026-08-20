'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SPRING } from '@/lib/motion';
import { play } from '@/components/shared/sound';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { track } from '@/lib/analytics';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * The handoff.
 *
 * Ditto's own manifesto says technology should "make the introduction, then get
 * out of the way." This is that sentence, executed: the richest screen in the
 * piece deletes itself down to a single text message, and then down to one line.
 *
 * Four beats now, not two. The added one is `waiting` — because an introduction
 * involves a second person who has not answered yet, and a product that resolves
 * instantly is a product with only one human in it.
 */

type Stage = 'waiting' | 'pass' | 'sent' | 'quiet';

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
  const [stage, setStage] = useState<Stage>('waiting');
  const [theyAnswered, setTheyAnswered] = useState(false);
  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    // The other person takes a beat. Not a loading spinner — a person.
    const answered = setTimeout(() => {
      setTheyAnswered(true);
      play('tick', soundOn);
    }, 1150);
    const toPass = setTimeout(() => setStage('pass'), 2600);
    return () => {
      clearTimeout(answered);
      clearTimeout(toPass);
    };
  }, [soundOn]);

  useEffect(() => {
    if (stage !== 'pass' || captured) return;
    const t1 = setTimeout(() => {
      setStage('sent');
      play('send', soundOn);
    }, 4200);
    return () => clearTimeout(t1);
  }, [stage, captured, soundOn]);

  useEffect(() => {
    if (stage !== 'sent') return;
    const t = setTimeout(() => {
      setStage('quiet');
      onQuiet();
    }, 4400);
    return () => clearTimeout(t);
  }, [stage, onQuiet]);

  const capture = () => {
    setFlash(true);
    setCaptured(true);
    play('snap', soundOn);
    track('pass_captured', { scene: scene.id, pair: pair.id });
    setTimeout(() => setFlash(false), 220);
  };

  return (
    <div className="absolute inset-0 z-overlay grid place-items-center px-gutter">
      {/* camera flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.06 }}
            className="pointer-events-none fixed inset-0 z-disclosure bg-paper-bright"
          />
        )}
      </AnimatePresence>

      {/* beat one: is the other person in? */}
      <AnimatePresence>
        {stage === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.4 } }}
            transition={SPRING.copy}
            className="col-start-1 row-start-1 w-[min(22rem,84vw)]"
          >
            {[
              { person: pair.personA, inNow: true },
              { person: pair.personB, inNow: theyAnswered },
            ].map(({ person, inNow }) => (
              <div
                key={person.id}
                className="flex items-baseline justify-between border-b border-paper/10 py-3.5"
              >
                <span className="font-display text-[1.4rem] uppercase leading-none text-paper">
                  {person.name}
                </span>
                <span className="flex items-center gap-2">
                  {inNow ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={SPRING.snap}
                      className="flex items-center gap-1.5 font-editorial text-[0.85rem] text-mint"
                    >
                      <Check size={13} strokeWidth={2.5} aria-hidden />
                      in
                    </motion.span>
                  ) : (
                    <span className="font-mono text-[0.9rem] text-paper/25">
                      <span className="animate-caret">…</span>
                    </span>
                  )}
                </span>
              </div>
            ))}

            <AnimatePresence>
              {theyAnswered && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-5 text-center font-voice text-[1.35rem] italic text-tungsten"
                >
                  both in.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Beat two: the plan as a physical object.

        Before anything collapses, the decision becomes a thing you could put in
        a pocket — a ticket rather than a notification. It is the only screen in
        the piece designed to be screenshotted by someone who is not using the
        product, which is why it has its own shutter.
      */}
      <AnimatePresence>
        {stage === 'pass' && (
          <motion.div
            key="pass"
            initial={{ opacity: 0, y: 26, rotate: -3, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotate: captured ? 0 : -1.4, scale: captured ? 1.04 : 1 }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.9,
              filter: 'blur(5px)',
              transition: { duration: 0.5 },
            }}
            transition={{ type: 'spring', stiffness: 190, damping: 24 }}
            className="col-start-1 row-start-1 w-[min(20rem,82vw)]"
          >
            <div className="u-paper u-torn-bottom relative px-6 pb-9 pt-6">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-ink/45">
                Ditto · one introduction
              </p>

              <p className="mt-4 font-display text-[1.9rem] uppercase leading-none text-ink">
                {pair.personA.name} <span className="text-acid">×</span> {pair.personB.name}
              </p>

              <div className="my-4 border-t border-dashed border-ink/25" />

              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink/50">
                thursday
              </p>
              <p className="font-display text-[3.2rem] leading-[0.9] text-ink">{scene.time}</p>

              <p className="mt-3 font-editorial text-[0.78rem] uppercase leading-relaxed tracking-[0.14em] text-ink/70">
                {scene.location.split('→')[0].trim()}
                <br />
                <span className="text-acid">↓</span>
                <br />
                {(scene.location.split('→')[1] ?? 'and see').trim()}
              </p>

              <p className="mt-5 font-hand text-[1.2rem] leading-tight text-ink/55">
                less pressure. more chance.
              </p>

              <span aria-hidden className="absolute -left-1.5 top-[42%] h-3 w-3 rounded-full bg-ink" />
              <span aria-hidden className="absolute -right-1.5 top-[42%] h-3 w-3 rounded-full bg-ink" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={capture}
                data-cursor="keep it"
                className="font-editorial text-[0.78rem] lowercase tracking-wide text-paper/45 underline-offset-4 transition-colors hover:text-paper hover:underline"
              >
                {captured ? 'kept.' : 'capture this'}
              </button>
              {captured && (
                <button
                  onClick={() => setStage('sent')}
                  className="font-editorial text-[0.78rem] lowercase tracking-wide text-paper/45 underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  send it →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 'sent' && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)', transition: { duration: 0.4 } }}
            transition={SPRING.copy}
            className="col-start-1 row-start-1 w-full max-w-[23rem]"
          >
            <p className="mb-2.5 text-center font-mono text-[0.62rem] uppercase tracking-[0.28em] text-paper/30">
              Ditto
            </p>

            <div className="rounded-[1.35rem] rounded-bl-md bg-cobalt px-5 py-4 shadow-lift">
              <p className="font-voice text-[1.2rem] leading-snug text-paper-bright">
                {pair.personA.name}, meet {pair.personB.name}.
              </p>
              <p className="mt-3 font-mono text-[0.8rem] tabular-nums text-paper-bright/75">
                Thursday · {scene.time}
              </p>
              <p className="font-editorial text-[0.82rem] text-paper-bright/75">{scene.location}</p>

              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="mt-3 overflow-hidden font-voice text-[1.05rem] italic leading-snug text-paper-bright/90"
              >
                you&rsquo;ll have something to talk about before you have to figure out what to
                talk about.
              </motion.p>
            </div>

            <motion.p
              className="mt-2 text-right font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
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
            <p className="mb-5 font-voice text-[1.15rem] italic text-paper/40">
              you two take it from here.
            </p>
            <h2 className="font-display text-[clamp(2rem,7vw,4.5rem)] uppercase leading-none text-paper">
              go have a real life.
            </h2>
            <p className="mt-4 font-editorial text-[0.8rem] lowercase tracking-wide text-paper/30">
              Ditto will be quiet now.
            </p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.8 }}
              onClick={onFeedback}
              data-cursor="later"
              className="mt-14 border-b border-paper/20 pb-0.5 font-voice text-[1.05rem] italic text-paper/35 transition-colors hover:border-paper/60 hover:text-paper/80"
            >
              — later that night —
            </motion.button>

            <PrototypeDisclosure className="mt-16 text-center" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
