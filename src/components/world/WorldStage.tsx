'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SCHOOLS, barAt, buildWorld, survivorsAt } from '@/lib/world';
import { SEND_THRESHOLD } from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

const WorldField = dynamic(() => import('./WorldField').then((m) => m.WorldField), {
  ssr: false,
});

/**
 * The world.
 *
 * `/network` is one campus; this is every campus Ditto ever expands to, and it
 * is here to contradict the most natural assumption anybody makes about that
 * expansion: that more schools means better matching for everyone already on.
 *
 * Every number on this surface is read off the model. Nothing is written.
 */
export function WorldStage() {
  const world = useMemo(() => buildWorld(), []);
  const [priced, setPriced] = useState(false);

  useEffect(() => {
    track('world_viewed', { pool: world.pool });
  }, [world.pool]);

  const localSurvivors = useMemo(() => survivorsAt(world, 0).length, [world]);
  const gain = world.reachable.length - localSurvivors;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <WorldField world={world} priced={priced} />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(120% 70% at 12% 100%, rgba(11,9,7,0.92), transparent 58%), radial-gradient(90% 45% at 88% 0%, rgba(11,9,7,0.72), transparent 55%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[64rem] flex-col justify-between gap-8 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">
            every campus at once
          </p>
          <Link
            href="/network"
            data-cursor="back to one campus"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            ← one campus
          </Link>
        </header>

        <section className="max-w-[36rem]">
          <h1 className="font-display text-[clamp(2.2rem,7vw,4.4rem)] uppercase leading-[0.9] text-paper">
            eight campuses.
            <br />
            {world.pool.toLocaleString()} people.
          </h1>

          <AnimatePresence mode="wait">
            {!priced ? (
              <motion.div
                key="before"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6 }}
              >
                <p className="mt-5 max-w-[42ch] font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] leading-snug text-paper/70">
                  ditto grows one school at a time, and every new school is supposed to
                  make matching better for everyone already on.
                </p>
                <p className="mt-3 max-w-[42ch] font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] leading-snug text-paper/70">
                  that&rsquo;s {SCHOOLS}&times; the people. so it should be roughly {SCHOOLS}&times; the
                  options.
                </p>
                <button
                  onClick={() => {
                    setPriced(true);
                    track('world_priced', { multiplier: Number(world.multiplier.toFixed(2)) });
                  }}
                  data-cursor="price the trip"
                  className="mt-7 min-h-[44px] font-mono text-[0.68rem] uppercase tracking-[0.2em] text-tungsten underline-offset-[6px] transition-colors hover:underline"
                >
                  now make it a wednesday →
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mt-5 max-w-[44ch] font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] leading-snug text-paper/75">
                  a match isn&rsquo;t a candidate. it&rsquo;s an evening, in a room, on a
                  wednesday — and it has to be gettable-to.
                </p>
                <p className="mt-3 max-w-[44ch] font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] leading-snug text-paper/75">
                  price the trip and {SCHOOLS}&times; the people buys{' '}
                  <span className="text-tungsten">{world.multiplier.toFixed(1)}&times;</span> the
                  options. {world.deadSchools} of the {SCHOOLS - 1} schools you expanded to send
                  nobody at all.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* the ledger, always derived */}
        <section aria-label="What each school contributes">
          <AnimatePresence>
            {priced && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                <div className="grid gap-1.5">
                  <div className="flex items-baseline gap-3 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-paper/55">
                    <span className="w-[13rem] shrink-0">school</span>
                    <span className="w-14 text-right">trip</span>
                    <span className="w-14 text-right">bar</span>
                    <span className="w-20 text-right">survives</span>
                  </div>
                  {world.schools.map((school, i) => {
                    const alive = survivorsAt(world, i).length;
                    return (
                      <div
                        key={school.id}
                        className={`flex min-h-[26px] items-baseline gap-3 border-t border-paper/[0.06] pt-1.5 font-mono text-[0.66rem] ${
                          alive ? 'text-paper/70' : 'text-paper/55'
                        }`}
                      >
                        <span className="w-[13rem] shrink-0 truncate lowercase">{school.name}</span>
                        <span className="w-14 text-right">{school.minutes}m</span>
                        <span className={`w-14 text-right ${i === 0 ? 'text-tungsten' : ''}`}>
                          {barAt(school.minutes).toFixed(2)}
                        </span>
                        <span className={`w-20 text-right ${alive ? 'text-paper' : ''}`}>
                          {alive || '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 max-w-[52ch] font-voice text-[1.05rem] leading-snug text-paper/65">
                  your campus is {Math.round((1 / SCHOOLS) * 100)}% of the world and{' '}
                  {Math.round(world.localShare * 100)}% of what survives. the bar is only{' '}
                  {SEND_THRESHOLD} where the trip is free.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <footer className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-[40ch]">
            <AnimatePresence>
              {priced && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                >
                  {/* the turn: what scale actually buys */}
                  <p className="font-voice text-[clamp(1.05rem,2.3vw,1.35rem)] leading-snug text-paper/80">
                    scale doesn&rsquo;t widen the funnel. it raises the floor.
                  </p>
                  <p className="mt-2.5 font-voice text-[1.02rem] leading-snug text-paper/55">
                    {gain} people cleared a bar that was raised on them, so every one of them
                    had to be better than the median match at home
                    {world.worthTheTrip.length > 0 &&
                      ` — the best of them by ${(world.worthTheTrip[0].utility - world.localMedian).toFixed(2)}`}
                    . and none of them has a mutual friend with you. across two campuses,{' '}
                    <Link
                      href="/network"
                      className="text-tungsten underline-offset-4 hover:underline"
                    >
                      every edge is a missing edge
                    </Link>
                    .
                  </p>
                  <Link
                    href="/vision"
                    data-cursor="where this goes"
                    className="mt-6 inline-block font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
                  >
                    then the city →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
