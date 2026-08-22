'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EVIDENCE, WAYS_IN, costOfWay, shortestWay } from '@/lib/waysIn';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

/**
 * The front door.
 *
 * Built because a review of this project pointed out something obvious in
 * hindsight: every surface is reachable and not
 * one of them recommended. A person with four minutes admires the stage and
 * never finds the two screens that would have convinced them.
 *
 * So this page recommends. Five lanes, each naming a situation rather than a
 * job title, each pointing at exactly one route, and each stating what that
 * route does not settle — because a recommendation without its limit is a sales
 * pitch with extra steps, and this whole project is an argument against those.
 *
 * It also carries the ask, which was missing everywhere. A site this size with
 * no way to reply is not modesty, it is an unfinished thought.
 */
export function StartStage() {
  const shortest = shortestWay();

  useEffect(() => {
    track('start_viewed', { routes: EVIDENCE.routes });
  }, []);

  return (
    <div className="u-stack-grain relative min-h-screen bg-ink">
      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[54rem] flex-col gap-9 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">
            start here
          </p>
          <Link
            href="/all"
            data-cursor="everything at once"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            all {EVIDENCE.routes} →
          </Link>
        </header>

        <section className="max-w-[40rem]">
          <h1 className="font-display text-[clamp(2rem,6.4vw,4rem)] uppercase leading-[0.9] text-paper">
            five ways in.
          </h1>
          <p className="mt-5 max-w-[46ch] font-voice text-[clamp(1.05rem,2.4vw,1.35rem)] leading-snug text-paper/70">
            an unofficial concept for ditto, built around one line: the right person
            can still get the wrong first date. rank the pair <em>and</em> the evening.
          </p>
          <p className="mt-3 max-w-[46ch] font-voice text-[clamp(1.05rem,2.4vw,1.35rem)] leading-snug text-paper/70">
            there are {EVIDENCE.routes} surfaces and you should not open{' '}
            {EVIDENCE.routes} of them. pick the one that&rsquo;s yours. the shortest is{' '}
            <Link
              href={shortest.route}
              className="inline-block py-0.5 text-tungsten underline-offset-4 hover:underline"
            >
              {shortest.route}
            </Link>
            , at about {Math.round(costOfWay(shortest))} seconds.
          </p>
        </section>

        <SnapshotRow
          srcs={['/photos/twilight-stroll.webp', '/photos/print-selfie-01.webp']}
          note="same two people. six evenings."
        />

        {/* the lanes */}
        <section aria-label="Five ways into this project" className="grid gap-0">
          {WAYS_IN.map((way, i) => (
            <motion.div
              key={way.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-paper/[0.09] py-4"
            >
              <Link
                href={way.route}
                data-cursor="open it"
                onClick={() => track('start_lane_taken', { lane: way.key, route: way.route })}
                className="group grid gap-2 sm:grid-cols-[1fr_auto] sm:items-baseline"
              >
                <div>
                  <p className="font-voice text-[clamp(1.05rem,2.4vw,1.3rem)] leading-snug text-paper/85 transition-colors group-hover:text-paper">
                    {way.forWhom}
                  </p>
                  <p className="mt-1.5 max-w-[52ch] font-editorial text-[0.95rem] leading-snug text-paper/50">
                    {way.does}
                  </p>
                  {/* the half nobody else prints */}
                  <p className="mt-1.5 max-w-[52ch] font-editorial text-[0.95rem] leading-snug text-paper/55">
                    doesn&rsquo;t: {way.doesNot}
                  </p>
                </div>
                <p className="py-1.5 shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-tungsten transition-colors group-hover:text-tungsten sm:text-right">
                  {way.route}
                  <span className="ml-2 text-paper/55">
                    {Math.round(costOfWay(way))}s
                  </span>
                </p>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* what it is willing to say about itself, in generated numbers */}
        <section className="border-t border-paper/[0.09] pt-5">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
            what&rsquo;s underneath
          </p>
          <p className="mt-3 max-w-[52ch] font-voice text-[1.05rem] leading-snug text-paper/65">
            no test framework. instead {EVIDENCE.claims} numbered claims and{' '}
            {EVIDENCE.assertions.toLocaleString()} assertions that every number shown here is
            computed from the model rather than written into the copy. those three
            figures are generated by running the suite, so this sentence cannot
            drift from the thing it describes.
          </p>
          <p className="mt-3 max-w-[52ch] font-voice text-[1.05rem] leading-snug text-paper/62">
            every person and signal is synthetic. no student data, no scraping, and
            no access to ditto&rsquo;s systems — the reasoning here is argued from public
            positioning, never presented as theirs.
          </p>
        </section>

        {/* the ask, which was missing from every route */}
        <section className="border-t border-paper/[0.09] pt-5">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
            the ask
          </p>
          <p className="mt-3 max-w-[46ch] font-voice text-[clamp(1.05rem,2.4vw,1.3rem)] leading-snug text-paper/75">
            it&rsquo;s a conversation, not a submission. the most useful reply is which
            of these is wrong — the model is argued, not measured, and the fastest
            way to improve it is somebody who has seen the real thing saying so.
          </p>
        </section>

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
          <Link
            href="/next"
            data-cursor="how it loses"
            className="py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            what would have to be true &mdash; and how it loses &rarr;
          </Link>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
