'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { rankDoubles, type DoubleDate, type Side } from '@/lib/doubleDate';
import { SEND_THRESHOLD } from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

/*
 * This week only.
 *
 * `WEEK_TWO` is next Wednesday -- its own file says so and /next-wednesday
 * frames it that way -- and it used to sit in this array alongside the two
 * week-one pairs. Two of the three combinations therefore staged a double date
 * between people seven days apart, and every term the model computes about them
 * (cover, eclipse, dilution) is a claim about four people in one room at one
 * time. None of those can happen across a week.
 */
const ALL = [...PAIRS];

const COMBINATIONS: [number, number][] = [[0, 1]];

/**
 * Four people.
 *
 * The stage argues that the right person can still get the wrong first date.
 * This is the same argument with one more turn: the right two people can still
 * be the wrong four. Two pairs who each work separately do not add — they
 * interact, and the interaction decides the evening.
 *
 * The page exists to show a result I did not write and would not have picked.
 * Across every pairing and every room, not one double date is worth sending,
 * and the reasons are specific rather than general: cover and eclipse scale
 * off the same weakness, dilution scales off strength, and the only thing that
 * separates them is whether the room lets four people become two and two.
 *
 * The near miss is the point of the whole surface. One combination fails by a
 * thousandth — both evenings would clear the bar, and one pair ends up a
 * fraction worse off than they started. The system refuses. That is a policy
 * and the page says so out loud rather than burying it in a constant, because
 * it is the kind of decision a person should be allowed to disagree with.
 */
export function DoubleStage() {
  const [combo, setCombo] = useState(0);
  const [a, b] = COMBINATIONS[combo].map((i) => ALL[i]);

  const doubles = useMemo(() => rankDoubles(a, b), [a, b]);
  const anyWorthIt = doubles.some((d) => d.worthIt);

  // The closest thing to a yes: both evenings sendable, ranked by whichever
  // pair the room treats worst.
  const nearest = useMemo(
    () =>
      doubles
        .filter((d) => d.a.joint >= SEND_THRESHOLD && d.b.joint >= SEND_THRESHOLD)
        .sort((x, y) => Math.min(y.a.delta, y.b.delta) - Math.min(x.a.delta, x.b.delta))[0] ?? null,
    [doubles],
  );

  useEffect(() => {
    track('double_date_viewed', { pairing: `${a.id}+${b.id}`, anyWorthIt });
  }, [a.id, b.id, anyWorthIt]);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(80% 50% at 50% 4%, rgba(122,43,255,0.10), transparent 62%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[70rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            four people
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
            the right two people
            <br />
            <span className="text-tungsten">can still be the wrong four.</span>
          </h1>

          <p className="mt-6 max-w-[42ch] font-voice text-[clamp(1.15rem,2.5vw,1.5rem)] leading-snug text-paper/70">
            two pairs who each work on their own do not add up. they interact, and the
            interaction is most of what decides the night.
          </p>
        </section>

        {/* who */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-paper/55">
            put together
          </span>
          {COMBINATIONS.map(([i, j], n) => (
            <button
              key={n}
              onClick={() => setCombo(n)}
              data-cursor="try these four"
              className={`py-1.5 font-editorial text-[0.76rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                combo === n
                  ? 'text-tungsten underline'
                  : 'text-paper/55 hover:text-paper hover:underline'
              }`}
            >
              {ALL[i].personA.name} &amp; {ALL[i].personB.name} + {ALL[j].personA.name} &amp;{' '}
              {ALL[j].personB.name}
            </button>
          ))}
        </div>

        {/* the rooms */}
        <section aria-label="Every room, scored for four people" className="grid gap-3">
          {doubles.map((d, i) => (
            <RoomRow key={d.scene.id} d={d} index={i} />
          ))}
        </section>

        {/* the verdict */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="max-w-[52ch] border-t border-paper/12 pt-8"
        >
          {anyWorthIt ? (
            <p className="font-voice text-[1.35rem] leading-snug text-mint">
              one of these is worth sending.
            </p>
          ) : (
            <>
              <p className="font-display text-[clamp(1.4rem,3.2vw,2rem)] uppercase leading-none text-paper">
                none of them get sent.
              </p>
              <p className="mt-4 font-voice text-[1.15rem] leading-snug text-paper/70">
                a double date is a rescue, not an upgrade. it helps the pair who could not
                carry a first ten minutes, and it costs the pair who could — and the second
                effect is the one nobody models.
              </p>
            </>
          )}

          {nearest && (
            <div className="mt-7 border-l-2 border-acid/50 pl-4">
              <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                closest we came
              </p>
              <p className="mt-2 font-voice text-[1.2rem] leading-snug text-paper">
                {nearest.scene.label.toLowerCase()} — both evenings would clear the bar.{' '}
                {nearest.a.delta < nearest.b.delta
                  ? `${nearest.a.pair.personA.name} and ${nearest.a.pair.personB.name}`
                  : `${nearest.b.pair.personA.name} and ${nearest.b.pair.personB.name}`}{' '}
                end up {Math.abs(Math.min(nearest.a.delta, nearest.b.delta)).toFixed(3)} worse
                off than they would have been alone.
              </p>
              <p className="mt-4 font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/62">
                the net across all four is{' '}
                {nearest.net >= 0 ? '+' : ''}
                {nearest.net.toFixed(3)}, and it is still a no.
              </p>

              {/*
                Stated as a policy rather than hidden in a constant. It is the
                kind of decision a person should be able to disagree with, and a
                threshold you cannot see is not one you can argue with.
              */}
              <p className="mt-3 max-w-[44ch] font-voice text-[1.1rem] italic leading-snug text-tungsten">
                a positive net means somebody paid for somebody else&rsquo;s evening. nobody
                asked them, and the net is not a person.
              </p>
            </div>
          )}

          <Link
            href="/held-back"
            data-cursor="see the rest"
            className="mt-8 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
          >
            what else did not get sent →
          </Link>
        </motion.section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}

/** One room, scored for four people. */
function RoomRow({ d, index }: { d: DoubleDate; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-artifact border px-5 py-4 ${
        d.worthIt ? 'border-mint/35 bg-mint/[0.04]' : 'border-paper/12 bg-paper/[0.02]'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-[1.3rem] uppercase leading-none text-paper">
          {d.scene.label}
        </h2>
        <SplitMeter split={d.split} />
      </div>

      <p className="mt-2 max-w-[54ch] font-editorial text-[0.76rem] lowercase leading-relaxed tracking-wide text-paper/62">
        {d.splitWhy}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SideRow side={d.a} />
        <SideRow side={d.b} />
      </div>
    </motion.article>
  );
}

/**
 * How far apart the two conversations get.
 *
 * Two dots that separate by the split value. A number would be read as a score;
 * the gap is read as what it physically is, which is the distance between two
 * people who are no longer in the same conversation.
 */
function SplitMeter({ split }: { split: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-paper/55">
        splits
      </span>
      {/*
        The travel is deliberately near the full width. At a third of the track
        a room that splits readily and one that barely does looked the same, and
        a meter whose whole job is to show a difference has to actually show it.
      */}
      <div className="relative h-3 w-[112px]">
        <motion.span
          animate={{ left: `${(1 - split) * 44}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 block h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-paper/60"
        />
        <motion.span
          animate={{ right: `${(1 - split) * 44}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 block h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-paper/60"
        />
      </div>
    </div>
  );
}

/** One pair's evening, before and after the other two showed up. */
function SideRow({ side }: { side: Side }) {
  const worse = side.delta < 0;
  const sendable = side.joint >= SEND_THRESHOLD;

  return (
    <div className="border-t border-paper/[0.07] pt-3">
      <p className="font-editorial text-[0.74rem] lowercase tracking-wide text-paper/55">
        {side.pair.personA.name} &amp; {side.pair.personB.name}
      </p>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[0.78rem] tabular-nums text-paper/55 line-through">
          {side.solo.toFixed(3)}
        </span>
        <span className={`font-mono text-[0.95rem] tabular-nums ${sendable ? 'text-paper' : 'text-paper/62'}`}>
          {side.joint.toFixed(3)}
        </span>
        <span
          className={`font-mono text-[0.68rem] tabular-nums ${worse ? 'text-acid' : 'text-mint'}`}
        >
          {side.delta >= 0 ? '+' : ''}
          {side.delta.toFixed(3)}
        </span>
        {!sendable && (
          <span className="font-editorial text-[0.66rem] lowercase tracking-wide text-paper/55">
            below the bar
          </span>
        )}
      </div>

      {/* the three cross-terms, so the number is never just a number */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[0.6rem] tabular-nums text-paper/55">
        <span className="text-mint">cover +{side.cover.toFixed(3)}</span>
        <span className={side.eclipse > 0.0005 ? 'text-acid' : ''}>
          eclipse −{side.eclipse.toFixed(3)}
        </span>
        <span className={side.dilution > 0.02 ? 'text-acid' : ''}>
          diluted −{side.dilution.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
