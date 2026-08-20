'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { sendDecision } from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { spring, type Spring } from '@/lib/motion';
import { track } from '@/lib/analytics';

/**
 * The hour before the drop.
 *
 * Three states, and the first one is the point: waiting. Ditto's whole model is
 * that one match a week beats infinite browsing, and scarcity only works if the
 * scarcity is *felt*. A countdown that is merely accurate would waste it — so
 * the clock is set enormous, the page is nearly empty, and there is deliberately
 * nothing to do.
 *
 * The seconds run on a critically damped spring rather than snapping, which is
 * the one piece of technique lifted (as method, not code) from kage: motion with
 * mass reads as authored, motion without it reads as wired up.
 */

type Phase = 'waiting' | 'arriving' | 'landed';

/** Milliseconds until the next Wednesday 19:00 local. */
function untilNextDrop(now: Date): number {
  const target = new Date(now);
  target.setHours(19, 0, 0, 0);
  const daysUntilWed = (3 - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + daysUntilWed);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7);
  return target.getTime() - now.getTime();
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function DropStage() {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [remaining, setRemaining] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const pair = PAIRS[0];
  const decision = useMemo(() => sendDecision(pair), [pair]);
  const scene = decision.send ? decision.scene : pair.scenes[0];

  // Clock starts on the client only — a server-rendered countdown would hydrate
  // wrong, and this one is about the exact second.
  useEffect(() => {
    const tick = () => setRemaining(untilNextDrop(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    track('drop_page_viewed');
  }, []);

  const t = remaining === null ? null : parts(remaining);

  const open = () => {
    if (phase !== 'waiting') return;
    setPhase('arriving');
    track('drop_opened_early');
    setTimeout(() => setPhase('landed'), 2100);
  };

  return (
    <div className="u-stack-grain fixed inset-0 overflow-hidden bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 60% at 50% 8%, rgba(255,184,101,0.10), transparent 60%), radial-gradient(120% 90% at 50% 108%, rgba(43,68,255,0.16), transparent 66%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.5rem)]">
        <header className="flex items-start justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/40">
            Westbrook · this week
          </p>
          <Link
            href="/"
            data-cursor="the other half"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/40 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        {/*
          No `mode="wait"`. It would gate the drop behind the wait screen's exit
          animation, so any stall in that animation means the match never
          arrives — the same trap already fixed in the handoff and the feedback
          receipt, and reintroduced here from muscle memory. Both states share
          one grid cell instead.
        */}
        <div className="grid">
        <AnimatePresence>
          {phase === 'waiting' && (
            <motion.section
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.6 } }}
              transition={{ duration: 0.8 }}
              className="col-start-1 row-start-1 max-w-[46rem]"
            >
              <p className="font-voice text-[1.2rem] italic text-paper/45">
                one match. one person. one introduction.
              </p>

              <h1 className="mt-4 font-display text-hero uppercase leading-[0.84] text-paper">
                wednesday
                <br />
                7:00 pm
              </h1>

              <Countdown t={t} reduced={reduced} />

              <p className="mt-8 max-w-[34ch] font-voice text-[1.15rem] leading-snug text-paper/50">
                nothing to browse until then. that is the whole idea.
              </p>

              <button
                onClick={open}
                data-cursor="don't wait"
                className="mt-8 border-b border-paper/25 pb-1 font-editorial text-[0.74rem] lowercase tracking-wide text-paper/45 transition-colors hover:border-tungsten hover:text-tungsten"
              >
                open it early — this is a prototype
              </button>
            </motion.section>
          )}

          {phase !== 'waiting' && (
            <motion.section
              key="drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="col-start-1 row-start-1 grid w-full max-w-[42rem] gap-6"
            >
              <motion.p
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                className="w-fit rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-voice text-[1.25rem] text-paper-bright shadow-lift"
              >
                found someone.
              </motion.p>

              <AnimatePresence>
                {phase === 'landed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                  >
                    <p className="font-display text-[clamp(2rem,6vw,3.6rem)] uppercase leading-none text-paper">
                      {pair.personA.name} <span className="text-acid">×</span>{' '}
                      {pair.personB.name}
                    </p>

                    <p className="mt-4 max-w-[32ch] font-voice text-[1.25rem] leading-snug text-paper/70">
                      {pair.personB.contradiction}
                    </p>

                    <div className="mt-7 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-paper/12 pt-5">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-paper/35">
                        proposed
                      </span>
                      <span className="font-display text-[1.5rem] uppercase leading-none text-paper">
                        {scene.label}
                      </span>
                      <span className="font-mono text-[0.9rem] tabular-nums text-tungsten/80">
                        {scene.time}
                      </span>
                      <span className="font-voice text-[1.05rem] italic text-paper/45">
                        {scene.location}
                      </span>
                    </div>

                    <Link
                      href="/"
                      data-cursor="see the reasoning"
                      onClick={() => track('drop_handoff_clicked')}
                      className="mt-8 inline-block border border-acid bg-acid px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-ink transition-colors hover:bg-transparent hover:text-acid"
                    >
                      see how we chose the room
                    </Link>

                    <p className="mt-5 max-w-[38ch] font-voice text-[1.05rem] italic leading-snug text-paper/35">
                      the match is the easy half. the room is the half that decides whether
                      they actually meet.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
        </div>

        <PrototypeDisclosure />
      </div>
    </div>
  );
}

/**
 * The clock.
 *
 * Seconds move on a spring so the digit change has weight rather than snapping,
 * and the whole thing is `tabular-nums` so nothing shifts sideways as it counts.
 */
function Countdown({
  t,
  reduced,
}: {
  t: { days: number; hours: number; minutes: number; seconds: number } | null;
  reduced: boolean;
}) {
  const bob = useRef<Spring>({ x: 0, v: 0 });
  const [y, setY] = useState(0);
  const last = useRef(-1);

  useEffect(() => {
    if (reduced || !t) return;
    if (t.seconds !== last.current) {
      last.current = t.seconds;
      bob.current.v = -26;
    }
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      setY(spring(bob.current, 0, 22, dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [t, reduced]);

  if (!t) {
    return <p className="mt-7 font-mono text-[1.1rem] text-paper/25">syncing…</p>;
  }

  const cells: [number, string][] = [
    [t.days, 'days'],
    [t.hours, 'hrs'],
    [t.minutes, 'min'],
    [t.seconds, 'sec'],
  ];

  return (
    <div className="mt-8 flex flex-wrap items-end gap-x-7 gap-y-3" aria-live="off">
      {cells.map(([value, label], i) => (
        <div key={label} className="flex items-baseline gap-1.5">
          <span
            className="font-mono text-[clamp(1.9rem,5vw,3.2rem)] tabular-nums leading-none text-paper"
            style={i === 3 ? { transform: `translateY(${y}px)` } : undefined}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span className="font-editorial text-[0.66rem] lowercase tracking-[0.18em] text-paper/30">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
