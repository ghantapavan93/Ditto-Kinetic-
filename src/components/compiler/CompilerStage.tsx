'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { MISSING_SHAPE, compile, type Compiled } from '@/lib/compiler';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

const PRESETS = [
  'I just moved here and don’t really know anyone.',
  'I need a cracked designer who thinks like me.',
  'I’m tired but I don’t want to waste Friday.',
  'I want to go on an actual date.',
  'surprise me',
];

type Phase = 'idle' | 'compiling' | 'landed' | 'quiet';

/**
 * Input: one messy human sentence. Output: a real-world moment.
 *
 * Every other surface here answers a question somebody already knew how to ask.
 * This one takes what people actually arrive with — a sentence about their life
 * — and compiles it down to a time, a person, a room and a way of first
 * meeting.
 *
 * The pacing is the design. Stages land one at a time rather than all at once,
 * because a wall of resolved fields reads as output and a sequence reads as
 * thinking; and when it finishes, everything except the one line goes away.
 * That last move is the whole product philosophy in an animation — the
 * interface is not the deliverable, the evening is, and their own manifesto
 * already says it better than this comment does: make the introduction, then
 * get out of the way.
 *
 * Two things are marked rather than blurred. READ means a regular expression
 * fired on your sentence. DERIVED means it came out of machinery that has its
 * own assertions in `npm run check`. Those are different kinds of claim, and
 * every product that fudges the difference ends up asserting things about
 * people it merely guessed.
 */
export function CompilerStage() {
  const [sentence, setSentence] = useState(PRESETS[0]);
  const [result, setResult] = useState<Compiled | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [visible, setVisible] = useState(0);
  const reduced = useReducedMotion();

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = useCallback(
    (text: string) => {
      clear();
      const compiled = compile(text);
      setResult(compiled);
      setPhase('compiling');
      setVisible(0);
      track('compiler_run', { kind: compiled.reading.kind, room: compiled.scene.id });

      if (reduced) {
        setVisible(compiled.stages.length);
        setPhase('landed');
        return;
      }

      const step = 220;
      compiled.stages.forEach((_, i) => {
        timers.current.push(setTimeout(() => setVisible(i + 1), step * (i + 1)));
      });
      timers.current.push(
        setTimeout(() => setPhase('landed'), step * (compiled.stages.length + 1)),
      );
    },
    [reduced],
  );

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(70% 45% at 50% 0%, rgba(232,145,60,0.07), transparent 62%), radial-gradient(120% 90% at 50% 108%, rgba(18,12,10,0.92), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[62rem] flex-col gap-9 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            the compiler
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        {/* everything except the answer leaves at the end */}
        <motion.div
          animate={{ opacity: phase === 'quiet' ? 0 : 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-9"
        >
          {phase === 'idle' && (
            <section className="max-w-[46rem]">
              <h1 className="font-display text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.92] text-paper">
                say the thing
                <br />
                you would actually
                <br />
                <span className="text-tungsten">say.</span>
              </h1>
              <p className="mt-6 max-w-[42ch] font-voice text-[clamp(1.1rem,2.4vw,1.45rem)] leading-snug text-paper/70">
                not a filter. not a preference slider. one sentence about your life, compiled
                into a person, an hour, a room, and a way of first meeting.
              </p>
            </section>
          )}

          {/* the input */}
          <section>
            <label
              htmlFor="sentence"
              className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55"
            >
              in
            </label>
            <textarea
              id="sentence"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              rows={2}
              className="mt-3 w-full resize-none border-b border-paper/20 bg-transparent pb-3 font-voice text-[clamp(1.3rem,3.2vw,2rem)] leading-snug text-paper outline-none transition-colors placeholder:text-paper/55 focus:border-tungsten"
              placeholder="say it however you would say it"
            />

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSentence(p)}
                  data-cursor="use this"
                  className={`py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                    sentence === p
                      ? 'text-tungsten underline'
                      : 'text-paper/55 hover:text-paper hover:underline'
                  }`}
                >
                  {p.length > 34 ? `${p.slice(0, 32)}…` : p}
                </button>
              ))}
            </div>

            <button
              onClick={() => run(sentence)}
              disabled={!sentence.trim()}
              data-cursor="compile it"
              className="mt-7 border border-tungsten/60 px-6 py-3 font-editorial text-[0.8rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink disabled:opacity-25"
            >
              {phase === 'idle' ? 'compile' : 'compile again'}
            </button>
          </section>

          {/* the stages */}
          {result && (
            <section aria-label="How the sentence was compiled" className="grid gap-px">
              {result.stages.slice(0, visible).map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="grid gap-1 border-t border-paper/10 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.55rem] tabular-nums text-paper/55">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-paper/55">
                      {s.label}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[1.15rem] uppercase leading-none text-paper">
                        {s.value}
                      </span>
                      {/*
                        READ and DERIVED are marked because they are different
                        kinds of claim. One is a regex firing on your sentence;
                        the other came out of something with its own assertions.
                      */}
                      <span
                        className={`font-mono text-[0.52rem] uppercase tracking-[0.16em] ${
                          s.derived ? 'text-mint' : 'text-tungsten'
                        }`}
                      >
                        {s.derived ? 'derived' : 'read'}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-[62ch] font-editorial text-[0.76rem] lowercase leading-relaxed tracking-wide text-paper/62">
                      {s.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </section>
          )}
        </motion.div>

        {/* the answer */}
        <AnimatePresence>
          {result && (phase === 'landed' || phase === 'quiet') && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={phase === 'quiet' ? 'fixed inset-0 z-overlay grid place-content-center px-gutter' : ''}
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
                out
              </p>

              <p
                className={`mt-4 font-voice leading-tight ${
                  result.withheld ? 'text-paper/70' : 'text-paper'
                } ${phase === 'quiet' ? 'text-[clamp(1.6rem,5vw,3rem)]' : 'text-[clamp(1.5rem,4vw,2.6rem)]'}`}
              >
                {result.action}
              </p>

              {phase === 'landed' && (
                <>
                  <p className="mt-5 max-w-[46ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/62">
                    one sentence in. nine stages, six of them computed by machinery that is
                    asserted elsewhere on this site. one evening out.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <button
                      onClick={() => {
                        setPhase('quiet');
                        track('compiler_quieted');
                      }}
                      data-cursor="take it away"
                      className="border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
                    >
                      now get out of the way
                    </button>
                    <span className="max-w-[30ch] font-editorial text-[0.72rem] lowercase leading-relaxed tracking-wide text-paper/55">
                      their words, not ours — make the introduction, then get out of the way.
                    </span>
                  </div>

                  {/* the shape this project cannot produce */}
                  <div className="mt-9 max-w-[46ch] border-t border-paper/12 pt-5">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-paper/55">
                      one shape it cannot offer
                    </p>
                    <p className="mt-2 font-display text-[1.1rem] uppercase leading-none text-paper/70">
                      {MISSING_SHAPE.name}
                    </p>
                    <p className="mt-2 font-voice text-[1rem] leading-snug text-paper/55">
                      {MISSING_SHAPE.how}
                    </p>
                    <p className="mt-2 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55">
                      {MISSING_SHAPE.why}
                    </p>
                  </div>
                </>
              )}

              {phase === 'quiet' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 1.2 }}
                  onClick={() => setPhase('landed')}
                  className="py-1.5 mt-10 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper/60 hover:underline"
                >
                  show me the working again
                </motion.button>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {phase !== 'quiet' && (
          <SnapshotRow
            srcs={['/photos/moment-10.webp']}
            note="one sentence became this."
            className="mt-2"
          />
        )}

        {phase !== 'quiet' && <PrototypeDisclosure className="mt-auto pt-6" />}
      </div>
    </div>
  );
}
