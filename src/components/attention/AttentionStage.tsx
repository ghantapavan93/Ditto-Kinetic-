'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SURFACES } from '@/data/attentionInventory';
import {
  SECONDS_PER_DECISION,
  WEEKLY_BUDGET_SECONDS,
  WORDS_PER_MINUTE,
  audit,
  saidAs,
} from '@/lib/attention';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

/**
 * The bill.
 *
 * Every consumer product optimises for time spent. Ditto's stated purpose is
 * the opposite, which turns every pixel into a cost rather than an achievement
 * — and taking that seriously means being willing to point the instrument at
 * yourself before pointing it at anybody else.
 *
 * So this audits this site. Every surface, counted from their own source by
 * a script that `npm run check` re-runs, priced against what a real week of the
 * product actually asks for. The result is unflattering and that is the point:
 * a prototype arguing that interfaces should get out of the way costs seventeen
 * weeks of the thing it is arguing about.
 *
 * That is defensible. An argument is not a product and is allowed to be
 * expensive. It is only defensible with the number attached, though, which is
 * the entire reason this page exists rather than a paragraph claiming restraint.
 */
export function AttentionStage() {
  const a = useMemo(() => audit(SURFACES), []);
  const [showing, setShowing] = useState<'all' | 'product'>('all');

  const rows = useMemo(
    () => (showing === 'all' ? a.costs : a.costs.filter((c) => c.surface.kind === 'product')),
    [a.costs, showing],
  );

  const shown = rows.reduce((t, c) => t + c.seconds, 0);
  const worst = Math.max(...a.costs.map((c) => c.seconds));

  useEffect(() => {
    track('attention_viewed', { total: Math.round(a.total) });
  }, [a.total]);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(70% 42% at 50% 0%, rgba(232,145,60,0.07), transparent 60%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.92), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[66rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            the bill
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[48rem]">
          <h1 className="font-display text-[clamp(2rem,6vw,3.7rem)] uppercase leading-[0.92] text-paper">
            every pixel
            <br />
            is something
            <br />
            <span className="text-tungsten">you spent.</span>
          </h1>

          <p className="mt-6 max-w-[44ch] font-voice text-[clamp(1.15rem,2.5vw,1.5rem)] leading-snug text-paper/70">
            a product whose purpose is to get you off it cannot count time spent as a win.
            it has to count it as a bill — so here is ours.
          </p>
        </section>

        <SnapshotRow
          srcs={['/photos/moment-08.webp']}
          note="time spent here is the bill."
        />

        {/* the headline */}
        <section className="border-t border-paper/12 pt-8">
          <div className="flex flex-wrap items-end gap-x-14 gap-y-6">
            <div>
              <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                a week of the real product
              </p>
              <p className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none text-mint">
                {WEEKLY_BUDGET_SECONDS}s
              </p>
              <p className="mt-2 max-w-[24ch] font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55">
                read one text, decide, reply.
              </p>
            </div>

            <div>
              <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                this site
              </p>
              <p className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none text-acid">
                {saidAs(a.total)}
              </p>
              <p className="mt-2 max-w-[26ch] font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55">
                which is {a.weeksOfProduct.toFixed(0)} weeks of the thing it is arguing about.
              </p>
            </div>
          </div>

          {/*
            The concession, up front and with the number attached. A page about
            restraint that quietly exempted itself would be worth nothing.
          */}
          {/* Derived. "four months" was written down, and 18 weeks will not
              stay 18 weeks as the site grows. */}
          <p className="mt-7 max-w-[52ch] font-voice text-[1.2rem] leading-snug text-paper/80">
            {(a.weeksOfProduct / 4.35).toFixed(0)} months of ditto, to read one prototype
            about ditto. that is defensible — an argument is not a product and is allowed to
            cost more — but only if somebody says it with the figure next to it.
          </p>
        </section>

        {/* the itemisation */}
        <section aria-label="What each surface costs">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
              itemised · {saidAs(shown)}
            </p>
            <div className="flex gap-4">
              {(
                [
                  ['all', 'everything'],
                  ['product', 'only what could ship'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setShowing(key)}
                  data-cursor="filter it"
                  className={`py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                    showing === key
                      ? 'text-tungsten underline'
                      : 'text-paper/55 hover:text-paper hover:underline'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-5 grid gap-2">
            {rows.map((c, i) => (
              <motion.li
                key={c.surface.path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.035, duration: 0.4 }}
                className="grid gap-1.5 border-t border-paper/[0.07] pt-2.5 sm:grid-cols-[9rem_1fr_7rem] sm:items-baseline sm:gap-5"
              >
                <Link
                  href={c.surface.path}
                  data-cursor="go and spend it"
                  className="py-1.5 font-mono text-[0.78rem] text-paper/70 underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  {c.surface.path}
                </Link>

                {/* reading and deciding, stacked, so the shape of the cost reads */}
                <div className="flex h-[7px] w-full items-stretch gap-px">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.readingSeconds / worst) * 100}%` }}
                    transition={{ delay: 0.1 + i * 0.035, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="block rounded-[1px] bg-paper/40"
                  />
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.decidingSeconds / worst) * 100}%` }}
                    transition={{ delay: 0.1 + i * 0.035, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="block rounded-[1px] bg-acid/60"
                  />
                </div>

                <div className="flex items-baseline justify-between gap-3 sm:justify-end">
                  <span className="font-mono text-[0.74rem] tabular-nums text-paper/55">
                    {saidAs(c.seconds)}
                  </span>
                  <span
                    className={`font-mono text-[0.55rem] uppercase tracking-[0.14em] ${
                      c.surface.kind === 'product' ? 'text-mint' : 'text-paper/55'
                    }`}
                  >
                    {c.surface.kind}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>

          <p className="mt-4 max-w-[52ch] font-editorial text-[0.76rem] lowercase leading-relaxed tracking-wide text-paper/55">
            pale is reading, pink is deciding. every control costs{' '}
            {SECONDS_PER_DECISION} seconds even when you decline it, because it still has to
            be read and dismissed. reading runs at {WORDS_PER_MINUTE} words a minute. both
            rates are assumptions; the words and the controls are counted from the source.
          </p>
        </section>

        {/* what it teaches */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-[54ch] border-t border-paper/12 pt-8"
        >
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            the thing worth taking from it
          </p>

          <p className="mt-3 font-voice text-[1.3rem] leading-snug text-paper">
            the cheapest surface here is {a.cheapest.surface.path} at{' '}
            {saidAs(a.cheapest.seconds)} — and it is the one closest to the actual product.
          </p>

          <p className="mt-4 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            that is the thesis agreeing with itself, and it was not arranged. the surfaces
            that could ship are cheap because a product has nothing to explain; the surfaces
            that argue are expensive because arguing is what they are for. the dearest thing
            on the site is {a.dearest.surface.path}, which talks the most.
          </p>

          <p className="mt-4 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            spectacle is not the same axis. the camera at /zoom flies through ninety-six
            people and costs less than most of the pages that only have paragraphs, because
            it explains itself by moving.
          </p>

          <p className="mt-6 max-w-[48ch] font-voice text-[1.15rem] italic leading-snug text-tungsten">
            the goal was never a smaller interface. it was a smaller bill for the same
            evening.
          </p>

          <Link
            href="/next"
            data-cursor="what would have to be true"
            className="mt-8 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
          >
            and what would have to be true →
          </Link>
        </motion.section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}
