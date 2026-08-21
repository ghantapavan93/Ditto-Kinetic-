'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useCurrentPair } from '@/store/prototypeStore';
import { buildThread, silenceFor, type Beat } from '@/lib/thread';
import { rankScenes, SEND_THRESHOLD } from '@/lib/rankScenes';
import { mutualityOf } from '@/lib/mutuality';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

/**
 * Three worlds, one thread.
 *
 * The rest of this project is a cinematic apparatus you look at. This surface
 * argues that the apparatus should live underneath a text thread and stay there
 * unless somebody asks — which is the direction Ditto has publicly signalled,
 * taken at face value rather than decorated.
 *
 * The interaction is the argument. One message opens into the entire ranked
 * system; the system collapses back into the message. Nothing about the plan
 * changes for having been inspected, which is the honest version of
 * explainability: the reasoning is available, and looking at it is optional,
 * and the product does not reward you for looking.
 *
 * The counter in the corner is not decoration either. It measures how long you
 * spent inside the reasoning against how long the thread itself takes to read,
 * and it is the only scoreboard here where a lower number is the better one.
 */
export function ThreadStage() {
  const pair = useCurrentPair();
  const thread = useMemo(() => buildThread(pair), [pair]);
  const [open, setOpen] = useState(false);
  const [spent, setSpent] = useState(0);

  const since = useRef(0);
  const raf = useRef(0);

  // Only counts while the reasoning is actually on screen. Reading the thread
  // costs you the thread; it should not be charged to the apparatus.
  useEffect(() => {
    if (!open) return;
    since.current = performance.now();
    const tick = () => {
      // The delta is computed HERE, not inside the updater. React runs an
      // updater when it renders, not when you call it -- so reading
      // `since.current` in there read a ref the next line had already advanced,
      // and every frame's delta collapsed to roughly nothing. The counter ran
      // at about a fifth of real time, which on a page whose entire argument is
      // an honest measurement is the worst possible thing to get wrong.
      const now = performance.now();
      const delta = (now - since.current) / 1000;
      since.current = now;
      setSpent((s) => s + delta);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [open]);

  useEffect(() => {
    track('thread_viewed', { words: thread.words });
  }, [thread.words]);

  const ranked = useMemo(() => rankScenes(pair), [pair]);
  const readings = useMemo(
    () => ranked.map((r) => ({ r, m: mutualityOf(pair, r.scene) })),
    [ranked, pair],
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div className="relative min-h-screen bg-ink">
      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[52rem] flex-col gap-7 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten/60">
            the whole product
          </p>
          <Link
            href="/"
            data-cursor="the apparatus"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[36rem]">
          <h1 className="font-display text-[clamp(1.9rem,6vw,3.6rem)] uppercase leading-[0.92] text-paper">
            no app.
            <br />
            just a thread.
          </h1>
          <p className="mt-4 max-w-[42ch] font-voice text-[clamp(1rem,2.3vw,1.3rem)] leading-snug text-paper/70">
            everything else on this site is the machinery. this is what a person
            would actually get: {thread.beats.length} messages over nine days, and one of them
            opens into all of it.
          </p>
        </section>

        {/* NORMAL WORLD — the thread */}
        <section
          aria-label="The message thread"
          className="mx-auto w-full max-w-[24rem] rounded-artifact border border-paper/10 bg-ink-soft/50 p-4"
        >
          <p className="mb-4 border-b border-paper/[0.07] pb-2.5 text-center font-mono text-[0.6rem] uppercase tracking-[0.24em] text-paper/40">
            ditto
          </p>

          <div className="grid gap-2">
            {thread.beats.map((beat, i) => {
              // Derived from the neighbour rather than a variable mutated as the
              // list renders -- the day divider is a property of the sequence,
              // not of how many times this component has run.
              const showDay = i === 0 || thread.beats[i - 1].day !== beat.day;
              return (
                <div key={beat.id}>
                  {showDay && (
                    <p className="py-2.5 text-center font-mono text-[0.55rem] uppercase tracking-[0.2em] text-paper/25">
                      {beat.day}
                    </p>
                  )}
                  <Bubble beat={beat} onOpen={() => { setOpen(true); track('thread_opened'); }} />
                </div>
              );
            })}
          </div>
        </section>

        {/* the honest scoreboard */}
        <section className="mx-auto w-full max-w-[24rem]">
          <div className="grid gap-1.5 font-mono text-[0.66rem]">
            <div className="flex items-baseline justify-between border-t border-paper/[0.07] pt-2">
              <span className="text-paper/45">the thread, read end to end</span>
              <span className="text-paper/70">{thread.seconds.toFixed(0)}s</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-paper/[0.07] pt-2">
              <span className="text-paper/45">you, inside the reasoning</span>
              <span className={spent > 0 ? 'text-tungsten' : 'text-paper/30'}>
                {spent > 0 ? `${spent.toFixed(0)}s` : 'not yet'}
              </span>
            </div>
          </div>
          <p className="mt-3 font-voice text-[0.98rem] leading-snug text-paper/55">
            {spent === 0
              ? 'you can have the entire product without opening anything. that is the test.'
              : spent < thread.seconds
                ? 'still less than the thread itself. the machinery stayed out of the way.'
                : 'longer than the thread took. worth it once, maybe. not every week.'}
          </p>
        </section>

        <p className="mx-auto max-w-[34ch] text-center font-voice text-[clamp(1.05rem,2.4vw,1.35rem)] italic leading-snug text-tungsten">
          {silenceFor(thread)}
        </p>

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-2">
          <Link
            href="/attention"
            data-cursor="what this costs you"
            className="font-editorial text-[0.72rem] lowercase tracking-wide text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            what the rest of it costs →
          </Link>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>

      {/* THINKING WORLD — everything, briefly */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-sheet overflow-y-auto bg-ink/97 backdrop-blur-sm"
          >
            <div className="mx-auto flex min-h-screen max-w-[46rem] flex-col gap-5 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.26em] text-tungsten/70">
                  how i got there
                </p>
                <button
                  onClick={close}
                  data-cursor="back to the thread"
                  className="min-h-[44px] font-mono text-[0.66rem] uppercase tracking-[0.18em] text-paper/45 underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  close ✕
                </button>
              </div>

              <p className="max-w-[40ch] font-voice text-[1.05rem] leading-snug text-paper/65">
                six evenings were possible. each was scored from both sides
                separately, because {pair.personA.name} and {pair.personB.name} are not one
                person with one opinion.
              </p>

              <div className="grid gap-2">
                {readings.map(({ r, m }, i) => (
                  <div
                    key={r.scene.id}
                    className={`grid grid-cols-[1fr_auto] items-baseline gap-3 border-t pt-2.5 ${
                      i === 0 ? 'border-tungsten/40' : 'border-paper/[0.07]'
                    }`}
                  >
                    <div>
                      <p
                        className={`font-display text-[0.95rem] uppercase leading-none ${
                          i === 0 ? 'text-tungsten' : 'text-paper/60'
                        }`}
                      >
                        {r.scene.label}
                      </p>
                      <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-wide text-paper/30">
                        {pair.personA.name.toLowerCase()} {m.a.toFixed(2)} · {pair.personB.name.toLowerCase()}{' '}
                        {m.b.toFixed(2)} · both {m.mutual.toFixed(2)}
                      </p>
                    </div>
                    <p
                      className={`font-mono text-[0.8rem] ${
                        r.utility >= SEND_THRESHOLD ? 'text-paper' : 'text-paper/25'
                      }`}
                    >
                      {r.utility.toFixed(3)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="max-w-[42ch] font-voice text-[1.05rem] leading-snug text-paper/65">
                {ranked[0].scene.label.toLowerCase()} won on the reluctant one&rsquo;s reading, not
                the average. the bar is {SEND_THRESHOLD}; below it nothing gets sent at all.
              </p>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {[
                    { href: '/', label: 'the whole stage' },
                    { href: '/mutual', label: 'both sides' },
                    { href: '/held-back', label: 'what it didn’t send' },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      data-cursor="deeper"
                      className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
                    >
                      {l.label} →
                    </Link>
                  ))}
                </div>
                <PrototypeDisclosure className="text-right" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One message. The one that opens is the only thing on screen you can press. */
function Bubble({ beat, onOpen }: { beat: Beat; onOpen: () => void }) {
  const mine = beat.sender === 'you';

  const body = (
    <span
      className={`inline-block max-w-[85%] rounded-[1.1rem] px-3.5 py-2 font-editorial text-[0.92rem] leading-snug ${
        mine ? 'bg-tungsten/85 text-ink' : 'bg-paper/[0.09] text-paper/90'
      }`}
    >
      {beat.text}
    </span>
  );

  return (
    <div className={mine ? 'text-right' : 'text-left'}>
      {beat.opens ? (
        <button
          onClick={onOpen}
          data-cursor="open it"
          className="w-full text-left"
          aria-label={`${beat.text} — open the reasoning behind this`}
        >
          <span className="inline-block max-w-[85%] rounded-[1.1rem] bg-tungsten/20 px-3.5 py-2 font-editorial text-[0.98rem] leading-snug text-paper ring-1 ring-tungsten/40 transition-colors hover:bg-tungsten/30">
            {beat.text}
          </span>
        </button>
      ) : (
        body
      )}
      <p
        className={`mt-1 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-paper/20 ${
          mine ? 'text-right' : 'text-left'
        }`}
      >
        {beat.at}
        {beat.receipt ? ` · ${beat.receipt}` : ''}
      </p>
    </div>
  );
}
