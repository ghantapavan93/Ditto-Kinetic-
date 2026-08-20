'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { saidAs } from '@/lib/attention';
import {
  DECISIONS,
  INALIENABLE,
  isConsentOnly,
  ladder,
  lastWorthClimbing,
} from '@/lib/autonomy';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

/**
 * The ladder.
 *
 * Six rungs from "you do everything" to "you are told where to be", and the
 * closing argument of the whole site — because autonomy is how you lower the
 * attention bill, and the bill is not the only thing being paid.
 *
 * The nine decisions are the interface. They start on your side and cross to
 * the system's as you climb, so the trade is a physical movement rather than a
 * claim: you can watch what you are handing over in exchange for the time.
 *
 * Which is what makes the last rung land. Climbing from four to five moves
 * nothing — the decision sets are identical, no token crosses — and the only
 * thing that changes is that the system stops asking. The visual says it before
 * the copy does: you gave up nothing further, and you got nothing further,
 * except that nobody checks with you any more.
 *
 * Deliberately not a WebGL page. This one argues that attention is a cost, and
 * spending more of it than the argument needs would be a poor way to make that
 * point.
 */
export function AutonomyStage() {
  const rungs = useMemo(() => ladder(), []);
  const [level, setLevel] = useState(2);
  const rung = rungs[level];
  const ceiling = useMemo(() => lastWorthClimbing(rungs), [rungs]);
  const consentOnly = isConsentOnly(rungs, level);

  useEffect(() => {
    track('autonomy_viewed', { level });
  }, [level]);

  const taken = new Set<string>(rung.level.takes);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(72% 45% at 50% 0%, rgba(232,145,60,0.07), transparent 62%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.92), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[68rem] flex-col gap-9 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/45">
            level {rung.level.n} of {rungs.length - 1}
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[46rem]">
          <h1 className="font-display text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.92] text-paper">
            autonomy is
            <br />
            <span className="text-tungsten">a trade.</span>
          </h1>
          <p className="mt-5 max-w-[42ch] font-voice text-[clamp(1.1rem,2.4vw,1.45rem)] leading-snug text-paper/70">
            every rung buys back time by removing a decision. nobody ever prices the half
            being paid in.
          </p>
        </section>

        {/* the climb */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {rungs.map((r) => (
            <button
              key={r.level.n}
              onClick={() => setLevel(r.level.n)}
              data-cursor="climb"
              className={`flex-1 border-t-2 pt-2 text-left transition-colors ${
                r.level.n === level
                  ? 'border-tungsten'
                  : r.level.n <= level
                    ? 'border-paper/40 hover:border-paper/70'
                    : 'border-paper/12 hover:border-paper/40'
              }`}
            >
              <span
                className={`block font-mono text-[0.6rem] tabular-nums ${
                  r.level.n === level ? 'text-tungsten' : 'text-paper/30'
                }`}
              >
                {r.level.n}
              </span>
              <span
                className={`mt-0.5 block font-editorial text-[0.68rem] lowercase leading-tight tracking-wide ${
                  r.level.n === level ? 'text-paper' : 'text-paper/30'
                }`}
              >
                {r.level.name}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
          {/* what it is */}
          <section>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={rung.level.n}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-voice text-[1.25rem] leading-snug text-paper/85">
                  {rung.level.says}
                </p>

                <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                  <div>
                    <p className="font-editorial text-[0.6rem] uppercase tracking-[0.24em] text-paper/35">
                      costs you a week
                    </p>
                    <p className="mt-1.5 font-display text-[1.9rem] leading-none text-paper">
                      {saidAs(rung.attending)}
                    </p>
                  </div>
                  <div>
                    <p className="font-editorial text-[0.6rem] uppercase tracking-[0.24em] text-paper/35">
                      still yours
                    </p>
                    <p className="mt-1.5 font-display text-[1.9rem] leading-none text-paper">
                      {rung.yours} of {DECISIONS.length}
                    </p>
                  </div>
                  <div>
                    <p className="font-editorial text-[0.6rem] uppercase tracking-[0.24em] text-paper/35">
                      asks you first
                    </p>
                    <p
                      className={`mt-1.5 font-display text-[1.9rem] leading-none ${
                        rung.level.confirms ? 'text-mint' : 'text-acid'
                      }`}
                    >
                      {rung.level.confirms ? 'yes' : 'no'}
                    </p>
                  </div>
                </div>

                {rung.boughtPerDecision !== null && (
                  <p className="mt-5 max-w-[40ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/45">
                    this rung bought {saidAs(rung.boughtPerDecision)} a week for each decision
                    it took. the first rung bought{' '}
                    {saidAs(rungs[1].boughtPerDecision ?? 0)} for each of its two.
                  </p>
                )}

                {rung.level.unbuilt && (
                  <p className="mt-5 max-w-[42ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-acid/70">
                    this is the one level nothing here was built for, and the reason is on the
                    right.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* the nine decisions, crossing over */}
          <section aria-label="Who decides what">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-editorial text-[0.6rem] uppercase tracking-[0.24em] text-paper/35">
                yours
              </p>
              <p className="font-editorial text-[0.6rem] uppercase tracking-[0.24em] text-paper/35">
                theirs
              </p>
            </div>

            <ul className="mt-3 grid gap-1.5">
              {DECISIONS.map((d) => {
                const gone = taken.has(d);
                const locked = d === INALIENABLE;
                return (
                  <li key={d} className="relative h-[26px]">
                    {/*
                      The token slides across rather than changing colour in
                      place, so handing something over reads as a movement you
                      can watch instead of a state you are told about.
                    */}
                    <motion.span
                      animate={{ x: gone ? '100%' : '0%', opacity: gone ? 0.45 : 1 }}
                      transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                      className={`absolute inset-y-0 flex w-1/2 items-center px-2 font-editorial text-[0.72rem] lowercase leading-none tracking-wide ${
                        locked
                          ? 'justify-start border-l-2 border-mint/60 text-mint/80'
                          : gone
                            ? 'justify-end border-r-2 border-acid/40 text-paper/45'
                            : 'justify-start border-l-2 border-paper/30 text-paper/80'
                      }`}
                    >
                      {d}
                    </motion.span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 max-w-[36ch] font-editorial text-[0.72rem] lowercase leading-relaxed tracking-wide text-paper/30">
              the one in mint never crosses. a system that took it would not be arranging an
              evening any more — it would be arranging a person.
            </p>
          </section>
        </div>

        {/* the finding */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="max-w-[56ch] border-t border-paper/12 pt-8"
        >
          <AnimatePresence mode="popLayout">
            {consentOnly ? (
              <motion.div
                key="consent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <p className="font-display text-[clamp(1.4rem,3.4vw,2.1rem)] uppercase leading-none text-acid">
                  nothing crossed.
                </p>
                <p className="mt-4 font-voice text-[1.2rem] leading-snug text-paper/80">
                  level five hands over exactly what level four already had. the decision sets
                  are identical — watch the list, nothing moved. what it removes is the
                  asking.
                </p>
                <p className="mt-4 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/45">
                  so it is the first rung that costs something and buys nothing. and it is
                  also, on both attention measures, the cheapest thing here — eight seconds a
                  week, and the least of all to explain, because there is nothing to look at.
                </p>
                <p className="mt-5 max-w-[46ch] font-voice text-[1.15rem] italic leading-snug text-tungsten/85">
                  which is the whole reason attention cannot be the only number. optimise for
                  it alone and this is where you land.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="climbing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/35">
                  the last rung worth climbing
                </p>
                <p className="mt-3 font-display text-[clamp(1.4rem,3.4vw,2.1rem)] uppercase leading-none text-paper">
                  level {ceiling.level.n} — {ceiling.level.name}
                </p>
                <p className="mt-4 font-voice text-[1.2rem] leading-snug text-paper/75">
                  every rung up to it hands over decisions and still puts the result in front
                  of you before it happens. that is the line, and it is about consent rather
                  than about capability.
                </p>
                <button
                  onClick={() => setLevel(5)}
                  data-cursor="go one further"
                  className="mt-6 border border-acid/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-acid transition-colors hover:bg-acid hover:text-ink"
                >
                  and one rung further →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href="/attention"
            data-cursor="the other half"
            className="mt-8 inline-block font-editorial text-[0.74rem] lowercase tracking-wide text-paper/35 underline-offset-4 hover:text-paper hover:underline"
          >
            the other half of this trade →
          </Link>
        </motion.section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}
