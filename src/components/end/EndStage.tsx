'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { compile } from '@/lib/compiler';
import { SURFACES } from '@/data/attentionInventory';
import { costOf, saidAs } from '@/lib/attention';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

/**
 * Three answers that land in three different places.
 *
 * The first draft had two of them compiling to the same evening, which for a
 * page whose point is that the machinery ran is close to fatal — an answer that
 * changes nothing looks exactly like an answer nobody read. These three take
 * the three kinds the compiler knows, so the last three clicks on the site
 * demonstrate its range without a word of explanation.
 */
const ANSWERS = [
  'one with more people I actually care about.',
  'one with someone to build something with.',
  'one where I am actually dating someone.',
];

const CLOSING = [
  'the internet helped us find things.',
  'the networks helped us find everyone.',
  'the next one should know who is worth bringing into your life.',
  'and when to leave you alone.',
];

type Phase = 'asking' | 'working' | 'answered' | 'closing' | 'gone';

/**
 * The last one, and the quietest.
 *
 * The same question the compiler opens with, asked again at the end — except
 * that by now you have seen the ranking, the abstention, the uncertainty, the
 * campus, the forces and the bill, so the question has somewhere to land.
 *
 * It runs the real compiler. Every stage happens: the sentence is read, a pair
 * is chosen, a room is scored against the send bar, an hour is found on joint
 * energy, an ending is attached. None of it is shown. One line comes out.
 *
 * That is the entire argument of the site performed on itself rather than
 * described. The compiler page spends a minute showing nine stages because it
 * has to prove they exist. This one has nothing left to prove, so it spends
 * almost nothing — and it says so, with both figures, because a claim about
 * restraint with no number attached is just a smaller font.
 *
 * The closing lines are timed slowly and deliberately outstay their welcome by
 * a beat. The last of them is the only one this project earned rather than
 * inherited: everything here has been about a system knowing when not to act,
 * and an ending that promised more connection without promising less
 * interference would be the wrong ending for it.
 */
export function EndStage() {
  const [phase, setPhase] = useState<Phase>('asking');
  const [sentence, setSentence] = useState('');
  const [line, setLine] = useState<string | null>(null);
  const [closingAt, setClosingAt] = useState(-1);
  const reduced = useReducedMotion();

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, reduced ? Math.min(ms, 200) : ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const here = SURFACES.find((s) => s.path === '/end');
  const compiler = SURFACES.find((s) => s.path === '/compiler');

  const answer = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setSentence(text);
      setPhase('working');
      track('end_answered');

      // The real thing, and none of it shown.
      const result = compile(text);
      setLine(result.action);

      after(2200, () => setPhase('answered'));
      after(6200, () => {
        setPhase('closing');
        CLOSING.forEach((_, i) => after(i * 3400, () => setClosingAt(i)));
        after(CLOSING.length * 3400 + 4200, () => setPhase('gone'));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  return (
    <div className="relative min-h-screen bg-ink">
      <div className="relative mx-auto flex min-h-screen max-w-[54rem] flex-col justify-center px-gutter py-[clamp(2rem,8vh,5rem)]">
        <AnimatePresence mode="wait">
          {/* the question */}
          {phase === 'asking' && (
            <motion.section
              key="ask"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.1 } }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-voice text-[clamp(1.7rem,5vw,3.1rem)] leading-tight text-paper">
                what kind of life do you want more of?
              </h1>

              <div className="mt-10 grid gap-2.5">
                {ANSWERS.map((a) => (
                  <button
                    key={a}
                    onClick={() => answer(a)}
                    data-cursor="say it"
                    className="w-fit border-b border-paper/15 pb-1.5 text-left font-voice text-[clamp(1.05rem,2.4vw,1.4rem)] leading-snug text-paper/55 transition-colors hover:border-tungsten hover:text-paper"
                  >
                    {a}
                  </button>
                ))}
              </div>

              <input
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') answer(sentence);
                }}
                aria-label="What kind of life do you want more of"
                placeholder="or say it yourself"
                className="mt-10 w-full max-w-[34rem] border-b border-paper/12 bg-transparent pb-2 font-voice text-[1.15rem] text-paper outline-none transition-colors placeholder:text-paper/55 focus:border-paper/50"
              />
            </motion.section>
          )}

          {/* the machinery, running, invisible */}
          {phase === 'working' && (
            <motion.section
              key="work"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.9 } }}
              transition={{ duration: 1 }}
            >
              <p className="font-voice text-[clamp(1.2rem,3vw,1.8rem)] italic leading-snug text-paper/62">
                {sentence}
              </p>
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0.2 : 2, ease: 'linear' }}
                className="mt-8 block h-px w-full max-w-[14rem] origin-left bg-tungsten/50"
              />
            </motion.section>
          )}

          {/* one line */}
          {(phase === 'answered' || phase === 'closing') && (
            <motion.section
              key="answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: phase === 'closing' ? 0.25 : 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 1.2 } }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-voice text-[clamp(1.5rem,4.4vw,2.6rem)] leading-tight text-paper">
                {line}
              </p>

              {phase === 'answered' && here && compiler && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 1.4 }}
                  className="mt-8 max-w-[44ch] font-editorial text-[0.78rem] lowercase leading-relaxed tracking-wide text-paper/55"
                >
                  {/*
                    Both figures, because a claim about restraint with no number
                    attached is just a smaller font. Same engine, same nine
                    stages, none of them shown.
                  */}
                  every stage the compiler shows you happened just then. this page cost you{' '}
                  {saidAs(costOf(here).seconds)}; that one costs{' '}
                  {saidAs(costOf(compiler).seconds)}.
                </motion.p>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* the closing */}
        <AnimatePresence>
          {phase === 'closing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 2 } }}
              className="pointer-events-none fixed inset-0 grid place-content-center px-gutter"
            >
              <div className="grid gap-6">
                {CLOSING.map((l, i) => (
                  <motion.p
                    key={l}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i <= closingAt ? 1 : 0 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    className={`max-w-[26ch] font-voice leading-snug ${
                      i === CLOSING.length - 1
                        ? 'text-[clamp(1.3rem,3.4vw,2rem)] text-tungsten'
                        : 'text-[clamp(1.15rem,3vw,1.7rem)] text-paper/75'
                    }`}
                  >
                    {l}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* and then nothing */}
        <AnimatePresence>
          {phase === 'gone' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 2.4 }}
              /* Clear of the disclosure, which is pinned lower and never
                 leaves. At short viewport heights the first version sat on top
                 of it. */
              className="fixed inset-x-0 bottom-[clamp(4.5rem,14vh,7rem)] grid place-items-center px-gutter"
            >
              <Link
                href="/"
                data-cursor="from the beginning"
                className="font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper/60 hover:underline"
              >
                start again
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The disclosure never leaves, at any phase. */}
      <PrototypeDisclosure className="pointer-events-none fixed inset-x-0 bottom-3 text-center opacity-40" />
    </div>
  );
}
