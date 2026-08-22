'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { STATIONS, stationAt } from '@/lib/vision';
import { termsFor } from '@/lib/language';
import { spring, type Spring } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const VisionScene = dynamic(() => import('./VisionScene').then((m) => m.VisionScene), {
  ssr: false,
});

/**
 * Copy deck for the flight, written by a three-writer panel and three judges
 * against the site's own register: lowercase, short, honest to a fault, and
 * never promising what no system can promise. The judged winner, with the
 * strongest lines from the losing decks grafted in.
 */
const COPY: {
  opener: { title: string; sub: string };
  stations: Record<string, { title: string; lines: string[] }>;
  closing: string[];
} = {
  opener: {
    title: 'a letter from thursday night',
    sub: '2030, remembering how it started — sure about the feeling, guessing at everything else.',
  },
  stations: {
    tonight: {
      title: 'it began as one evening',
      lines: [
        'you’ve met the right person on the wrong night. everyone has.',
        'so the room got chosen on purpose, and the ending was said out loud before it started.',
        'it couldn’t make the night go well. it could make it go somewhere real.',
      ],
    },
    campus: {
      title: 'then the whole campus',
      lines: [
        '96 people, six corners, an introduction nobody’s friend could have made.',
        'we stopped asking who was out there. wednesday kept answering anyway.',
      ],
    },
    meeting: {
      title: 'not everything was a date',
      lines: [
        'a cofounder. a running partner. the friend you end up building with.',
        'somewhere in there, match stopped being the word. intersection fit better.',
      ],
    },
    city: {
      title: 'the city learned it too',
      lines: [
        'after graduation the pool got huge and somehow lonelier. you know this.',
        'the same care, one room at a time, at city scale. we never saw the database.',
      ],
    },
    quiet: {
      title: 'and then, the quiet',
      lines: [
        'the best session got shorter every year. four seconds — open, told, gone.',
        'then one thursday it didn’t appear at all. that was the whole plan.',
      ],
    },
  },
  closing: [
    'the people here are synthetic. the future is a guess. the feeling isn’t.',
    'nobody promised the person — nobody honest does. two people did the rest.',
    'go to sleep. it’s almost wednesday.',
  ],
};

/** What the rail calls each station. The letter titles start with articles. */
const RAIL: Record<string, string> = {
  tonight: 'tonight',
  campus: 'campus',
  meeting: 'meeting',
  city: 'city',
  quiet: 'quiet',
};

/**
 * The future vision, flown rather than presented.
 *
 * A separate page on purpose: everything else on this site proves machinery,
 * and this is the one surface allowed to look past it — but it earns that by
 * being made of the site's own parts. Every station reuses an act that already
 * exists and is already asserted; the photography is the shipped manifest; the
 * camera keeps the arrive-hold-move pacing the zoom proved. Continuation, not
 * trailer.
 *
 * The direction itself is not invented either. Beyond-dating is Ditto's
 * founder's stated position and the manifesto's own sentence — this page takes
 * them seriously at full scale, and the closing copy says exactly that.
 */
export function VisionStage() {
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);
  const [glossary, setGlossary] = useState(false);
  const reduced = useReducedMotion();

  const target = useRef(0);
  const smooth = useRef<Spring>({ x: 0, v: 0 });
  const raf = useRef(0);
  const last = useRef(0);

  // One stable object, mutated by the listener and read by the frame loop --
  // a state update per mousemove would re-render the whole canvas tree for a
  // value only the camera cares about. A memoised plain object rather than a
  // ref: the compiler forbids reading .current during render, and it is right.
  const pointer = useMemo(() => ({ x: 0, y: 0 }), []);

  const nudge = useCallback((delta: number) => {
    target.current = Math.max(0, Math.min(1, target.current + delta));
  }, []);

  useEffect(() => {
    track('vision_viewed');
  }, []);

  useEffect(() => {
    const tick = (now: number) => {
      const dt = last.current ? Math.min((now - last.current) / 1000, 1 / 30) : 1 / 60;
      last.current = now;
      const next = reduced
        ? (smooth.current.x = target.current)
        : spring(smooth.current, target.current, 6, dt);
      setT(next);
      setDone(next > 0.985);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      nudge(e.deltaY * 0.00075);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nudge(0.11);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nudge(-0.11);
      else return;
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // Touch: drag vertically to fly. The wheel listener means nothing on a
    // phone, and a flight whose only mobile input is five tiny rail buttons
    // is a desktop page wearing a responsive layout.
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY;
      nudge((touchY - y) * 0.0022);
      touchY = y;
      e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [nudge, pointer]);

  const station = stationAt(t);
  const copy = COPY.stations[station.key];

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <VisionScene t={t} pointer={pointer} reducedMotion={reduced} />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(115% 68% at 14% 100%, rgba(11,9,7,0.9), transparent 55%), radial-gradient(90% 45% at 86% 0%, rgba(11,9,7,0.72), transparent 55%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62">
            the future vision
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        {/* the opener, only before the flight starts */}
        <AnimatePresence>
          {t < 0.02 && (
            <motion.section
              key="opener"
              exit={{ opacity: 0, y: -12, transition: { duration: 0.6 } }}
              className="max-w-[34rem]"
            >
              <h1 className="font-display text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.92] text-paper">
                {COPY.opener.title}
              </h1>
              <p className="mt-4 max-w-[38ch] font-voice text-[clamp(1.1rem,2.4vw,1.45rem)] leading-snug text-paper/70">
                {COPY.opener.sub}
              </p>
              <p className="mt-6 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55">
                scroll or drag to fly. it stops at every station.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* station copy, mid-flight */}
        <section className="max-w-[32rem]" aria-live="polite">
          <AnimatePresence mode="popLayout">
            {t >= 0.02 && !done && (
              <motion.div
                key={station.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-paper/55">
                  {station.key === 'quiet' ? 'last stop' : `stop ${STATIONS.findIndex((s) => s.key === station.key) + 1} of ${STATIONS.length}`}
                </p>
                <h2 className="mt-2.5 font-display text-[clamp(1.6rem,4.4vw,2.7rem)] uppercase leading-[0.95] text-paper">
                  {copy.title}
                </h2>
                {copy.lines.map((line) => (
                  <p
                    key={line}
                    className="mt-3 max-w-[38ch] font-voice text-[clamp(1rem,2.1vw,1.25rem)] leading-snug text-paper/70"
                  >
                    {line}
                  </p>
                ))}

                {/*
                  The words this stop coined. A product is its language -- the
                  glossary at the end proves each of these lives in the code,
                  and these chips are where they entered the vocabulary.
                */}
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
                  {termsFor(station.key).map((term) => (
                    <span
                      key={term.word}
                      className="font-mono text-[0.6rem] lowercase tracking-[0.14em] text-tungsten"
                    >
                      {term.word}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {done && (
              <motion.div
                key="closing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
              >
                {COPY.closing.map((line, i) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 1.6, duration: 1.1 }}
                    className={`mt-3 max-w-[30ch] font-voice leading-snug ${
                      i === COPY.closing.length - 1
                        ? 'text-[clamp(1.2rem,3vw,1.7rem)] text-tungsten'
                        : 'text-[clamp(1.05rem,2.4vw,1.4rem)] text-paper/75'
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 6, duration: 1.2 }}
                  onClick={() => setGlossary((g) => !g)}
                  data-cursor="the words"
                  className="py-1.5 mt-8 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper/70 hover:underline"
                >
                  {glossary ? 'put the words away' : 'the language this built \u2192'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/*
          The ubiquitous language, collected. Every row names the file and
          symbol the word lives in, and claim 28 opens each file and checks --
          a glossary whose words are not the code's words is marketing.
        */}
        <AnimatePresence>
          {glossary && (
            <motion.section
              key="glossary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              aria-label="The language this project built"
              className="pointer-events-auto absolute right-gutter top-[12%] max-h-[70vh] w-full max-w-[26rem] overflow-y-auto rounded-artifact border border-paper/12 bg-ink/85 p-5 backdrop-blur-md"
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-paper/55">
                the language, and where each word lives
              </p>
              <ul className="mt-4 grid gap-3.5">
                {STATIONS.flatMap((st) => termsFor(st.key)).map((term) => (
                  <li key={term.word} className="border-t border-paper/[0.07] pt-2.5">
                    <p className="font-display text-[0.95rem] lowercase leading-none text-tungsten">
                      {term.word}
                    </p>
                    <p className="mt-1.5 font-voice text-[0.92rem] leading-snug text-paper/75">
                      {term.says}
                    </p>
                    <p className="mt-1 font-mono text-[0.56rem] lowercase tracking-wide text-paper/55">
                      {term.file} · {term.symbol}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-[26rem]">
            <div className="flex items-baseline justify-between">
              {STATIONS.map((s, i) => {
                const at = i / (STATIONS.length - 1);
                const near = Math.abs(t - at) < 0.11;
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      target.current = at;
                    }}
                    data-cursor="fly here"
                    className={`py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide transition-colors ${
                      near ? 'text-tungsten' : 'text-paper/55 hover:text-paper/70'
                    }`}
                  >
                    {/* Fixed nouns, not the letter's first words — those are
                        articles, and a rail reading "then not the and" is
                        exactly the kind of bug only looking finds. */}
                    {RAIL[s.key]}
                  </button>
                );
              })}
            </div>
            <div className="relative mt-2.5 h-px w-full bg-paper/15">
              <motion.span
                className="absolute -top-[3px] block h-[7px] w-[7px] rounded-full bg-tungsten"
                animate={{ left: `${t * 100}%` }}
                transition={{ duration: 0 }}
                style={{ transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>
    </div>
  );
}
