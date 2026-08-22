'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { WAYPOINTS, distanceToPair, levelAt } from '@/lib/zoom';
import { spring, type Spring } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const ZoomScene = dynamic(() => import('./ZoomScene').then((m) => m.ZoomScene), {
  ssr: false,
});

const COPY: Record<string, { title: string; body: string }> = {
  world: {
    title: 'ninety-six people',
    body: 'six corners of one campus, and sixteen threads holding them together. one of those threads is lit, and it is the only one this site has ever been about.',
  },
  /*
   * The widest shot carries the only sentence about the future. Not a 2030
   * manifesto, not a roadmap section — one line and five words, visible
   * exactly when the camera is far enough out that a date is one thread among
   * many. Fly in and it leaves; the close shots stay about tonight.
   */
  connection: {
    title: 'two of them',
    body: 'you did not change scene. that thread had two ends, and this is what is at them — the same two people the stage spends an entire evening on.',
  },
  human: {
    title: 'one of them',
    body: 'and closer still, the things she is carrying into it. the reasons this might work, which belong to her and not to the room.',
  },
};

/**
 * The journey.
 *
 * Two scales existed on this site and they were two pages, which made the
 * relationship between them a sentence rather than something you could see.
 * This is one camera, moving through real distance, from a campus of
 * ninety-six down to the fragments one person carries.
 *
 * Scroll drives it, because scroll is the one input everybody already knows
 * means "go further in", and the position is integrated on a critically damped
 * spring so a jerky trackpad still produces a smooth flight. Arrow keys work
 * too, and reduced motion snaps to the waypoints instead.
 *
 * The copy changes at each level and the camera does not stop for it. Nothing
 * here is a page.
 */
export function ZoomStage() {
  const [t, setT] = useState(0);
  const reduced = useReducedMotion();

  const target = useRef(0);
  const smooth = useRef<Spring>({ x: 0, v: 0 });
  const raf = useRef(0);
  const last = useRef(0);

  const nudge = useCallback((delta: number) => {
    target.current = Math.max(0, Math.min(1, target.current + delta));
  }, []);

  useEffect(() => {
    track('zoom_viewed');
  }, []);

  // One integrator for the whole page. The spring is what turns a trackpad's
  // jitter into a camera move with mass.
  useEffect(() => {
    const tick = (now: number) => {
      const dt = last.current ? Math.min((now - last.current) / 1000, 1 / 30) : 1 / 60;
      last.current = now;

      if (reduced) {
        smooth.current.x = target.current;
        setT(target.current);
      } else {
        setT(spring(smooth.current, target.current, 6.5, dt));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      nudge(e.deltaY * 0.00085);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nudge(0.12);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nudge(-0.12);
      else return;
      e.preventDefault();
    };
    // Touch: drag vertically to fly. The wheel listener means nothing on a
    // phone, and a flight whose only mobile input is five tiny rail buttons
    // is a desktop page wearing a responsive layout.
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY;
      nudge((touchY - y) * 0.0022);
      touchY = y;
      e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [nudge]);

  const level = levelAt(t);
  const copy = COPY[level];
  const distance = distanceToPair(t);

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <ZoomScene t={t} reducedMotion={reduced} />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(120% 70% at 15% 100%, rgba(11,9,7,0.92), transparent 58%), radial-gradient(90% 45% at 85% 0%, rgba(11,9,7,0.75), transparent 55%)',
        }}
      />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62">
            one camera · {distance.toFixed(1)} units out
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[34rem]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-paper/55">
                {level}
              </p>
              <h1 className="mt-3 font-display text-[clamp(1.7rem,4.6vw,2.9rem)] uppercase leading-[0.95] text-paper">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-[38ch] font-voice text-[clamp(1rem,2.1vw,1.25rem)] leading-snug text-paper/70">
                {copy.body}
              </p>

              {level === 'world' && (
                <div className="mt-5">
                  <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.26em] text-paper/55">
                    {['date', 'friend', 'build', 'run', 'explore'].map((kind, i) => (
                      <span key={kind} className={i === 0 ? 'text-tungsten' : undefined}>
                        {kind}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2.5 font-voice text-[1.05rem] italic leading-snug text-paper/70">
                    dating is the first intersection.
                  </p>
                </div>
              )}

              {level === 'human' && (
                <ul className="mt-5 grid gap-1.5">
                  {PAIRS[0].fragments.slice(0, 3).map((f) => (
                    <li
                      key={f.text}
                      className="font-hand text-[1.05rem] leading-snug text-tungsten"
                    >
                      {f.text.split(' | ')[0]}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-[26rem]">
            <div className="flex items-baseline justify-between">
              {WAYPOINTS.map((w, i) => {
                const at = i / (WAYPOINTS.length - 1);
                const near = Math.abs(t - at) < 0.18;
                return (
                  <button
                    key={w.level}
                    onClick={() => {
                      target.current = at;
                    }}
                    data-cursor="go here"
                    className={`py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide transition-colors ${
                      near ? 'text-tungsten' : 'text-paper/55 hover:text-paper/70'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>

            {/* one continuous track, because it is one continuous move */}
            <div className="relative mt-2.5 h-px w-full bg-paper/15">
              <motion.span
                className="absolute -top-[3px] block h-[7px] w-[7px] rounded-full bg-tungsten"
                animate={{ left: `${t * 100}%` }}
                transition={{ duration: 0 }}
                style={{ transform: 'translateX(-50%)' }}
              />
            </div>

            <p className="mt-3 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55">
              scroll, drag, or use the arrow keys. nothing here is a page.
            </p>
          </div>

          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
