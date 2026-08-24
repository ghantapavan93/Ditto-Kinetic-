'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { GROUPS } from '@/components/shared/SiteMenu';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { useCoarsePointer, useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

/**
 * The fast tour: every surface, about a second each.
 *
 * A founder is not going to open every page by hand, and asking them to is
 * the wrong battle. This is the alternative: one live reel that plays the
 * whole atlas — real titles, real one-line theses, the site's own
 * photography — so a visitor understands the shape of the world before
 * choosing where to dive.
 *
 * It behaves like a trailer crossed with a level select: hovering (or
 * touching) pauses it, arrows scrub it, Enter or a click dives into the
 * route on screen, Escape leaves. Under reduced motion it never advances by
 * itself — it becomes a deck you page through.
 *
 * Frames come from the same GROUPS the menu, the palette and the chip read,
 * so the tour can never disagree with the site about what exists. Images are
 * the pages' own photographs; only the current and next two load.
 */

type Frame = { href: string; label: string; blurb: string; photo: string };

/** The one photograph that stands for each route in the tour. */
const PHOTO_FOR: Record<string, string> = {
  '/start': '/photos/twilight-stroll.webp',
  '/': '/photos/moment-01.webp',
  '/app': '/rooms/postshow.webp',
  '/all': '/photos/photo-grid.webp',
  '/reel': '/photos/contact-sheet.webp',
  '/film': '/film/exports/poster.webp',
  '/wednesday': '/photos/print-laughing-blur.webp',
  '/thread': '/photos/neon-downtown.webp',
  '/double': '/photos/print-group-table.webp',
  '/after': '/photos/print-hands-ticket.webp',
  '/next-wednesday': '/photos/moment-13.webp',
  '/compiler': '/photos/print-selfie-03.webp',
  '/mutual': '/photos/print-closeup-01.webp',
  '/profile': '/photos/print-selfie-02.webp',
  '/held-back': '/photos/print-rain-window.webp',
  '/odds': '/photos/print-selfie-04.webp',
  '/gravity': '/photos/moment-05.webp',
  '/weather': '/photos/moment-14.webp',
  '/possibility': '/photos/moment-06.webp',
  '/zoom': '/photos/moment-09.webp',
  '/network': '/photos/moment-07.webp',
  '/world': '/photos/print-campus-wide.webp',
  '/moments': '/photos/moment-02.webp',
  '/vision': '/photos/moment-03.webp',
  '/autonomy': '/photos/print-hands-cups.webp',
  '/attention': '/photos/print-shoes-cafe.webp',
  '/ending': '/photos/print-backs-rain.webp',
  '/next': '/photos/moment-08.webp',
  '/end': '/photos/moment-10.webp',
};

const FRAMES: Frame[] = GROUPS.flatMap((g) =>
  g.entries
    .filter((e) => e.href !== '/reel')
    .map((e) => ({
      href: e.href,
      label: e.label,
      blurb: e.blurb,
      photo: PHOTO_FOR[e.href] ?? g.photo ?? '/photos/moment-01.webp',
    })),
);

const HOLD_MS = 1150;

export function ReelStage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    track('reel_viewed');
  }, []);

  const step = useCallback(
    (dir: number) => setI((v) => (v + dir + FRAMES.length) % FRAMES.length),
    [],
  );

  // The clock. Reduced motion turns the reel into a hand-paged deck.
  useEffect(() => {
    if (reduced || paused) return;
    timer.current = setTimeout(() => step(1), HOLD_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, paused, reduced, step]);

  // Preload the two frames ahead, never the whole atlas.
  useEffect(() => {
    for (const ahead of [1, 2]) {
      const img = new Image();
      img.src = FRAMES[(i + ahead) % FRAMES.length].photo;
    }
  }, [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key === 'Enter') { e.preventDefault(); router.push(FRAMES[i].href); }
      else if (e.key === 'Escape') { e.preventDefault(); router.push('/'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, router, step]);

  const f = FRAMES[i];

  return (
    <div
      className="u-stack-grain fixed inset-0 overflow-hidden bg-ink"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* the frame */}
      <AnimatePresence mode="popLayout">
        <motion.button
          key={f.href}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => router.push(f.href)}
          data-cursor="dive in"
          className="absolute inset-0 block h-full w-full cursor-pointer text-left"
          aria-label={`Open ${f.label}`}
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${f.photo})`,
              filter: 'saturate(0.7) brightness(0.42)',
            }}
          />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(110% 80% at 18% 88%, rgba(11,9,7,0.92), transparent 62%)',
            }}
          />
          <span className="absolute bottom-[16%] left-gutter right-gutter block max-w-[40rem]">
            <span className="block font-display text-[clamp(2.2rem,7vw,4.6rem)] uppercase leading-[0.9] text-paper">
              {f.label}
            </span>
            <span className="mt-3 block font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] italic leading-snug text-paper/70">
              {f.blurb}
            </span>
          </span>
        </motion.button>
      </AnimatePresence>

      {/* segmented progress, one tick per surface — the length is the point */}
      <div aria-hidden className="absolute inset-x-gutter top-4 flex gap-[3px]">
        {FRAMES.map((fr, j) => (
          <span
            key={fr.href}
            className={`h-[2px] flex-1 rounded-full transition-colors duration-tick ${
              j < i ? 'bg-paper/45' : j === i ? 'bg-acid' : 'bg-paper/15'
            }`}
          />
        ))}
      </div>

      <header className="pointer-events-none absolute left-gutter top-8 flex items-baseline gap-4">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/62">
          the fast tour
        </p>
        <p className="font-mono text-[0.62rem] uppercase tabular-nums tracking-[0.2em] text-tungsten">
          {String(i + 1).padStart(2, '0')} / {String(FRAMES.length).padStart(2, '0')}
        </p>
        {paused && !reduced && (
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/55">held</p>
        )}
      </header>

      <footer className="pointer-events-none absolute bottom-4 left-gutter right-gutter flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/55">
          {coarse ? (
            <>tap dives in</>
          ) : reduced ? (
            <>&larr; &rarr; page &middot; &crarr; dive in &middot; esc leave</>
          ) : (
            <>hover holds &middot; click dives in &middot; &larr; &rarr; scrub &middot; esc leave</>
          )}
        </p>
        <PrototypeDisclosure compact className="text-right" />
      </footer>
    </div>
  );
}
