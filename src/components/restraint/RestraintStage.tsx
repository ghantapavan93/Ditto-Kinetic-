'use client';

import { useEffect, useMemo } from 'react';
import { planWeek } from '@/lib/booking';
import { WEEK_TWO } from '@/data/weekTwo';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HELD_BACK } from '@/data/heldBack';
import { PAIRS } from '@/data/pairs';
import { heldBack } from '@/lib/restraint';
import { SEND_THRESHOLD, sendDecision } from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { HeldBackCard } from './HeldBackCard';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

/**
 * What did not get sent.
 *
 * Every other surface in this project shows the system doing something. This
 * one shows it deciding not to, which is the harder thing to build and the
 * easier thing to skip — an abstention has no screen by nature. Nothing is
 * delivered, so nothing is displayed, so from the outside a system exercising
 * judgement is indistinguishable from one that is asleep.
 *
 * That invisibility is a real product problem and not only an aesthetic one.
 * Ditto sends one match a Wednesday. Declining costs a person their entire
 * week, and a cost that large has to be legible or it reads as neglect. So the
 * page does the one thing that makes restraint defensible: it says what each
 * held-back pair is waiting for, in the specific, and shows the arithmetic
 * underneath.
 *
 * The number sent is computed from the same scorer rather than written down, so
 * this page cannot drift out of agreement with the stage it is describing.
 */
export function RestraintStage() {
  const held = useMemo(() => heldBack(HELD_BACK), []);
  const sent = useMemo(() => PAIRS.filter((p) => sendDecision(p).send), []);

  /*
   * The other reason a pair does not get the room it earned.
   *
   * Every score on this site is computed for one pair as though no other pair
   * exists, which is fine for arguing about rooms and wrong the moment the
   * product has more than one couple in it. Planned together, Priya and Theo's
   * cafe at 3:40 and Noor and Sam's cafe at 4:15 overlap by twenty-five
   * minutes -- one room, two first dates, adjacent tables, and nothing was
   * looking at both bookings at once.
   *
   * This page is already about what the engine refused to send. A pair moved
   * off its best evening because somebody else was in the room belongs here:
   * it is the same restraint, applied to the week rather than to the pair.
   */
  const week = useMemo(() => planWeek([...PAIRS, WEEK_TWO]), []);

  useEffect(() => {
    track('held_back_viewed', { held: held.length, sent: sent.length });
  }, [held.length, sent.length]);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(80% 50% at 78% 4%, rgba(232,145,60,0.07), transparent 60%), radial-gradient(120% 90% at 40% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[68rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] tabular-nums tracking-[0.2em] text-paper/62">
            WED · 7:02 PM
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[46rem]">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
            Ditto · this wednesday
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,6.5vw,4rem)] uppercase leading-[0.92] text-paper">
            sent {sent.length}.
            <br />
            <span className="text-tungsten">held back {held.length}.</span>
          </h1>

          <p className="mt-6 max-w-[40ch] font-voice text-[clamp(1.2rem,2.6vw,1.6rem)] leading-snug text-paper/75">
            three people got nothing this wednesday. that was the decision, not the
            absence of one.
          </p>

          <p className="mt-5 max-w-[52ch] font-editorial text-[0.85rem] lowercase leading-relaxed tracking-wide text-paper/62">
            an app that never declines is not being generous, it is being indifferent —
            it has no threshold, so it has no opinion. the bar is {SEND_THRESHOLD}. below it,
            sending costs someone a week and teaches us nothing. what follows is what each
            of these is actually waiting for.
          </p>
        </section>

        <SnapshotRow
          srcs={['/photos/print-rain-window.webp']}
          note="the ones it kept."
        />

        <section aria-label="Pairs held back this week" className="mt-2">
          {held.map((restraint, i) => (
            <HeldBackCard key={restraint.pair.id} restraint={restraint} index={i} />
          ))}
        </section>

        {/* what the week took away, as opposed to what the score did */}
        {week.displaced.length > 0 && (
          <section aria-label="Pairs moved because a room was taken" className="mt-10">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">
              and what the week took
            </p>
            <p className="mt-3 max-w-[52ch] font-voice text-[1.05rem] leading-snug text-paper/65">
              scores are computed one pair at a time. rooms are not. planned together,{' '}
              {week.booked.length} evenings fit without two couples landing in the same room
              at the same hour &mdash; but only because somebody moved.
            </p>

            <div className="mt-4 grid gap-2">
              {week.displaced.map((d) => (
                <div
                  key={d.pairId}
                  className="border-t border-paper/[0.07] pt-2.5 font-mono text-[0.68rem]"
                >
                  <p className="text-paper/70">
                    {d.pairId} &mdash; {d.from.label.toLowerCase()}
                    <span className="text-paper/55"> &rarr; </span>
                    <span className={d.to ? 'text-tungsten' : 'text-acid'}>
                      {d.to ? d.to.label.toLowerCase() : 'nothing this week'}
                    </span>
                  </p>
                  <p className="mt-1 font-editorial text-[0.85rem] lowercase text-paper/55">
                    {d.reason}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 max-w-[52ch] font-voice text-[1.02rem] leading-snug text-paper/62">
              the pair the engine was more confident about keeps the table. the other is
              offered a different evening rather than the same one at an awkward angle,
              and if there is nothing left it is held &mdash; which is the same answer this
              page is already about, arrived at from the other direction.
            </p>
          </section>
        )}

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="max-w-[44ch] border-t border-paper/12 pt-8"
        >
          <p className="font-voice text-[1.2rem] italic leading-snug text-paper/55">
            none of these are rejections. two of them are timing, and one of them is us
            not knowing enough yet to be worth trusting.
          </p>
          <p className="mt-4 font-editorial text-[0.78rem] lowercase leading-relaxed tracking-wide text-paper/55">
            they all come back into the pool next wednesday, with one more week of
            evidence attached.
          </p>

          <Link
            href="/profile"
            data-cursor="see what it knows"
            className="mt-7 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
          >
            what we actually know about someone →
          </Link>
        </motion.section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}
