'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { buildCampus } from '@/lib/campus';
import { bridgeFor, readNetwork } from '@/lib/network';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

// WebGL only on the client. Imported here rather than in the page so the page
// can stay a server component.
const Constellation = dynamic(
  () => import('./Constellation').then((m) => m.Constellation),
  { ssr: false },
);

type Mode = 'affinity' | 'consequence';

/**
 * The world.
 *
 * The last missing layer, and the one every unbuilt idea turned out to depend
 * on. A bridge introduction needs somebody to be mutual. Zooming out needs
 * something to zoom out to. And "the introduction with the highest network
 * consequence" is not a question you can even ask about a pair.
 *
 * What it exists to show is a disagreement between two rankings of the same
 * candidates. Every "people you may know" system ranks by some form of triadic
 * closure — mutual friends, same places — and that signal is genuinely good at
 * predicting whether two people will get on. It is also, structurally, a
 * machine for recommending the introduction that changes the least, because the
 * people it favours are the ones you are already adjacent to.
 *
 * Rank the same candidates by how many people become newly reachable and you
 * get a different pair, in a different corner of campus, with no friends in
 * common at all.
 *
 * And then the line that made building this worth it, which is computed rather
 * than written: the affinity pick has a mutual friend who could make the
 * introduction, so those two never needed a product. The missing edge has
 * nobody. That is the introduction only a system can make, and it is exactly
 * the one a compatibility ranker will never surface.
 */
export function NetworkStage() {
  const campus = useMemo(() => buildCampus(), []);
  const net = useMemo(() => readNetwork(campus), [campus]);
  const reduced = useReducedMotion();

  const [mode, setMode] = useState<Mode>('affinity');
  const highlight = mode === 'affinity' ? net.byAffinity : net.byConsequence;

  const lonely = useMemo(() => new Set(net.isolated), [net.isolated]);
  const bridge = useMemo(
    () => bridgeFor(campus, highlight.a, highlight.b),
    [campus, highlight],
  );

  const name = (i: number) => campus.nodes[i].name;
  const where = (i: number) => campus.nodes[i].clusterName;

  useEffect(() => {
    track('network_viewed', { mode, consequence: highlight.consequence });
  }, [mode, highlight.consequence]);

  return (
    <div className="relative min-h-screen bg-ink">
      {/* the campus */}
      <div className="fixed inset-0">
        <Constellation
          campus={campus}
          highlight={highlight}
          lonely={lonely}
          reducedMotion={reduced}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 100%, rgba(11,9,7,0.94), transparent 62%), radial-gradient(90% 50% at 80% 0%, rgba(11,9,7,0.82), transparent 60%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[72rem] flex-col gap-8 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            {campus.nodes.length} people · {net.totalEdges} threads · {net.weakTies} of them
            crossing
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[38rem]">
          <h1 className="font-display text-[clamp(1.9rem,5.4vw,3.3rem)] uppercase leading-[0.92] text-paper">
            the important
            <br />
            connection isn&rsquo;t
            <br />
            <span className="text-tungsten">in the network yet.</span>
          </h1>

          <p className="mt-5 max-w-[40ch] font-voice text-[clamp(1.05rem,2.2vw,1.35rem)] leading-snug text-paper/70">
            a synthetic campus. six corners, and sixteen threads holding them together. every
            person here was generated — none of them are anybody.
          </p>
        </section>

        {/* the two rankings */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-paper/55">
            rank the same candidates by
          </span>
          {(
            [
              ['affinity', 'who would get on'],
              ['consequence', 'what would change'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              data-cursor="rank by this"
              className={`py-1.5 font-editorial text-[0.78rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                mode === key
                  ? 'text-tungsten underline'
                  : 'text-paper/55 hover:text-paper hover:underline'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          <motion.section
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[46rem] rounded-artifact border border-paper/12 bg-ink/70 px-6 py-5 backdrop-blur-md"
          >
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-paper/55">
              {mode === 'affinity' ? 'what a recommender picks' : 'the missing edge'}
            </p>

            <p className="mt-3 font-display text-[clamp(1.3rem,3vw,1.9rem)] uppercase leading-none text-paper">
              {name(highlight.a)} <span className="text-paper/55">×</span> {name(highlight.b)}
            </p>
            <p className="mt-2 font-editorial text-[0.76rem] lowercase tracking-wide text-paper/62">
              {where(highlight.a)}
              {where(highlight.a) === where(highlight.b) ? ' — both of them' : ` → ${where(highlight.b)}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.7rem] tabular-nums">
              <span className="text-paper/62">
                <span className="text-paper/55">mutual friends </span>
                {highlight.mutuals.length}
              </span>
              <span className="text-paper/62">
                <span className="text-paper/55">newly reachable </span>
                {highlight.consequence}
              </span>
            </div>

            {/*
              The whole page, in one derived sentence. The affinity pick already
              has somebody who could make the introduction — so those two never
              needed a product. The missing edge has nobody, which is precisely
              what a system is for.
            */}
            <p className="mt-5 max-w-[48ch] font-voice text-[1.12rem] leading-snug text-paper/85">
              {bridge !== null ? (
                <>
                  {name(bridge)} already knows both of them. these two do not need us — they
                  need {name(bridge)} to say one sentence at a party.
                </>
              ) : (
                <>
                  nobody knows both of them. there is no friend to make this introduction,
                  no party where it happens by itself, and no version of it that occurs
                  without something deliberately putting them in the same room.
                </>
              )}
            </p>

            {mode === 'consequence' && (
              <p className="mt-3 max-w-[48ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-tungsten">
                which is the whole argument. the introduction that would change the most is
                the one no human can make, and the one a compatibility ranker will never
                surface — because it scores zero on every signal those rankers use.
              </p>
            )}
          </motion.section>
        </AnimatePresence>

        {/* who the ranking cannot see */}
        <section className="mt-auto max-w-[44rem] rounded-artifact border border-paper/10 bg-ink/60 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-paper/55">
              who this campus cannot see
            </p>
            <p className="font-mono text-[0.7rem] tabular-nums text-paper/62">
              {net.isolated.length} of {campus.nodes.length}
            </p>
          </div>
          <p className="mt-2.5 max-w-[52ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/62">
            {net.isolated.length} people here have one connection or fewer. they are the
            hardest to rank, because ranking needs signal and they generate almost none — and
            they are the people for whom one introduction would matter most.
          </p>
          <p className="mt-2 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55">
            drawn smaller and colder above. a product optimising for engagement is structurally
            incapable of noticing them.
          </p>
        </section>

        <PrototypeDisclosure />
      </div>
    </div>
  );
}
