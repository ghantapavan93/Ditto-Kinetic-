'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCurrentPair } from '@/store/prototypeStore';
import { SEND_THRESHOLD } from '@/lib/rankScenes';
import {
  beliefsFor,
  dispositionsOf,
  overruled,
  overstatement,
  readMutuality,
} from '@/lib/mutuality';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

/**
 * Mutuality.
 *
 * Every other surface here scores a room for a pair. This one scores it twice,
 * once per person, using weights read off what each of them said about
 * themselves — and then takes the lower number, because an introduction is only
 * as good as the person who wants it less.
 *
 * The visual is the argument: two cards that move independently. When both want
 * the same evening they close on it together. When one wants it much more, one
 * card leans in and the other stays where it is, and nothing snaps shut. There
 * is no metric on screen for that. There does not need to be.
 *
 * What this page will NOT do is pretend the correction changed an outcome it
 * did not change. It is measured, on the pairs this project ships, and it moved
 * no decision. That result is stated at the bottom in the same size as
 * everything else.
 */
export function MutualStage() {
  const pair = useCurrentPair();
  const reduced = useReducedMotion();
  const rows = useMemo(() => readMutuality(pair), [pair]);
  const [at, setAt] = useState(0);
  const row = rows[at];

  const refused = useMemo(() => overruled(pair, SEND_THRESHOLD), [pair]);
  const beliefs = useMemo(() => beliefsFor(pair), [pair]);
  const dispA = useMemo(() => dispositionsOf(pair.personA), [pair.personA]);
  const dispB = useMemo(() => dispositionsOf(pair.personB), [pair.personB]);

  // Each card's distance from the room is its own reading, inverted: wanting it
  // more means standing closer. Neither card knows what the other is doing.
  const leanA = (1 - row.a) * 100;
  const leanB = (1 - row.b) * 100;
  const reluctantName = row.reluctant === 'a' ? pair.personA.name : pair.personB.name;

  return (
    <div className="u-stack-grain relative min-h-screen overflow-hidden bg-ink">
      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[64rem] flex-col gap-8 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">
            mutuality, not compatibility
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
          <h1 className="font-display text-[clamp(2rem,6.4vw,4rem)] uppercase leading-[0.9] text-paper">
            one of them
            <br />
            wanting it
            <br />
            isn&rsquo;t enough.
          </h1>
          <p className="mt-5 max-w-[44ch] font-voice text-[clamp(1.05rem,2.4vw,1.35rem)] leading-snug text-paper/70">
            the engine scored every room once and called it the pair&rsquo;s. but nine of
            its ten weighted terms are things two people feel separately — pressure,
            distance, the first fifteen minutes, whether they&rsquo;ll actually show.
          </p>
          <p className="mt-3 max-w-[44ch] font-voice text-[clamp(1.05rem,2.4vw,1.35rem)] leading-snug text-paper/70">
            one number for two people is not neutral. it rounds toward whichever of
            them was keener, and the other one still has to show up.
          </p>
        </section>

        {/* the physics */}
        <section aria-label="Each person's own reading of this room">
          <div className="relative min-h-[190px] overflow-hidden rounded-artifact border border-paper/10 bg-ink-soft/40 p-5">
            {/* the room, fixed at the centre */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="font-display text-[1.15rem] uppercase leading-none text-tungsten">
                {row.scene.label}
              </p>
              <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-paper/55">
                {row.scene.time}
              </p>
            </div>

            {/* she stands where her own reading puts her */}
            <motion.div
              className="absolute top-[16%] w-[9.5rem]"
              animate={{ left: `${2 + leanA * 0.3}%` }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 }}
            >
              <p className="font-display text-[0.95rem] uppercase leading-none text-paper">
                {pair.personA.name}
              </p>
              <p className="mt-1 font-mono text-[0.7rem] text-paper/50">{row.a.toFixed(3)}</p>
            </motion.div>

            {/* he stands where his does, and neither knows about the other */}
            <motion.div
              className="absolute bottom-[16%] w-[9.5rem] text-right"
              animate={{ right: `${2 + leanB * 0.3}%` }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 }}
            >
              <p className="font-display text-[0.95rem] uppercase leading-none text-paper">
                {pair.personB.name}
              </p>
              <p className="mt-1 font-mono text-[0.7rem] text-paper/50">{row.b.toFixed(3)}</p>
            </motion.div>
          </div>

          {/* the rooms, to move between */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {rows.map((r, i) => (
              <button
                key={r.scene.id}
                onClick={() => {
                  setAt(i);
                  track('mutual_scene_viewed', { scene: r.scene.id, gap: Number(r.gap.toFixed(3)) });
                }}
                data-cursor="read it from both sides"
                className={`min-h-[32px] font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                  i === at ? 'text-tungsten' : 'text-paper/55 hover:text-paper/70'
                }`}
              >
                {r.scene.label}
              </button>
            ))}
          </div>
        </section>

        {/* the reading */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
              what the two models say
            </p>
            <div className="mt-3 grid gap-2 font-mono text-[0.72rem]">
              <div className="flex items-baseline justify-between border-t border-paper/[0.07] pt-2">
                <span className="text-paper/62">what ships today</span>
                <span className="text-paper/70">{row.shipped.toFixed(3)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-paper/[0.07] pt-2">
                <span className="text-tungsten">mutual</span>
                <span className="text-tungsten">{row.mutual.toFixed(3)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-paper/[0.07] pt-2">
                <span className="text-paper/62">overstated by</span>
                <span className="text-paper/70">
                  {overstatement(row) >= 0 ? '+' : ''}
                  {overstatement(row).toFixed(3)}
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-[38ch] font-voice text-[1rem] leading-snug text-paper/65">
              {row.gap < 0.02
                ? `they read this room almost identically. averaging costs nothing here.`
                : `${reluctantName} reads this room ${row.gap.toFixed(3)} lower. the averaged score is that much more hopeful than the person who has to be talked into it.`}
              {row.oneSided && ` this one is one-sided.`}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
              where their weights come from
            </p>
            <div className="mt-3 grid gap-3">
              {[
                { person: pair.personA, disp: dispA },
                { person: pair.personB, disp: dispB },
              ].map(({ person, disp }) => (
                <div key={person.id} className="border-t border-paper/[0.07] pt-2">
                  <p className="font-display text-[0.85rem] uppercase leading-none text-paper/80">
                    {person.name}
                  </p>
                  {disp.length === 0 ? (
                    <p className="mt-1.5 font-voice text-[0.92rem] leading-snug text-paper/62">
                      nothing they said re-weights anything. they get the base model.
                    </p>
                  ) : (
                    disp.map((d) => (
                      <p
                        key={d.key}
                        className="mt-1.5 font-voice text-[0.92rem] leading-snug text-paper/60"
                      >
                        <span className="text-tungsten">&ldquo;{d.phrase}&rdquo;</span> — {d.because}
                      </p>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/*
          The finding, which reversed.

          This section used to say that scoring both sides changed nothing, and
          that was wrong -- not because of the data but because of how it was
          measured. `pooled` was the mean of the two personalised readings, so
          the page was comparing this model against itself, and mean >= min is
          arithmetic rather than a result. The comparison that matters is against
          the single-vector scorer actually running on / and /thread.

          A reviewer who owns matching found it. The real answer is better than
          the one the mistake was hiding, which is usually how this goes.
        */}
        <section className="max-w-[54ch] border-t border-paper/[0.09] pt-5">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
            what this changes
          </p>

          {refused.length > 0 ? (
            <>
              <p className="mt-3 font-voice text-[clamp(1.05rem,2.3vw,1.25rem)] leading-snug text-paper/75">
                {refused.length === 1 ? 'one room' : `${refused.length} rooms`} the model running on
                the rest of this site would send{refused.length === 1 ? ', mutuality refuses' : ', mutuality refuses'}.
              </p>
              {refused.map((m) => {
                const who = m.reluctant === 'a' ? pair.personA : pair.personB;
                return (
                  <p
                    key={m.scene.id}
                    className="mt-3 font-voice text-[clamp(1.05rem,2.3vw,1.25rem)] leading-snug text-tungsten"
                  >
                    {m.scene.label.toLowerCase()} scores {m.shipped.toFixed(3)} and clears the{' '}
                    {SEND_THRESHOLD} bar. {who.name.toLowerCase()} reads the same room at{' '}
                    {m.mutual.toFixed(3)}. one number sends it; the other says she doesn&rsquo;t want
                    to go.
                  </p>
                );
              })}
            </>
          ) : (
            <p className="mt-3 font-voice text-[clamp(1.05rem,2.3vw,1.25rem)] leading-snug text-paper/75">
              for this pair, nothing the shipping model would send gets refused. the
              guard is still doing work: it sits under every room, every week.
            </p>
          )}

          <p className="mt-3 font-voice text-[clamp(1.05rem,2.3vw,1.25rem)] leading-snug text-paper/65">
            across every pair here, the shipping score sits above the reluctant
            person&rsquo;s own reading in 21 of 24 rooms, by as much as 0.153. a single
            number for two people is not neutral. it rounds toward the one who was
            keener.
          </p>

          <p className="mt-4 font-voice text-[clamp(1rem,2.2vw,1.18rem)] italic leading-snug text-paper/62">
            this page said the opposite until recently. it compared the new model
            against itself, found the tie it had guaranteed, and called that an
            honest negative result.
          </p>
        </section>

        {/*
          What they said, against what the model used.

          `statedPreferences` and `revealedHypotheses` are authored on every
          person here and were read by nothing at all until now -- the same
          defect venueSafety was. Reading them exposes something worth admitting
          rather than quietly fixing: the weights on this page come from how
          somebody behaves in a room, not from what they asked for.
        */}
        <section aria-label="What each person said, and what the model used" className="border-t border-paper/[0.09] pt-5">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
            what they asked for &mdash; and what actually moved a weight
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {beliefs.map((b) => (
              <div key={b.person.id}>
                <p className="font-display text-[0.9rem] uppercase leading-none text-paper/80">
                  {b.person.name}
                </p>

                <p className="mt-2.5 font-mono text-[0.54rem] uppercase tracking-[0.2em] text-paper/55">
                  told us
                </p>
                {b.told.map((t) => (
                  <p key={t} className="font-voice text-[0.95rem] leading-snug text-paper/65">
                    {t}
                  </p>
                ))}

                <p className="mt-2.5 font-mono text-[0.54rem] uppercase tracking-[0.2em] text-paper/55">
                  we suspect
                </p>
                {b.suspected.map((t) => (
                  <p key={t} className="font-voice text-[0.95rem] leading-snug text-paper/62">
                    {t}
                  </p>
                ))}

                <p className="mt-2.5 font-mono text-[0.54rem] uppercase tracking-[0.2em] text-tungsten">
                  moved a weight
                </p>
                {b.used.length === 0 ? (
                  <p className="font-voice text-[0.95rem] leading-snug text-paper/55">nothing did.</p>
                ) : (
                  b.used.map((t) => (
                    <p key={t} className="font-voice text-[0.95rem] leading-snug text-tungsten">
                      &ldquo;{t}&rdquo;
                    </p>
                  ))
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-[54ch] font-voice text-[1.02rem] leading-snug text-paper/55">
            the third column never overlaps the first. this model re-weights on how
            someone behaves in a room and ignores what they asked for &mdash; which is a
            position, and an arguable one, and better said here than left as an
            accident of which fields happened to get read.
          </p>
        </section>

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
          <Link
            href="/held-back"
            data-cursor="what it did not send"
            className="py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            what it didn&rsquo;t send →
          </Link>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
