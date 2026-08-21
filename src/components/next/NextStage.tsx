'use client';

import { useEffect, useMemo } from 'react';
import { SURFACES } from '@/data/attentionInventory';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { OUT_OF_SCOPE, falsifiers, roadmap, roomSpread } from '@/lib/roadmap';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

/**
 * What would have to be true.
 *
 * The last surface, and deliberately not another argument. Fourteen pages
 * making a case with no plan for finding out whether the case holds is exactly
 * the failure this project keeps pointing at in other people's products, so the
 * end of it is the measurement rather than one more demonstration.
 *
 * Three things it has to do, in order of how uncomfortable they are.
 *
 * State the bet as a number. The room is worth up to 0.42 of utility to the
 * same two people in the same week, which is either the largest untouched lever
 * in the funnel or an artefact of weights chosen to make a point. Both readings
 * are live and the page says so.
 *
 * Order the work by cost rather than by ambition. The two cheapest things —
 * saying how it ends and saying why this room — touch no model, no data and no
 * screen, and could ship in a week. The expensive one is being allowed to send
 * nothing, and it is expensive for organisational reasons rather than technical
 * ones, which is the honest reason it is last.
 *
 * And publish the ways it loses. A thesis that cannot fail is not a thesis.
 * Each falsifier is written as an observation somebody could go and make, not
 * as a risk, because "we might be wrong" commits to nothing.
 */
export function NextStage() {
  const steps = useMemo(() => roadmap(), []);
  const spread = useMemo(() => roomSpread(), []);
  const kills = useMemo(() => falsifiers(), []);
  const biggest = Math.max(...spread.map((s) => s.spread));

  useEffect(() => {
    track('next_viewed');
  }, []);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(70% 45% at 50% 2%, rgba(232,145,60,0.08), transparent 62%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[70rem] flex-col gap-12 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            what happens next
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[50rem]">
          <h1 className="font-display text-[clamp(2rem,6vw,3.8rem)] uppercase leading-[0.92] text-paper">
            the next thing
            <br />
            is not another
            <br />
            <span className="text-tungsten">screen.</span>
          </h1>

          <p className="mt-7 max-w-[46ch] font-voice text-[clamp(1.15rem,2.5vw,1.55rem)] leading-snug text-paper/70">
            {SURFACES.length} surfaces arguing one idea, with no way of finding out whether the idea
            is right, is the same mistake this whole site has been pointing at.
          </p>
        </section>

        {/* the bet */}
        <section className="max-w-[52rem] border-t border-paper/12 pt-8">
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            the bet, as a number
          </p>

          <p className="mt-4 font-display text-[clamp(3.4rem,12vw,7rem)] leading-[0.85] text-tungsten">
            {biggest.toFixed(2)}
          </p>

          <p className="mt-4 max-w-[44ch] font-voice text-[1.25rem] leading-snug text-paper/80">
            how much the room alone is worth to the same two people, in the same week, with
            nothing about either of them changed.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            {spread.map((s) => (
              <span key={s.pair} className="font-mono text-[0.72rem] tabular-nums text-paper/62">
                {s.pair.toLowerCase()} · {s.spread.toFixed(3)}
              </span>
            ))}
          </div>

          {/*
            Both readings are live and the page has to say so. A number produced
            by weights that were chosen to make a point is evidence about the
            point, not about the world.
          */}
          <p className="mt-6 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            that is either the largest untouched lever in the funnel, or an artefact of
            weights picked to make an argument legible. it is synthetic either way. the only
            thing that separates those two readings is a measurement nobody here can run.
          </p>
        </section>

        {/* the order */}
        <section aria-label="What to ship, cheapest first">
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            in this order, because this is the order of what it costs
          </p>

          <ol className="mt-5 grid gap-3">
            {steps.map((step, i) => (
              <motion.li
                key={step.n}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-display text-[1.35rem] uppercase leading-none text-paper">
                    <span className="mr-3 font-mono text-[0.7rem] text-paper/55">
                      {String(step.n).padStart(2, '0')}
                    </span>
                    {step.title}
                  </h2>
                  <span
                    className={`font-mono text-[0.6rem] uppercase tracking-[0.16em] ${
                      step.effort === 'days'
                        ? 'text-mint'
                        : step.effort === 'weeks'
                          ? 'text-tungsten'
                          : 'text-acid'
                    }`}
                  >
                    {step.effort}
                  </span>
                </div>

                <p className="mt-2.5 max-w-[58ch] font-voice text-[1.05rem] leading-snug text-paper/75">
                  {step.worth}
                </p>

                <div className="mt-3 grid gap-1">
                  <p className="font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/62">
                    <span className="text-paper/55">costs — </span>
                    {step.cost}
                  </p>
                  <p className="font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/62">
                    <span className="text-paper/55">touches — </span>
                    {step.touches}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>

          <p className="mt-5 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            the two cheapest change no model, no data and no screen. they are a week of work
            and they are aimed at the same number as the expensive one.
          </p>
        </section>

        {/* how it loses */}
        <section aria-label="What would make this wrong" className="border-t border-paper/12 pt-8">
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            and here is how it loses
          </p>
          <p className="mt-3 max-w-[46ch] font-voice text-[1.3rem] leading-snug text-paper">
            a thesis that cannot fail is not a thesis. four ways this one does.
          </p>

          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {kills.map((f) => (
              <li
                key={f.claim}
                className="rounded-artifact border border-acid/20 bg-acid/[0.03] px-5 py-4"
              >
                <p className="font-voice text-[1.05rem] leading-snug text-paper/85">
                  {f.claim}
                </p>
                <p className="mt-3 border-t border-paper/10 pt-3 font-editorial text-[0.78rem] lowercase leading-relaxed tracking-wide text-paper/50">
                  {f.killedBy}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* declined */}
        <section aria-label="Deliberately not attempted" className="border-t border-paper/12 pt-8">
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            not attempted, on purpose
          </p>

          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {OUT_OF_SCOPE.map((o) => (
              <li key={o.title}>
                <p className="font-display text-[1.1rem] uppercase leading-none text-paper/70">
                  {o.title}
                </p>
                <p className="mt-2.5 font-editorial text-[0.78rem] lowercase leading-relaxed tracking-wide text-paper/62">
                  {o.why}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="max-w-[46ch] border-t border-paper/12 pt-8">
          <p className="font-voice text-[1.35rem] italic leading-snug text-tungsten">
            the right person can still get the wrong first date.
          </p>
          <p className="mt-3 font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            that is the whole claim. everything here exists to make it specific enough to
            be tested, and the next honest move is somebody testing it.
          </p>
        </section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}
