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

  /*
   * If the film can't arrive, the words stand alone on ink. A broken video
   * element degrades to its poster at best and a black box at worst; either
   * way the one thing the opening must never show is a partial backdrop.
   */
  const [filmLost, setFilmLost] = useState(false);

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
      className="pointer-events-none absolute inset-0 isolate z-overlay flex flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.5rem)] bg-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: DUR.settle, ease: EASE.settle }}
    >
      {/*
        The film opens the site, playing, in focus.

        This used to be hero.mp4 under blur(18px) — footage as atmosphere. In
        practice eighteen pixels of blur turned the opening frame into a brown
        smear that read as a failed image load, and it threw away the one shot
        that performs the whole thesis: the same two people standing still
        while a diner becomes a library becomes a courtyard becomes a theatre
        street. So the shot now plays sharp, once, and holds its final frame —
        the lit marquee — behind the names. The scrim below, not a blur, is
        what keeps the type readable.

        `isolate` matters: the backdrop sits at -z-10, and without a stacking
        context on the curtain it slid *behind* the WebGL stage, letting the
        room plate and the desk objects poke through the opening frame with a
        hard seam where the two met.
      */}
      <div
        aria-hidden
        className="u-stack-grain absolute inset-0 -z-10 overflow-hidden"
        style={{ '--grain-opacity': '0.14' } as React.CSSProperties}
      >
        {/*
          Reduced motion keeps the held frame as a photograph — a self-playing
          backdrop is exactly what that preference declined. A failed video
          removes itself entirely: the words stand alone on ink, which is an
          opening, where a broken frame is only a defect.
        */}
        {filmLost ? null : reduced ? (
          /* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */
          <img
            src={MASTER.heroHold}
            alt=""
            decoding="async"
            onError={() => setFilmLost(true)}
            className="h-full w-full object-cover"
            style={{ filter: 'saturate(0.95) brightness(0.85)' }}
          />
        ) : (
          <video
            src={MASTER.hero}
            poster={MASTER.heroFirst}
            autoPlay
            muted
            playsInline
            preload="auto"
            onError={() => setFilmLost(true)}
            className="h-full w-full object-cover"
            style={{ filter: 'saturate(0.95) brightness(0.85)' }}
          />
        )}
        {/*
          The scrim earns the typography its contrast without costing the
          footage its focus: heavy where the names live, near-clear through
          the middle where the people are, a breath at the top for the label.
        */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 95% at 50% 42%, transparent 52%, rgba(11,9,7,0.5)), linear-gradient(to top, rgba(11,9,7,0.92) 0%, rgba(11,9,7,0.45) 32%, rgba(11,9,7,0.08) 58%, rgba(11,9,7,0.3) 100%)',
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
