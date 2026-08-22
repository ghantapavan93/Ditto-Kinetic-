'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { HELD_BACK } from '@/data/heldBack';
import { QUESTIONS, STARTING_TRAITS } from '@/data/livingProfile';
import { actionable, applyAnswer } from '@/lib/profile';
import { ODDS_CEILING, guaranteeCost, oddsFor } from '@/lib/odds';
import { SEND_THRESHOLD } from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

type Phase = 'idle' | 'spinning' | 'landed' | 'refused';

/**
 * The slot machine, and what it will not do.
 *
 * The observed onboarding ends on exactly this: a personalised probability and
 * a lever, followed by "invite a friend for a guaranteed match". The mechanic
 * is kept here rather than mocked, because the instinct behind it is right — a
 * computed personal number genuinely is more honest than a progress bar, and
 * showing it beats hiding it.
 *
 * Two things are changed and both are the point.
 *
 * The number is decomposed. Seventy-nine percent with no account of what made
 * it seventy-nine can only be reacted to, and reacting is what a slot machine
 * is for. Broken into contributions it becomes a readout you can argue with,
 * and it turns out one of the four is not the user's fault at all — the rooms
 * that clear the bar for you are the platform's problem, and it says so.
 *
 * And the lever refuses. Pulling for a guarantee spins the reels at 100 and
 * jams them at the ceiling, because one match per person per Wednesday is a
 * closed system and certainty for you is somebody else's evening spent without
 * being asked. The machine naming the specific pair who would pay is the
 * strongest thing on this page, and it is computed, not written.
 */
export function OddsStage() {
  const pair = PAIRS[0];

  const knownConfidence = useMemo(() => {
    let traits = STARTING_TRAITS;
    for (const q of QUESTIONS) traits = applyAnswer(traits, q.answers[0], 'earlier').traits;
    const known = actionable(traits);
    return known.length ? known.reduce((t, x) => t + x.confidence, 0) / known.length : 0;
  }, []);

  const odds = useMemo(
    () => oddsFor(pair.personA, pair, knownConfidence),
    [pair, knownConfidence],
  );
  const cost = useMemo(() => guaranteeCost(odds.value, HELD_BACK), [odds.value]);

  const [phase, setPhase] = useState<Phase>('idle');
  const target = phase === 'refused' ? ODDS_CEILING : odds.value;

  useEffect(() => {
    track('odds_viewed', { odds: Math.round(odds.value * 100) });
  }, [odds.value]);

  const pull = () => {
    if (phase === 'spinning') return;
    setPhase('spinning');
    track('odds_pulled');
    setTimeout(() => setPhase('landed'), 1500);
  };

  const pullForGuarantee = () => {
    setPhase('spinning');
    track('odds_guarantee_attempted');
    setTimeout(() => setPhase('refused'), 1900);
  };

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(70% 45% at 50% 2%, rgba(255,216,77,0.09), transparent 60%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[64rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            step 25 of 25
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <div className="grid gap-12 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
          {/* the machine */}
          <section>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
              your chance on drop day
            </p>

            <Reels phase={phase} target={target} />

            {phase === 'idle' && (
              <button
                onClick={pull}
                data-cursor="pull it"
                className="mt-6 w-full border border-tungsten/60 px-5 py-3 font-editorial text-[0.8rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
              >
                pull the lever
              </button>
            )}

            {phase === 'landed' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={pullForGuarantee}
                data-cursor="try it"
                className="mt-6 w-full border border-acid bg-acid px-5 py-3 font-editorial text-[0.8rem] lowercase tracking-wide text-ink transition-colors hover:bg-transparent hover:text-acid"
              >
                invite a friend for a guaranteed match
              </motion.button>
            )}

            {phase === 'refused' && (
              <p className="mt-6 border border-paper/15 px-5 py-3 text-center font-editorial text-[0.76rem] lowercase tracking-wide text-paper/62">
                it stops at {Math.round(ODDS_CEILING * 100)}. it always stops at{' '}
                {Math.round(ODDS_CEILING * 100)}.
              </p>
            )}
          </section>

          <SnapshotRow
            srcs={['/photos/print-selfie-04.webp']}
            note="the honest number first."
          />

          {/* the readout */}
          <section>
            <AnimatePresence mode="popLayout">
              {phase === 'idle' && (
                <motion.div key="idle" exit={{ opacity: 0 }}>
                  <h1 className="font-display text-[clamp(1.8rem,4.6vw,2.9rem)] uppercase leading-[0.95] text-paper">
                    a number
                    <br />
                    you can
                    <br />
                    <span className="text-tungsten">argue with.</span>
                  </h1>
                  <p className="mt-6 max-w-[38ch] font-voice text-[1.15rem] leading-snug text-paper/65">
                    a personalised probability is a better thing to show someone than a
                    progress bar. it only becomes a slot machine when you cannot see what
                    made it.
                  </p>
                </motion.div>
              )}

              {(phase === 'landed' || phase === 'refused') && (
                <motion.div
                  key="factors"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
                    what made it {Math.round(odds.value * 100)}
                  </p>

                  <ul className="mt-4 grid gap-2.5">
                    {odds.factors.map((f, i) => (
                      <motion.li
                        key={f.key}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.09, duration: 0.45 }}
                        className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-3"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-editorial text-[0.8rem] lowercase tracking-wide text-paper/70">
                            {f.label}
                          </span>
                          <span className="font-mono text-[0.78rem] tabular-nums text-mint">
                            +{Math.round(f.points * 100)}
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-[46ch] font-editorial text-[0.72rem] lowercase leading-relaxed tracking-wide text-paper/62">
                          {f.says}
                        </p>
                        {!f.actionable && (
                          <p className="mt-1.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-acid">
                            not yours to fix
                          </p>
                        )}
                      </motion.li>
                    ))}
                  </ul>

                  {odds.bestMove && (
                    <p className="mt-5 max-w-[44ch] font-voice text-[1.05rem] leading-snug text-tungsten">
                      the cheapest real thing you could do is {odds.bestMove.asMove}. not
                      invite anybody.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* the refusal */}
        <AnimatePresence>
          {phase === 'refused' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[54ch] border-t border-paper/12 pt-8"
            >
              <p className="font-display text-[clamp(1.4rem,3.4vw,2.1rem)] uppercase leading-none text-paper">
                a guarantee is not ours to sell.
              </p>

              <p className="mt-5 font-voice text-[1.2rem] leading-snug text-paper/75">
                one match each, one wednesday. that is a closed system — a guaranteed match
                cannot be made, only moved. the {Math.round(cost.gap * 100)}{' '}
                points between your odds and certainty are somebody else&rsquo;s evening.
              </p>

              {cost.fundedBy && (
                <div className="mt-6 border-l-2 border-acid/50 pl-4">
                  <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                    it would be theirs
                  </p>
                  <p className="mt-2 font-display text-[1.3rem] uppercase leading-none text-paper">
                    {cost.fundedBy.personA.name} <span className="text-paper/55">×</span>{' '}
                    {cost.fundedBy.personB.name}
                  </p>
                  <p className="mt-3 max-w-[46ch] font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/50">
                    their best room this week scores {cost.theirUtility.toFixed(3)} against a
                    bar of {SEND_THRESHOLD} — {cost.theirShortfall.toFixed(3)} short. we held
                    them back and told them why. guaranteeing your wednesday means sending
                    that evening anyway.
                  </p>
                  <p className="mt-4 max-w-[44ch] font-voice text-[1.1rem] italic leading-snug text-tungsten">
                    they did not ask to pay for it, and nobody would have told them they had.
                  </p>
                </div>
              )}

              <Link
                href="/held-back"
                data-cursor="see them"
                className="mt-8 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
              >
                see who we held back →
              </Link>
            </motion.section>
          )}
        </AnimatePresence>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}

/**
 * Three reels.
 *
 * The digits during a spin are generated from a counter rather than
 * `Math.random`, which looks identical at speed and keeps this file consistent
 * with the rest of the project — nothing here is allowed to be different on
 * every render without a reason.
 */
function Reels({ phase, target }: { phase: Phase; target: number }) {
  const [tick, setTick] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (phase !== 'spinning') return;
    const loop = () => {
      setTick((t) => t + 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  const settled = phase === 'landed' || phase === 'refused';
  const shown = Math.round(target * 100);
  const digits = settled
    ? String(shown).padStart(2, '0').split('')
    : [0, 1].map((i) => String((tick * 7 + i * 3) % 10));

  return (
    <div className="mt-4 flex items-stretch gap-2">
      {digits.map((d, i) => (
        <div
          key={i}
          className="relative flex h-[7.5rem] flex-1 items-center justify-center overflow-hidden rounded-artifact border border-paper/15 bg-ink-soft"
        >
          <motion.span
            key={`${d}-${settled}`}
            initial={settled ? { y: -24, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: settled ? i * 0.12 : 0 }}
            className={`font-display text-[clamp(3rem,9vw,4.4rem)] leading-none ${
              phase === 'refused' ? 'text-acid' : 'text-paper'
            }`}
          >
            {d}
          </motion.span>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(11,9,7,0.85) 0%, transparent 26%, transparent 74%, rgba(11,9,7,0.85) 100%)',
            }}
          />
        </div>
      ))}
      <div className="flex items-center justify-center px-1 font-display text-[clamp(1.6rem,4vw,2.4rem)] text-paper/55">
        %
      </div>
    </div>
  );
}
