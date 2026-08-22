'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PHOTOS } from '@/data/photoManifest';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

/**
 * The reel.
 *
 * Everything else on this site argues. This is the one surface that just
 * shows the world the argument is for: evenings that happened, rooms waiting
 * for people, a week of frames. Synthetic photography of synthetic people —
 * the disclosure never leaves the screen — cut like a film rather than laid
 * out like a grid.
 *
 * The edit is the design. Moments run long and slow with a drifting camera,
 * because a photograph of two people deserves the time it takes to read one.
 * The empty rooms are the quiet passage — the same rooms the stage ranks, held
 * a beat longer. The contact sheets cut fast, the way flipping through a
 * shoot's contact sheets actually feels. Then one line, then it starts again.
 *
 * The closing line is the point of the whole surface, and it is the honest
 * version of a months-later scrapbook: none of this happened on a feed.
 */

/** Per-kind pacing, in ms. The rooms deliberately outstay the moments. */
const HOLD: Record<string, number> = { moment: 5200, room: 6400, sheet: 2400 };

/** Frames between the last photo and the loop restarting. */
const CLOSING_HOLD = 6800;

type Beat = { kind: 'photo'; index: number } | { kind: 'closing' };

export function MomentsStage() {
  const reel = useMemo<Beat[]>(
    () => [
      ...PHOTOS.map((_, index) => ({ kind: 'photo', index }) as Beat),
      { kind: 'closing' },
    ],
    [],
  );

  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const beat = reel[at];

  useEffect(() => {
    track('moments_viewed', { photos: PHOTOS.length });
  }, []);

  const advance = useCallback(
    (dir: 1 | -1) => setAt((i) => (i + dir + reel.length) % reel.length),
    [reel.length],
  );

  // The autoplay clock. Paused is paused; reduced motion still advances, just
  // without the drift — a reel that never moves is not a reel.
  useEffect(() => {
    if (paused) return;
    const hold =
      beat.kind === 'closing' ? CLOSING_HOLD : HOLD[PHOTOS[beat.index].kind] ?? 5200;
    const t = setTimeout(() => advance(1), hold);
    return () => clearTimeout(t);
  }, [at, paused, beat, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance(1);
      else if (e.key === 'ArrowLeft') advance(-1);
      else if (e.key === ' ') setPaused((p) => !p);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  // Keep the next frame warm so the crossfade never lands on a blank.
  useEffect(() => {
    const next = reel[(at + 1) % reel.length];
    if (next.kind !== 'photo') return;
    const img = new window.Image();
    img.src = PHOTOS[next.index].src;
  }, [at, reel]);

  const photo = beat.kind === 'photo' ? PHOTOS[beat.index] : null;
  const shown = beat.kind === 'photo' ? beat.index + 1 : PHOTOS.length;

  return (
    <div
      className="u-stack-grain relative h-screen overflow-hidden bg-ink"
      onClick={() => advance(1)}
      data-cursor="next"
    >
      {/* the frame */}
      <AnimatePresence>
        {photo && (
          <motion.div
            key={photo.src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.4 : 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <motion.img
              src={photo.src}
              alt={photo.title ?? 'a synthetic campus moment'}
              initial={
                reduced
                  ? { scale: 1 }
                  : { scale: 1.07, x: beat.kind === 'photo' && beat.index % 2 ? 14 : -14 }
              }
              animate={{ scale: 1, x: 0 }}
              transition={{ duration: (HOLD[photo.kind] + 1400) / 1000, ease: 'linear' }}
              className="h-full w-full object-cover"
            />
            {/* the site's own dark holds the edges so type always survives */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 75% at 20% 100%, rgba(11,9,7,0.82), transparent 55%), radial-gradient(90% 45% at 85% 0%, rgba(11,9,7,0.6), transparent 55%), linear-gradient(rgba(11,9,7,0.25), transparent 30%)',
              }}
            />
          </motion.div>
        )}

        {/* the line the reel exists for */}
        {beat.kind === 'closing' && (
          <motion.div
            key="closing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 grid place-content-center bg-ink px-gutter"
          >
            <p className="max-w-[24ch] font-voice text-[clamp(1.5rem,4.5vw,2.6rem)] leading-tight text-paper">
              none of this happened on a feed.
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 1.2 }}
              className="mt-5 font-voice text-[clamp(1.05rem,2.6vw,1.5rem)] italic leading-snug text-tungsten"
            >
              that&rsquo;s kind of the point.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        The page has a name even though showing it would wreck the reel.
        A route with no h1 hands a screen reader a document with no title and no
        structure; a sweep of all 27 routes found this and /after were the only
        two without one.
      */}
      <h1 className="sr-only">Moments — the world the argument is for</h1>

      <NarrativeCursor />

      {/* chrome, kept to almost nothing */}
      <div className="pointer-events-none relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/50">
            {String(shown).padStart(2, '0')} / {PHOTOS.length}
            {paused ? ' · held' : ''}
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 pointer-events-auto font-editorial text-[0.7rem] lowercase tracking-wide text-paper/62 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <footer className="flex items-end justify-between gap-4">
          <div>
            <AnimatePresence mode="popLayout">
              {photo?.title && (
                <motion.p
                  key={photo.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="font-voice text-[1.15rem] italic leading-snug text-paper/85"
                >
                  {photo.title}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="mt-2 font-editorial text-[0.68rem] lowercase tracking-wide text-paper/55">
              click, arrows, or space to hold. every person here is synthetic.
            </p>
          </div>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
