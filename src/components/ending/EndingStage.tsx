'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { EXIT_WEIGHT, exitVerdict, type ExitRead } from '@/lib/exit';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

import { ACID, PAPER } from '@/lib/palette';
import { SnapshotRow } from '@/components/shared/SnapshotRow';
/**
 * How it ends.
 *
 * They pick the person, the time and the room. Nobody picks the ending, and the
 * ending is most of what somebody is agreeing to when they say yes — an evening
 * with no natural close is an open-ended commitment to a stranger, and "I did
 * not want to be stuck there" is a reason to decline that no matching system
 * has a field for.
 *
 * So this proposes a twelfth dimension, applies it, and then reports honestly
 * that it does not change the decision. It reorders the middle for two of the
 * three pairs and moves the winner for none of them. That is the finding, not a
 * failure of it, and it took building the thing to know.
 *
 * The number that matters is the disagreement between a room's exit quality and
 * its `contextFit`, because those two come apart in a specific and instructive
 * place. `contextFit` is about *these two people in this room*. The exit is
 * about the room, for anybody. They agree almost perfectly for Maya and Jonah,
 * and they diverge by 0.75 on one square: the café is genuinely the right room
 * for Priya and Theo, and it is still a room you have to perform leaving.
 *
 * Which is the conclusion, and it is better than a re-ranking would have been:
 * the ending does not belong in the scorer. It belongs in the message. You do
 * not fix this by choosing somewhere else — the choice was correct — you fix it
 * by saying "the tacos are the end" out loud before anybody has to ask.
 */
export function EndingStage() {
  const [which, setWhich] = useState(0);
  const pair = PAIRS[which];
  const verdict = useMemo(() => exitVerdict(pair), [pair]);
  const [showMessage, setShowMessage] = useState(false);

  const chosen = useMemo(
    () => verdict.reads.find((r) => r.scene.id === verdict.before[0]) ?? null,
    [verdict],
  );

  useEffect(() => {
    track('ending_viewed', { pair: pair.id, reorders: verdict.reorders });
  }, [pair.id, verdict.reorders]);

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(75% 45% at 30% 3%, rgba(47,216,168,0.07), transparent 60%), radial-gradient(120% 90% at 60% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[68rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            the twelfth dimension
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
            they pick who,
            <br />
            when and where.
            <br />
            <span className="text-tungsten">nobody picks how it ends.</span>
          </h1>

          <p className="mt-6 max-w-[44ch] font-voice text-[clamp(1.15rem,2.5vw,1.5rem)] leading-snug text-paper/70">
            an evening with no natural close is an open commitment to a stranger. &ldquo;i
            didn&rsquo;t want to be stuck there&rdquo; is a reason people say no, and no
            matching system has a field for it.
          </p>
        </section>

        <SnapshotRow
          srcs={['/photos/bridgeside.webp']}
          note="leaving is a feature."
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-paper/55">
            for
          </span>
          {PAIRS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setWhich(i)}
              data-cursor="these two"
              className={`py-1.5 font-editorial text-[0.76rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                which === i
                  ? 'text-tungsten underline'
                  : 'text-paper/55 hover:text-paper hover:underline'
              }`}
            >
              {p.personA.name} &amp; {p.personB.name}
            </button>
          ))}
        </div>

        <section aria-label="Every room, and how it ends" className="grid gap-2.5">
          {verdict.reads.map((r, i) => (
            <RoomExit key={r.scene.id} read={r} index={i} />
          ))}
        </section>

        {/* the honest result */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-[56ch] border-t border-paper/12 pt-8"
        >
          <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
            what the twelfth dimension changed
          </p>
          <p className="mt-3 font-display text-[clamp(1.4rem,3.4vw,2.1rem)] uppercase leading-none text-paper">
            {verdict.reorders ? 'it reorders the week.' : 'nothing.'}
          </p>

          {verdict.reorders && (
            <p className="mt-4 font-voice text-[1.2rem] leading-snug text-paper/75">
              it moves the middle of the week and leaves the top of it alone. the room
              that gets sent is the same room. a twelfth dimension that reshuffles the
              options nobody was going to take has not changed anything a person would
              notice &mdash; which is the useful version of a null result, not a weaker one.
            </p>
          )}

          {!verdict.reorders && (
            <>
              <p className="mt-4 font-voice text-[1.2rem] leading-snug text-paper/75">
                same six rooms, same order, before and after. the ten weighted dimensions were
                already pricing the ending in through context fit — a room that hands two
                people something to do tends to hand them a way out too.
              </p>
              {/*
                The weight is stated because a null result is only worth
                anything if the term was given a real chance. This one is
                heavier than schedule fit and travel friction; if it were going
                to move the ranking, it had the room to.
              */}
              <p className="mt-3 font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/62">
                and it was not given a token weight to fail at. {EXIT_WEIGHT} is heavier
                than schedule fit and heavier than travel friction — deliberately generous,
                so that if it were going to change anything it had the room to.
              </p>
            </>
          )}

          {/*
            The exception, and the whole reason the page exists. contextFit is
            about these two people in this room; the exit is about the room, for
            anybody. They come apart exactly where a room suits someone in spite
            of its shape.
          */}
          {verdict.worstBlindSpot && verdict.worstBlindSpot.blindSpot > 0.3 && (
            <div className="mt-7 border-l-2 border-acid/50 pl-4">
              <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                except here
              </p>
              <p className="mt-2 font-display text-[1.3rem] uppercase leading-none text-paper">
                {verdict.worstBlindSpot.scene.label}
              </p>
              <p className="mt-3 max-w-[48ch] font-voice text-[1.15rem] leading-snug text-paper/80">
                context fit reads {verdict.worstBlindSpot.scene.metrics.contextFit.toFixed(2)}.
                the way out reads {verdict.worstBlindSpot.quality.toFixed(2)}. that is a gap of{' '}
                {verdict.worstBlindSpot.blindSpot.toFixed(2)}, the widest on the board.
              </p>
              <p className="mt-3 max-w-[48ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/50">
                and the room is not wrong. it is genuinely the best evening these two have
                this week. context fit is about them; the ending is about the room, for
                anybody. those two only come apart when a place suits someone in spite of
                its shape.
              </p>
            </div>
          )}

          <p className="mt-8 max-w-[46ch] font-voice text-[1.3rem] italic leading-snug text-tungsten">
            so the ending is not a ranking problem. it is a delivery problem.
          </p>
          <p className="mt-3 max-w-[50ch] font-editorial text-[0.84rem] lowercase leading-relaxed tracking-wide text-paper/62">
            you do not fix it by sending them somewhere else — the choice was right. you fix
            it by saying how it ends before anybody has to ask, and where the room will not
            end itself, by giving it one.
          </p>

          <button
            onClick={() => {
              setShowMessage(true);
              track('ending_message_shown');
            }}
            data-cursor="show me"
            className="mt-7 border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
          >
            show me the message instead
          </button>
        </motion.section>

        {/* the deliverable: one extra line in the drop */}
        <AnimatePresence>
          {showMessage && chosen && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid max-w-[52rem] gap-5 sm:grid-cols-2"
            >
              <Bubble title="what gets sent today">
                <p className="font-voice text-[1.05rem] leading-snug text-paper-bright">
                  {pair.personB.name} · {chosen.scene.time}
                  <br />
                  {chosen.scene.location}
                </p>
              </Bubble>

              <Bubble title="one line longer" accent>
                <p className="font-voice text-[1.05rem] leading-snug text-paper-bright">
                  {pair.personB.name} · {chosen.scene.time}
                  <br />
                  {chosen.scene.location}
                </p>
                {/*
                  Where the room ends itself, name the ending. Where it does
                  not, supply one — printing "there is nowhere to go from a
                  table and somebody has to ask" is accurate and makes saying
                  yes harder, which is the opposite of what this is for.
                */}
                <p className="mt-3 border-t border-paper-bright/25 pt-3 font-voice text-[1.02rem] leading-snug text-paper-bright/90">
                  {chosen.needsAnEnding && chosen.supplied ? chosen.supplied : chosen.how}
                </p>
                {!chosen.needsAnEnding && (
                  <p className="mt-2 font-voice text-[1.02rem] italic leading-snug text-paper-bright/70">
                    {chosen.ifItGoesWell}
                  </p>
                )}
              </Bubble>

              <p className="sm:col-span-2 max-w-[48ch] font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/62">
                same match, same room, same hour. the difference is that saying yes now
                costs a known amount of the evening instead of an unknown one — which is
                the cheapest thing on this entire site to ship.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}

function Bubble({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-paper/55">
        {title}
      </p>
      <div
        className={`rounded-[1.2rem] rounded-bl-md px-5 py-4 ${
          accent ? 'bg-cobalt' : 'bg-paper/[0.07]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** One room, and the shape of getting out of it. */
function RoomExit({ read, index }: { read: ExitRead; index: number }) {
  const stuck = read.endsItself < 0.3;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-artifact border px-5 py-4 ${
        stuck ? 'border-acid/25 bg-acid/[0.03]' : 'border-paper/12 bg-paper/[0.02]'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-[1.2rem] uppercase leading-none text-paper">
          {read.scene.label}
        </h2>

        <div className="flex items-center gap-4 font-mono text-[0.58rem] uppercase tracking-[0.14em]">
          <Meter label="ends" value={read.endsItself} />
          <Meter label="carries on" value={read.extends_} />
        </div>
      </div>

      <p className="mt-2.5 max-w-[58ch] font-voice text-[1.02rem] leading-snug text-paper/75">
        {read.how}
      </p>
      <p className="mt-1.5 max-w-[58ch] font-editorial text-[0.76rem] lowercase leading-relaxed tracking-wide text-paper/62">
        if it goes well — {read.ifItGoesWell}
      </p>

      {read.needsAnEnding && read.supplied && (
        <p className="mt-3 max-w-[58ch] border-l-2 border-mint/40 pl-3 font-voice text-[0.98rem] leading-snug text-mint">
          {read.supplied}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.58rem] tabular-nums text-paper/55">
        <span>{read.base.toFixed(3)} today</span>
        <span className="text-mint">
          {read.withExit.toFixed(3)} with the ending counted
        </span>
        {read.blindSpot > 0.3 && (
          <span className="text-acid">
            blind spot {read.blindSpot.toFixed(2)}
          </span>
        )}
      </div>
    </motion.article>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 text-paper/55">
      {label}
      <span className="relative block h-[3px] w-[42px] rounded-[1px] bg-paper/12">
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 block rounded-[1px]"
          style={{ background: value < 0.3 ? ACID : PAPER, opacity: 0.75 }}
        />
      </span>
    </span>
  );
}
