'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Coffee, Image as ImageIcon, Receipt, Route, Ticket } from 'lucide-react';
import { SCRUB_DAYS, openWorld, type Candidate } from '@/lib/intersections';
import { DevelopingFrame } from '@/components/after/DevelopingFrame';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const PossibilityWorld = dynamic(
  () => import('./PossibilityWorld').then((m) => m.PossibilityWorld),
  { ssr: false },
);

const PRESET = 'I moved here recently and just want someone fun to get me out of the house.';

const DAY_LABEL: Record<number, string> = { 3: 'wed', 4: 'thu', 5: 'fri' };

const GLYPH: Record<Candidate['artifact'], typeof Ticket> = {
  ticket: Ticket,
  receipt: Receipt,
  photo: ImageIcon,
  table: Coffee,
  book: BookOpen,
  route: Route,
};

type Phase = 'you' | 'opening' | 'revealed';

/**
 * Act II. One person, then the space around them.
 *
 * The sentence physically reorganises the world: the camera pulls back, your
 * belongings recede, and six possible human moments appear — as artifacts with
 * times on them, never as people. The model behind this holds no person data
 * on an unlocked candidate, so there is nothing here to accidentally show.
 *
 * One possibility approaches, because the compiler found a combination of
 * intent, room, hour and shape that clears the send bar. Only when it arrives
 * does anybody's photography develop. That ordering is the entire page: an
 * opening appears in your life before a person does.
 *
 * The evening scrub is the social-weather idea inside the product surface.
 * Wednesday, Thursday and Friday are genuinely different worlds — different
 * candidates are available, and sometimes a different intersection approaches,
 * because the mutual windows underneath are real. When a scrub keeps the same
 * pair but a better night, the copy says the true thing: same people, better
 * night.
 *
 * When it settles, the handoff goes to the stage this whole site already
 * trusts: the locked pair becomes the First Scene pair, landed by the same
 * engine call the stage itself uses.
 */
export function PossibilityStage() {
  const [phase, setPhase] = useState<Phase>('you');
  const [sentence, setSentence] = useState('');
  const [said, setSaid] = useState(PRESET);
  const [day, setDay] = useState<(typeof SCRUB_DAYS)[number]>(4);
  const [develop, setDevelop] = useState(0);
  const [nightNote, setNightNote] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const world = useMemo(() => openWorld(said, day), [said, day]);

  useEffect(() => {
    track('possibility_viewed');
  }, []);

  const say = useCallback((text: string) => {
    if (!text.trim()) return;
    setSaid(text);
    setPhase('opening');
    setDevelop(0);
    track('possibility_opened');
  }, []);

  /**
   * The approach settles on the frame loop, and a hidden tab suspends the
   * frame loop — the same trap the after-page hit, with the same fix. If the
   * physics has not announced arrival within a beat of when it would have,
   * the reveal happens anyway. Visible users never see this fire.
   */
  useEffect(() => {
    if (phase !== 'opening') return;
    const failsafe = setTimeout(() => {
      setPhase((current) => (current === 'opening' ? 'revealed' : current));
      setDevelop(1);
    }, 4200);
    return () => clearTimeout(failsafe);
  }, [phase]);

  // The photograph develops only after the approach has physically settled.
  const raf = useRef(0);
  const onSettled = useCallback(() => {
    setPhase('revealed');
    track('possibility_locked', { pair: world.locked?.pair.id });

    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (reduced ? 200 : 2400));
      setDevelop(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [world.locked?.pair.id, reduced]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /**
   * Scrubbing after the lock: say what actually changed.
   *
   * The note is computed here with a direct `openWorld` call rather than in an
   * effect watching the lock — `openWorld` is pure and cheap, and an effect
   * would need a synchronous setState the compiler rightly rejects.
   */
  const scrub = (d: (typeof SCRUB_DAYS)[number]) => {
    if (d === day) return;
    if (phase === 'revealed') {
      const before = world.locked?.pair.id ?? null;
      const after = openWorld(said, d).locked?.pair.id ?? null;
      setNightNote(
        after === null
          ? 'nothing clears the bar tonight. that is an answer too.'
          : after === before
            ? 'same people. better night.'
            : 'a different evening opens.',
      );
      setDevelop(1);
    }
    setDay(d);
  };

  const locked = world.locked;

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <PossibilityWorld
          candidates={world.candidates}
          lockedId={phase === 'you' ? null : (locked?.candidateId ?? null)}
          opened={phase !== 'you'}
          settled={phase === 'revealed'}
          onSettled={onSettled}
          reducedMotion={reduced}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(110% 62% at 12% 100%, rgba(11,9,7,0.9), transparent 55%), radial-gradient(90% 45% at 88% 0%, rgba(11,9,7,0.78), transparent 55%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62">
              possibility
            </p>
            {phase !== 'you' && (
              <div className="flex items-baseline gap-2.5">
                {SCRUB_DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => scrub(d)}
                    data-cursor="this evening"
                    className={`py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] transition-colors ${
                      d === day ? 'text-tungsten' : 'text-paper/55 hover:text-paper/60'
                    }`}
                  >
                    {DAY_LABEL[d]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        {/* the sentence */}
        <AnimatePresence>
          {phase === 'you' && (
            <motion.section
              key="ask"
              exit={{ opacity: 0, y: -14, transition: { duration: 0.7 } }}
              className="max-w-[36rem]"
            >
              <h1 className="font-voice text-[clamp(1.5rem,4vw,2.5rem)] leading-tight text-paper">
                what kind of life do you want more of?
              </h1>
              <input
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') say(sentence || PRESET);
                }}
                aria-label="What kind of life do you want more of"
                placeholder={PRESET}
                className="mt-6 w-full border-b border-paper/15 bg-transparent pb-2 font-voice text-[1.1rem] text-paper outline-none transition-colors placeholder:text-paper/55 focus:border-tungsten"
              />
              <button
                onClick={() => say(sentence || PRESET)}
                data-cursor="say it"
                className="mt-5 border border-tungsten/60 px-5 py-2.5 font-editorial text-[0.78rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
              >
                say it
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        {/* the possibilities, as text a screen reader can actually read */}
        {phase !== 'you' && (
          <section aria-label="Possible evenings" className="max-w-[46rem]">
            <AnimatePresence>
              {nightNote && (
                <motion.p
                  key={nightNote + day}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 font-voice text-[1.1rem] italic leading-snug text-tungsten"
                >
                  {nightNote}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2">
              {world.candidates.map((c) => {
                const Glyph = GLYPH[c.artifact];
                const isLock = locked?.candidateId === c.id;
                return (
                  <span
                    key={c.id}
                    className={`flex items-center gap-2 rounded-artifact border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                      isLock
                        ? 'border-tungsten/60 text-tungsten'
                        : c.availableToday
                          ? c.clears
                            ? 'border-paper/20 text-paper/60'
                            : 'border-paper/12 text-paper/55'
                          : 'border-paper/[0.07] text-paper/55'
                    }`}
                  >
                    <Glyph size={12} strokeWidth={1.5} aria-hidden />
                    {c.when}
                    <span className="normal-case tracking-normal text-[0.6rem] lowercase opacity-70">
                      {isLock
                        ? 'forming'
                        : !c.availableToday
                          ? 'not tonight'
                          : c.clears
                            ? 'possible'
                            : 'unsettled'}
                    </span>
                  </span>
                );
              })}
            </div>

            <p className="mt-3 max-w-[52ch] font-editorial text-[0.7rem] lowercase leading-relaxed tracking-wide text-paper/55">
              no names, no faces, no map of strangers. a possibility is an artifact and an
              hour until it clears the bar — the unsettled ones are real pairs this system
              held back, and they will not stop moving.
            </p>
          </section>
        )}

        {/* the reveal */}
        <AnimatePresence>
          {phase === 'revealed' && locked && (
            <motion.section
              key={locked.pair.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto absolute right-gutter top-[16%] max-w-[24rem] rounded-artifact border border-paper/12 bg-ink/80 p-5 backdrop-blur-md"
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-paper/55">
                an opening just appeared
              </p>

              <div className="mt-4 flex gap-3">
                <DevelopingFrame person={locked.pair.personA} progress={develop} caption="" />
                <DevelopingFrame person={locked.pair.personB} progress={develop} caption="" />
              </div>

              <p className="mt-4 font-display text-[1.25rem] uppercase leading-none text-paper">
                {locked.pair.personA.name} <span className="text-paper/55">×</span>{' '}
                {locked.pair.personB.name}
              </p>
              <p className="mt-2 font-voice text-[1rem] leading-snug text-paper/70">
                {locked.scene.label.toLowerCase()} · {locked.when.toLowerCase()} ·{' '}
                {locked.scene.location}
              </p>
              <p className="mt-2 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/62">
                {locked.shape.how}
              </p>

              <Link
                href={`/?pair=${locked.pair.id}`}
                onClick={() => track('possibility_handoff', { pair: locked.pair.id })}
                data-cursor="walk in"
                className="mt-5 inline-block border border-tungsten/60 px-4 py-2 font-editorial text-[0.74rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
              >
                walk into the first scene →
              </Link>
            </motion.section>
          )}
        </AnimatePresence>

        <PrototypeDisclosure />
      </div>
    </div>
  );
}
