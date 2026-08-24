'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import Link from 'next/link';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { MASTER } from '@/lib/film';
import type { MatchPair } from '@/lib/types';

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
 *
 * The second beat used to be a thesis poster — SAME TWO PEOPLE / six ways to
 * meet / but where changes everything — three lines of exposition before a
 * single human appeared. The people are the product; the poster was the
 * README. Now the names arrive first, as people, and the only line of copy is
 * the one sentence the whole piece exists to say. The thesis is still stated
 * everywhere a crawler or a no-JS reader looks; it just stops being the thing
 * a visitor has to read before anything happens.
 */
export function IntroCurtain({ pair, onBegin }: { pair: MatchPair; onBegin: () => void }) {
  const [beat, setBeat] = useState<'text' | 'people'>('text');
  const reduced = useReducedMotion();

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
      {/*
        The world behind the words.

        Ditto's own join flow opens on a photograph — a campus lawn shot soft,
        grainy and blue, with the interface floating in front of it. Ours
        opened on flat black, which read as an editorial site clearing its
        throat rather than an evening starting. One heavily blurred blue-hour
        frame under the intro moves the first five seconds into their world;
        it leaves with the curtain, and the stage underneath stays the stage.
      */}
      <div
        aria-hidden
        className="u-stack-grain absolute inset-0 -z-10 overflow-hidden"
        style={{ '--grain-opacity': '0.14' } as React.CSSProperties}
      >
        {/*
          The film breathes behind the words: eight muted seconds of the
          world-turn, played once, blurred into atmosphere. Reduced motion
          keeps the still photograph — a self-playing backdrop is exactly
          what that preference declined — and the poster covers the frame
          until the video can.
        */}
        {reduced ? (
          /* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */
          <img
            src="/photos/twilight-stroll.webp"
            alt=""
            decoding="async"
            className="h-full w-full scale-110 object-cover"
            style={{ filter: 'blur(22px) saturate(0.8) brightness(0.5)' }}
          />
        ) : (
          <video
            src="/film/exports/hero.mp4"
            poster="/photos/twilight-stroll.webp"
            autoPlay
            muted
            playsInline
            preload="metadata"
            className="h-full w-full scale-110 object-cover"
            style={{ filter: 'blur(18px) saturate(0.8) brightness(0.5)' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(110% 80% at 50% 100%, rgba(11,9,7,0.9), rgba(11,9,7,0.45) 55%, rgba(11,9,7,0.62))',
          }}
        />
      </div>
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

      {/* Beat two: the two people it is about, then the one sentence. */}
      <div className="max-w-[min(46rem,92vw)]">
        <AnimatePresence>
          {beat === 'people' && (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-display text-hero uppercase leading-[0.86] text-paper">
                {[pair.personA.name, pair.personB.name].map((name, i) => (
                  <motion.span
                    key={name}
                    className="block"
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.14, duration: 0.7, ease: EASE.settle }}
                  >
                    {i === 1 && <span className="text-acid">× </span>}
                    {name}
                  </motion.span>
                ))}
              </h1>

              {/*
                Hero-scale, because it is the hero. Ditto's own landing leads
                with one swashy serif sentence over photography; this is our
                sentence, in our serif, at the size a thesis deserves.
              */}
              {/*
                Word by word, not as a block. Four words carry the whole
                thesis, so each one gets its own beat — the acid pair lands
                last, which is the order the idea actually unfolds in.
              */}
              <motion.p
                className="mt-5 font-voice text-[clamp(1.4rem,3.6vw,2.4rem)] italic leading-tight text-paper/85"
                initial="hidden"
                animate="shown"
                transition={{ staggerChildren: 0.11, delayChildren: 0.42 }}
              >
                {[
                  { t: 'right', acid: false },
                  { t: 'person.', acid: false },
                  { t: 'wrong', acid: true },
                  { t: 'first date.', acid: true },
                ].map((w) => (
                  <motion.span
                    key={w.t}
                    className={`mr-[0.32em] inline-block ${w.acid ? 'text-acid not-italic' : ''}`}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE.settle } },
                    }}
                  >
                    {w.t}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-end justify-between gap-6">
        <span className="pointer-events-auto flex items-baseline gap-4">
          <PrototypeDisclosure />
          <Link
            href="/film"
            data-cursor="roll it"
            className="shrink-0 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-tungsten underline-offset-4 hover:underline"
          >
            {`film · 00:${MASTER.duration}`}
          </Link>
        </span>
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
