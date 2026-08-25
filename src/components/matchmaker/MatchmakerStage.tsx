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
import { SignalBoard } from './SignalBoard';
import { WhoBoard } from './WhoBoard';
import { Verdict } from './Verdict';
import { XRay } from './XRay';

/**
 * The matchmaker, as one story.
 *
 * Twelve acts compressed into one continuous surface: the reconstructed
 * onboarding in a phone, the compiled person model behind it, the one
 * question worth asking, the two-directional field, the holds and their
 * counterfactuals, the Wednesday verdict, and the bridge into FIRST SCENE
 * — the same six-room stage this site has always been, now with its
 * upstream question answered. Press D (or the button) and the phone's
 * machinery opens: run, trace, replay, evals. All of it computes from the
 * pure engine in `src/lib/matchmaker.ts`; nothing on this page is a
 * decorated number.
 */

const SEEKERS: Record<string, PersonModel> = { maya: MAYA_MODEL, priya: PRIYA_MODEL };
const poolFor = (id: string): CandidateProfile[] => CANDIDATES.filter((c) => POOLS[id].includes(c.id));

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
  const [xray, setXray] = useState(false);
  const systemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    track('matchmaker_viewed');
  }, []);

  /** The run — every board below derives from this one call. */
  const run: RunResult = useMemo(() => runMatchmaker(model, pool, week), [model, pool, week]);

  /** The question, measured against the seeker's pristine model. */
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
    // Stepping into the window is stepping into week 2 — the away weeks are
    // real weeks, not a parallel switch, so the whole run moves with them.
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

  const bridge = () => {
    const target = run.decision.selected?.candidate.bridgesTo;
    track('matchmaker_bridged', { pair: target ?? 'none' });
    router.push(target ? `/?pair=${target}` : '/');
  };

  /** D opens the machinery; Escape closes it. Buttons exist for touch. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'd') {
        setXray((v) => {
          if (!v) track('matchmaker_xray_opened');
          return !v;
        });
      }
      if (e.key === 'Escape') setXray(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectedName = run.decision.selected?.candidate.name;

  return (
    <div className="u-stack-grain relative min-h-screen bg-ink">
      <ColdOpen k="matchmaker" lines={['who should meet?']} voice="the question before the room." />
      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[64rem] flex-col px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        {/* header */}
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
              onClick={() => {
                startPhone('skip');
              }}
              className="min-h-[44px] border border-paper/25 px-5 py-2.5 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
            >
              {MM_COPY.cold.skip}
            </button>
            <button
              onClick={() => setXray(true)}
              className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-mint/80 underline-offset-4 transition-colors hover:text-mint hover:underline"
            >
              {MM_COPY.xray.open} · {MM_COPY.xray.hint}
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
              <p className="mb-5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">act one · what you told me</p>
              <PhoneReplay mode={phoneMode} onDone={beginSystem} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* the system — everything the phone was hiding */}
        <div ref={systemRef}>
          <AnimatePresence>
            {act === 'system' && (
              <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: EASE.settle }}>
                <section className="border-t border-paper/[0.09] py-10">
                  <p className="mb-1 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.heard.eyebrow}</p>
                  <p className="mb-6 font-editorial text-[0.8rem] lowercase text-paper/62">
                    {model.name} · {seekerId === 'maya' ? 'buried week, new york soon' : 'low-key week, daylight person'}
                  </p>
                  <SignalBoard model={run.model} onCorrect={onCorrect} />
                </section>

                <section className="border-t border-paper/[0.09] py-10">
                  <p className="mb-5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.question.eyebrow}</p>
                  <WhoBoard
                    run={run}
                    question={question}
                    answered={answered}
                    onAnswer={onAnswer}
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
                </section>

                {/* the bridge */}
                {!run.decision.abstained && selectedName && (
                  <section className="border-t border-paper/[0.09] py-12">
                    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE.settle }}>
                      <p className="w-fit rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-editorial text-lede font-medium text-paper-bright shadow-lift">
                        {MM_COPY.bridge.found}
                      </p>
                      <p className="mt-6 font-display text-[clamp(2rem,6.5vw,4rem)] uppercase leading-[0.9] text-paper">
                        {run.model.name} <span className="text-acid">×</span> {selectedName}
                      </p>
                      <p className="mt-5 font-editorial text-[0.8rem] lowercase text-paper/62">{MM_COPY.bridge.then}</p>
                      <p className="mt-1 font-voice text-[clamp(1.3rem,3vw,1.9rem)] italic text-paper/85">{MM_COPY.bridge.ask}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                          onClick={bridge}
                          data-cursor="into the room"
                          className="u-sheen min-h-[44px] border border-acid bg-acid px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-transparent hover:text-acid"
                        >
                          {MM_COPY.bridge.cta}
                        </button>
                        {seekerId === 'maya' && (
                          <button
                            onClick={onSecondPerson}
                            className="min-h-[44px] border border-paper/25 px-5 py-2.5 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
                          >
                            {MM_COPY.bridge.second}
                          </button>
                        )}
                      </div>
                      <p className="mt-4 max-w-[52ch] font-editorial text-[0.72rem] lowercase text-paper/55">{MM_COPY.bridge.carried}</p>
                    </motion.div>
                  </section>
                )}
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

      <AnimatePresence>{xray && <XRay run={run} onClose={() => setXray(false)} />}</AnimatePresence>
    </div>
  );
}
