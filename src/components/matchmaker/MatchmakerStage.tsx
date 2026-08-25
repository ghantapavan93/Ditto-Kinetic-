'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ColdOpen } from '@/components/shared/ColdOpen';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { EASE } from '@/lib/motion';
import { track } from '@/lib/analytics';
import {
  applyScenario, chooseQuestion, runMatchmaker, withAnswer, type RunResult, type Scenario,
} from '@/lib/matchmaker';
import { correctBelief, retireSignal, type Firmness, type PersonModel } from '@/lib/personModel';
import { ASKABLE, CANDIDATES, MAYA_MODEL, MM_COPY, POOLS, PRIYA_MODEL, type CandidateProfile } from '@/data/matchmaking';
import { PhoneReplay } from './PhoneReplay';
import { SurfaceReveal } from './SurfaceReveal';
import { HandoffSequence } from './HandoffSequence';
import { SignalBoard } from './SignalBoard';
import { WhoBoard } from './WhoBoard';
import { Verdict } from './Verdict';
import { XRay } from './XRay';

/**
 * The matchmaker, as three sheets of glass.
 *
 * SURFACE is the whole consumer story: the phone, twenty-four answers
 * falling away, one question, SNAP, found someone, into the room. THINKING
 * pulls the first sheet — the compiled beliefs, the two-directional field,
 * the holds and their counterfactuals. PROOF pulls the second — trace,
 * replay, evals. One gesture (D, or the glass control) moves between them,
 * and everything below the surface computes from the same pure engine, so
 * the simple outside and the inspectable underneath can never disagree.
 *
 * The handoff at the end is the page's thesis stated physically: WHO does
 * not link to HOW — it emits an introduction, and the six rooms assemble
 * around the surviving pair before the route changes.
 */

const SEEKERS: Record<string, PersonModel> = { maya: MAYA_MODEL, priya: PRIYA_MODEL };
const poolFor = (id: string): CandidateProfile[] => CANDIDATES.filter((c) => POOLS[id].includes(c.id));

type GlassView = 'surface' | 'thinking' | 'proof';
const GLASS_ORDER: GlassView[] = ['surface', 'thinking', 'proof'];

export function MatchmakerStage() {
  const router = useRouter();
  const [seekerId, setSeekerId] = useState<'maya' | 'priya'>('maya');
  const [model, setModel] = useState<PersonModel>(MAYA_MODEL);
  const [pool, setPool] = useState<CandidateProfile[]>(() => poolFor('maya'));
  const [week, setWeek] = useState(1);
  const [act, setAct] = useState<'cold' | 'phone' | 'system'>('cold');
  const [phoneMode, setPhoneMode] = useState<'replay' | 'skip'>('replay');
  const [answered, setAnswered] = useState<number | null>(null);
  const [thinWeek, setThinWeek] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [scenarioNote, setScenarioNote] = useState<string | null>(null);
  const [hearNote, setHearNote] = useState<string | null>(null);
  const [view, setView] = useState<GlassView>('surface');
  const [handingOff, setHandingOff] = useState(false);
  const systemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    track('matchmaker_viewed');
  }, []);

  const run: RunResult = useMemo(() => runMatchmaker(model, pool, week), [model, pool, week]);

  const question = useMemo(
    () => chooseQuestion(SEEKERS[seekerId], poolFor(seekerId), 1, ASKABLE[seekerId]),
    [seekerId],
  );

  const beginSystem = useCallback(() => {
    setAct('system');
    setTimeout(() => systemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, []);

  const startPhone = (mode: 'replay' | 'skip') => {
    setPhoneMode(mode);
    setAct('phone');
    track('matchmaker_flow_replayed', { mode });
  };

  const onAnswer = (i: number) => {
    if (!question) return;
    setAnswered(i);
    setModel((m) => withAnswer(m, question.question, i));
    track('matchmaker_question_answered', { option: i });
  };

  const onCorrect = (key: string, firmness: Firmness) => {
    setModel((m) => ({ ...m, beliefs: correctBelief(m.beliefs, key, firmness) }));
  };

  const onScenario = (s: Scenario) => {
    const applied = applyScenario(model, pool, week, s);
    setModel(applied.model);
    setPool(applied.pool);
    setWeek(applied.week);
    if (s === 'nyc-window') setWindowOpen(true);
    setScenarioNote(MM_COPY.scenarios[s]);
  };

  const onToggleWindow = () => {
    setWindowOpen((open) => {
      setWeek(open ? 1 : 2);
      return !open;
    });
  };

  const onToggleThinWeek = () => {
    setThinWeek((thin) => {
      setWeek(thin ? (windowOpen ? 2 : 1) : 4);
      return !thin;
    });
  };

  const onHearMeOut = (choice: 'trust' | 'not-now' | 'never') => {
    if (choice === 'never') setModel((m) => ({ ...m, beliefs: retireSignal(m.beliefs, 'energy') }));
    setHearNote(MM_COPY.hearNotes[choice]);
  };

  const onSecondPerson = () => {
    setSeekerId('priya');
    setModel(PRIYA_MODEL);
    setPool(poolFor('priya'));
    setWeek(1);
    setAnswered(null);
    setThinWeek(false);
    setWindowOpen(false);
    setScenarioNote(null);
    setHearNote(null);
    setTimeout(() => systemRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  /** The handoff: play the WHO → HOW sequence, then change routes. */
  const openFirstScene = () => setHandingOff(true);
  const completeHandoff = useCallback(() => {
    const target = run.decision.selected?.candidate.bridgesTo;
    track('matchmaker_bridged', { pair: target ?? 'none' });
    router.push(target ? `/?pair=${target}` : '/');
  }, [run, router]);

  /** D pulls the glass: surface → thinking → proof → surface. */
  const pullGlass = useCallback(() => {
    setView((v) => {
      const next = GLASS_ORDER[(GLASS_ORDER.indexOf(v) + 1) % GLASS_ORDER.length];
      if (next === 'proof') track('matchmaker_xray_opened');
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'd') pullGlass();
      if (e.key === 'Escape') setView('surface');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pullGlass]);

  const selected = run.decision.selected;

  return (
    <div className="u-stack-grain relative min-h-screen bg-ink">
      <ColdOpen k="matchmaker" lines={['who should meet?']} voice="the question before the room." />
      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[64rem] flex-col px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">{MM_COPY.cold.eyebrow}</p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        {/* the glass control — three sheets, one gesture */}
        {act === 'system' && (
          <div className="sticky top-3 z-overlay mt-3 flex items-center gap-2 self-end">
            {GLASS_ORDER.map((g, i) => (
              <button
                key={g}
                onClick={() => setView(g)}
                aria-pressed={view === g}
                data-cursor="pull the glass"
                className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] backdrop-blur-sm transition-all ${
                  view === g
                    ? 'border-mint/60 bg-ink/85 text-mint'
                    : 'border-paper/20 bg-ink/70 text-paper/62 hover:border-paper/45'
                }`}
                style={{ transform: `translateY(${view === g ? 0 : i * 2}px)` }}
              >
                <span aria-hidden className="flex flex-col gap-[2px]">
                  {GLASS_ORDER.slice(0, i + 1).map((_, j) => (
                    <span key={j} className={`block h-[2px] w-3 rounded-full ${view === g ? 'bg-mint/80' : 'bg-paper/40'}`} />
                  ))}
                </span>
                {MM_COPY.glass[g]}
              </button>
            ))}
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-paper/55">{MM_COPY.glass.hint}</span>
          </div>
        )}

        {/* act zero — the direct opening */}
        <section className="flex min-h-[62vh] flex-col justify-center">
          <h1 className="font-display text-[clamp(2.2rem,7vw,4.6rem)] uppercase leading-[0.9] text-paper">
            {MM_COPY.cold.open1}
          </h1>
          <p className="mt-4 font-voice text-[clamp(1.3rem,3vw,2rem)] italic text-paper/85">{MM_COPY.cold.open2}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => startPhone('replay')}
              data-cursor="open it"
              className="min-h-[44px] border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
            >
              {MM_COPY.cold.replay}
            </button>
            <button
              onClick={() => startPhone('skip')}
              className="min-h-[44px] border border-paper/25 px-5 py-2.5 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
            >
              {MM_COPY.cold.skip}
            </button>
          </div>
          <p className="mt-6 max-w-[52ch] font-mono text-micro uppercase leading-relaxed text-paper/55">{MM_COPY.cold.disclosure}</p>
        </section>

        {/* act one — the phone */}
        <AnimatePresence>
          {act !== 'cold' && (
            <motion.section
              key="phone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE.settle }}
              className="border-t border-paper/[0.09] py-10"
              style={{ perspective: 1200 }}
            >
              <p className="mb-5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.actOne}</p>
              <PhoneReplay mode={phoneMode} onDone={beginSystem} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* the docked phone — small outside, large underneath */}
        <AnimatePresence>
          {act === 'system' && view !== 'surface' && (
            <motion.div
              key="dock"
              aria-hidden
              initial={{ opacity: 0, x: 60, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE.settle }}
              className="pointer-events-none fixed right-8 top-24 z-overlay hidden 2xl:block"
              style={{ perspective: 800 }}
            >
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transform: 'rotateY(-16deg) rotateZ(4deg)' }}
                className="flex h-[290px] w-[146px] flex-col overflow-hidden rounded-[1.7rem] border-[6px] border-ink bg-ink-soft/60 shadow-lift backdrop-blur-sm"
              >
                <div className="mx-auto mt-2 h-[12px] w-[56px] rounded-full bg-ink" />
                <div className="flex flex-1 flex-col items-start justify-center gap-2 px-3">
                  <span className="w-fit rounded-[0.8rem] rounded-bl-sm bg-cobalt/80 px-2.5 py-1.5 font-editorial text-[0.6rem] text-paper-bright">
                    {MM_COPY.bridge.found}
                  </span>
                  <span className="font-mono text-[0.46rem] uppercase tracking-[0.16em] text-paper/62">wed · 7:00 pm</span>
                </div>
              </motion.div>
              <p className="mt-3 text-right font-mono text-[0.5rem] uppercase tracking-[0.2em] text-paper/55">{MM_COPY.dock.small}</p>
              <p className="text-right font-mono text-[0.5rem] uppercase tracking-[0.2em] text-mint/80">{MM_COPY.dock.large}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the system */}
        <div ref={systemRef}>
          <AnimatePresence>
            {act === 'system' && (
              <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: EASE.settle }}>
                {/* SURFACE — the magic reveal, and nothing else */}
                <section className="border-t border-paper/[0.09] py-10">
                  <SurfaceReveal run={run} question={question} answered={answered} onAnswer={onAnswer} onOpen={openFirstScene} />
                  {view === 'surface' && (
                    <button
                      onClick={() => setView('thinking')}
                      className="mt-8 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-mint/70 underline-offset-4 transition-colors hover:text-mint hover:underline"
                    >
                      {MM_COPY.surface.peek}
                    </button>
                  )}
                </section>

                {/* THINKING — the sheets beneath */}
                <AnimatePresence>
                  {view !== 'surface' && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ duration: 0.55, ease: EASE.settle }}
                    >
                      <section className="border-t border-paper/[0.09] py-10">
                        <p className="mb-1 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.heard.eyebrow}</p>
                        <p className="mb-6 font-editorial text-[0.8rem] lowercase text-paper/62">
                          {model.name} · {MM_COPY.seekerLines[seekerId]}
                        </p>
                        <SignalBoard model={run.model} onCorrect={onCorrect} />
                      </section>

                      <section className="border-t border-paper/[0.09] py-10">
                        <p className="mb-5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.who.eyebrow}</p>
                        <WhoBoard
                          run={run}
                          bias={model.similarityBias}
                          onBias={(v) => setModel((m) => ({ ...m, similarityBias: v }))}
                          windowOpen={windowOpen}
                          onToggleWindow={onToggleWindow}
                        />
                      </section>

                      <section className="border-t border-paper/[0.09] py-10">
                        <p className="mb-5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.whyNot.eyebrow}</p>
                        <Verdict
                          run={run}
                          thinWeek={thinWeek}
                          onToggleThinWeek={onToggleThinWeek}
                          onScenario={onScenario}
                          scenarioNote={scenarioNote}
                          onHearMeOut={onHearMeOut}
                        />
                        {hearNote && (
                          <p className="mt-3 border-l-2 border-paper/25 pl-3 font-editorial text-[0.8rem] lowercase text-paper/70">{hearNote}</p>
                        )}
                        {seekerId === 'maya' && (
                          <button
                            onClick={onSecondPerson}
                            className="mt-6 min-h-[44px] border border-paper/25 px-5 py-2.5 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
                          >
                            {MM_COPY.bridge.second}
                          </button>
                        )}
                      </section>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-paper/[0.09] pt-5">
          <Link
            href="/film"
            data-cursor="roll it"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            the film →
          </Link>
          <PrototypeDisclosure className="text-right" />
        </footer>
      </div>

      {/* PROOF — the deepest sheet */}
      <AnimatePresence>{view === 'proof' && <XRay run={run} onClose={() => setView('thinking')} />}</AnimatePresence>

      {/* WHO → HOW */}
      <AnimatePresence>
        {handingOff && selected && (
          <HandoffSequence
            seeker={run.model.name}
            selected={selected}
            showContract={view !== 'surface'}
            onComplete={completeHandoff}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
