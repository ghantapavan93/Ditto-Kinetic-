'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { highlightRanges, interpretLocally } from '@/lib/feedbackSchema';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { DevelopingFrame } from './DevelopingFrame';
import { MemoryBoard } from './MemoryBoard';
import { track } from '@/lib/analytics';

const EXAMPLE =
  'honestly she was way more outgoing than I expected but once we started walking it felt weirdly easy';

/**
 * After.
 *
 * The date already happened. This page is the quiet hour afterwards, and it is
 * the only surface in the project where the system is allowed to change its
 * mind.
 *
 * Three refusals shape it. No rating — a star compresses the one genuinely
 * high-information thing a person produces after a date, a messy sentence, into
 * a number nobody can reason about. No "profile updated" — that is a claim of
 * certainty about a person from one evening. And no deletion: the belief that
 * turned out to be wrong is struck through and kept, because a learning system
 * that quietly overwrites what it used to think cannot be audited.
 *
 * The interpretation runs on the same deterministic reader the main flow uses,
 * so this page works with no network and no key.
 */
type Phase = 'developing' | 'asking' | 'reading' | 'learned';

export function AfterStage() {
  const [phase, setPhase] = useState<Phase>('developing');
  const [develop, setDevelop] = useState(0);
  const [text, setText] = useState('');
  const pair = PAIRS[0];

  const raf = useRef(0);

  // The photograph develops on a timer, not on load — the wait is the point.
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 2600);
      setDevelop(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setTimeout(() => setPhase('asking'), 700);
    };
    raf.current = requestAnimationFrame(tick);

    // rAF is suspended in a background tab, so the page would sit blank
    // forever. A timer guarantees it still arrives.
    const failsafe = setTimeout(() => {
      setDevelop(1);
      setPhase((p) => (p === 'developing' ? 'asking' : p));
    }, 3600);

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    track('after_page_viewed');
  }, []);

  const reading = useMemo(() => (text.trim() ? interpretLocally(text) : null), [text]);
  const marks = useMemo(() => highlightRanges(text), [text]);

  const marked = useMemo(() => {
    if (!marks.length) return [{ text, kind: null as 'up' | 'down' | null }];
    const out: { text: string; kind: 'up' | 'down' | null }[] = [];
    let cursor = 0;
    for (const m of marks) {
      if (m.start > cursor) out.push({ text: text.slice(cursor, m.start), kind: null });
      out.push({ text: text.slice(m.start, m.end), kind: m.kind });
      cursor = m.end;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor), kind: null });
    return out;
  }, [marks, text]);

  const submit = () => {
    if (!text.trim()) return;
    setPhase('reading');
    track('after_feedback_submitted', { length: text.length });
    setTimeout(() => setPhase('learned'), 2300);
  };

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(85% 55% at 22% 6%, rgba(232,145,60,0.10), transparent 62%), radial-gradient(120% 90% at 60% 110%, rgba(20,12,8,0.85), transparent 70%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[62rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] tabular-nums tracking-[0.2em] text-paper/62">
            12:14 AM
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-start md:gap-14">
          <DevelopingFrame
            person={pair.personA}
            progress={develop}
            caption="thursday, 8:32"
          />

          <div className="grid">
            <AnimatePresence>
              {phase === 'asking' && (
                <motion.section
                  key="asking"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="col-start-1 row-start-1"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
                    Ditto
                  </p>
                  <h1 className="mt-3 font-voice text-[clamp(1.8rem,4.4vw,2.8rem)] leading-tight text-paper">
                    so&hellip; how was it?
                  </h1>
                  <p className="mt-3 max-w-[34ch] font-editorial text-[0.85rem] lowercase tracking-wide text-paper/62">
                    not a rating. a sentence. the messier the better.
                  </p>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    aria-label="How the date went"
                    placeholder={EXAMPLE}
                    className="mt-6 w-full max-w-[34rem] resize-none rounded-artifact border border-paper/14 bg-paper/[0.03] p-4 font-voice text-[1.15rem] leading-snug text-paper placeholder:text-paper/55 focus:border-paper/40"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                      onClick={submit}
                      disabled={!text.trim()}
                      data-cursor="tell it"
                      className="border border-paper/25 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-paper transition-colors hover:border-tungsten hover:text-tungsten disabled:opacity-25"
                    >
                      send it
                    </button>
                    {!text.trim() && (
                      <button
                        onClick={() => setText(EXAMPLE)}
                        className="font-editorial text-[0.74rem] lowercase text-paper/55 underline-offset-4 hover:underline"
                      >
                        use the example
                      </button>
                    )}
                  </div>
                </motion.section>
              )}

              {(phase === 'reading' || phase === 'learned') && (
                <motion.section
                  key="receipt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="col-start-1 row-start-1"
                >
                  {/* the sentence, printed */}
                  <motion.div
                    initial={{ y: -18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                    className="u-paper u-torn-bottom max-w-[30rem] px-5 py-5"
                    style={{ transform: 'rotate(-0.5deg)' }}
                  >
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink/62">
                      what you said
                    </p>
                    <div className="my-3 border-t border-dashed border-ink/25" />
                    <p className="font-voice text-[1.15rem] leading-relaxed text-ink">
                      {marked.map((part, i) =>
                        part.kind ? (
                          <motion.mark
                            key={i}
                            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
                            animate={{
                              backgroundColor: part.kind === 'up' ? '#FFD84D' : '#FF2E8844',
                            }}
                            transition={{ delay: 0.6 + i * 0.14, duration: 0.35 }}
                            className="px-0.5 text-ink"
                          >
                            {part.text}
                          </motion.mark>
                        ) : (
                          <span key={i}>{part.text}</span>
                        ),
                      )}
                    </p>
                  </motion.div>

                  {reading && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="mt-6 max-w-[34ch] font-voice text-[1.2rem] italic leading-snug text-tungsten"
                    >
                      {reading.inferredHypotheses[0]?.hypothesis}
                    </motion.p>
                  )}

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.9 }}
                    className="mt-3 font-editorial text-[0.74rem] lowercase tracking-wide text-paper/55"
                  >
                    working hypothesis. not fact. we&rsquo;ll test it gently.
                  </motion.p>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* the board */}
        <section aria-label="What Ditto believes" className="mt-2">
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="font-display text-[1.4rem] uppercase leading-none text-paper">
              {phase === 'learned' ? 'what changed' : 'what we believed'}
            </h2>
            <span className="font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55">
              {phase === 'learned'
                ? 'one contradicted, one stronger, one new'
                : 'three standing hypotheses'}
            </span>
          </div>

          <MemoryBoard learned={phase === 'learned'} />

          <AnimatePresence>
            {phase === 'learned' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.7 }}
                className="mt-8"
              >
                <p className="max-w-[40ch] font-voice text-[1.1rem] italic leading-snug text-paper/62">
                  nothing was deleted. the belief that turned out to be wrong is still on the
                  board, crossed out, so you can see it was ever there.
                </p>
                <Link
                  href="/next-wednesday"
                  data-cursor="see if it mattered"
                  className="mt-6 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
                >
                  next wednesday →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}
