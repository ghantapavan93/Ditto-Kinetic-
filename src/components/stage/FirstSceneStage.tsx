'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SpatialStage } from '@/components/three/SpatialStage';
import { SceneDial } from './SceneDial';
import { SceneHeadline } from './SceneHeadline';
import { IntroCurtain } from './IntroCurtain';
import { WhyThisScene } from '@/components/reasoning/WhyThisScene';
import { DecisionView } from '@/components/reasoning/DecisionView';
import { HearMeOut } from '@/components/reasoning/HearMeOut';
import { NotThisWeek } from '@/components/reasoning/NotThisWeek';
import { DISRUPTION_LABELS, type Disruption } from '@/lib/rankScenes';
import { Handoff } from '@/components/handoff/Handoff';
import { FeedbackReceipt } from '@/components/feedback/FeedbackReceipt';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { Volume2, VolumeX } from 'lucide-react';
import { TooMuch } from './TooMuch';
import { TimeDial } from './TimeDial';
import { JourneyRail } from './JourneyRail';
import { PairHeader } from './PairHeader';
import { FirstFifteen } from './FirstFifteen';
import { temperatureFor } from '@/lib/temperature';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { play } from '@/components/shared/sound';
import { track } from '@/lib/analytics';
import { damp } from '@/lib/motion';
import type { Fragment } from '@/lib/types';
import {
  useConditions,
  useCurrentPair,
  useCurrentScene,
  useIsWinner,
  useMagnetism,
  usePrototype,
  useIntimacy,
  useSendDecision,
  useTimeShift,
} from '@/store/prototypeStore';

/**
 * Orchestrator.
 *
 * Owns the phase machine's view side and nothing else: every piece of domain
 * state lives in the store, so this component can be remounted, resized or
 * hot-reloaded without losing where the user is in the flow.
 */
export function FirstSceneStage() {
  const pair = useCurrentPair();
  const scene = useCurrentScene();
  const magnetism = useMagnetism();
  const isWinner = useIsWinner();
  const reduced = useReducedMotion();

  const phase = usePrototype((s) => s.phase);
  const reasoningOpen = usePrototype((s) => s.reasoningOpen);
  const decisionOpen = usePrototype((s) => s.decisionOpen);
  const hearMeOutOpen = usePrototype((s) => s.hearMeOutOpen);
  const soundOn = usePrototype((s) => s.soundOn);
  const conditions = useConditions();
  const decision = useSendDecision();
  const timeShift = useTimeShift();
  const intimacy = useIntimacy();

  const begin = usePrototype((s) => s.begin);
  const goToScene = usePrototype((s) => s.goToScene);
  const stepScene = usePrototype((s) => s.stepScene);
  const selectScene = usePrototype((s) => s.selectScene);
  const openReasoning = usePrototype((s) => s.openReasoning);
  const closeReasoning = usePrototype((s) => s.closeReasoning);
  const openDecision = usePrototype((s) => s.openDecision);
  const closeDecision = usePrototype((s) => s.closeDecision);
  const toggleHearMeOut = usePrototype((s) => s.toggleHearMeOut);
  const makeItReal = usePrototype((s) => s.makeItReal);
  const reachQuiet = usePrototype((s) => s.reachQuiet);
  const applyDisruption = usePrototype((s) => s.applyDisruption);
  const setWeek = usePrototype((s) => s.setWeek);
  const resetConditions = usePrototype((s) => s.resetConditions);
  const swapPair = usePrototype((s) => s.swapPair);
  const startFeedback = usePrototype((s) => s.startFeedback);
  const toggleSound = usePrototype((s) => s.toggleSound);

  const locked = phase === 'selected' || phase === 'reasoning';
  const inHandoff = phase === 'handoff' || phase === 'quiet';
  const inFeedback = phase === 'post-date' || phase === 'memory';
  const showStageChrome = phase === 'exploring' || locked;

  /** The reason fragment currently under the pointer, if any. */
  const [reading, setReading] = useState<Fragment | null>(null);

  /** Handoff progress 0..1, driving the WebGL layer's exit. */
  const [exiting, setExiting] = useState(0);
  const exitRef = useRef(0);
  useEffect(() => {
    const target = inHandoff || inFeedback ? 1 : 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      exitRef.current = damp(exitRef.current, target, reduced ? 40 : 2.4, dt);
      setExiting(exitRef.current);
      if (Math.abs(exitRef.current - target) > 0.002) raf = requestAnimationFrame(tick);
      else setExiting(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inHandoff, inFeedback, reduced]);

  useEffect(() => {
    track('prototype_loaded');
  }, []);

  /** The snap is audible as well as visual — it is the product's one big moment. */
  const commit = useCallback(() => {
    selectScene();
    play('snap', soundOn);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.([12, 26, 14]);
  }, [selectScene, soundOn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      // The dial owns its own arrow keys. Without this, a focused dial advances
      // twice per press — once from its handler and once from this one.
      if (target?.getAttribute?.('role') === 'slider') return;

      if (e.key === 'Escape') {
        if (decisionOpen) closeDecision();
        else if (hearMeOutOpen) toggleHearMeOut();
        else if (reasoningOpen) closeReasoning();
        return;
      }
      if (!showStageChrome) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepScene(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepScene(1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Nothing to commit to when the system is declining to send.
        if (!decision.send) return;
        if (phase === 'exploring') commit();
        else if (!reasoningOpen) openReasoning();
      } else if (e.key.toLowerCase() === 'd') {
        openDecision();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    closeDecision,
    closeReasoning,
    commit,
    decision.send,
    decisionOpen,
    hearMeOutOpen,
    openDecision,
    openReasoning,
    phase,
    reasoningOpen,
    showStageChrome,
    stepScene,
    toggleHearMeOut,
  ]);

  return (
    <div id="stage-root" className="u-stack-grain bg-ink">
      {/*
        Ambient wash. Reads from the same `temperature.ts` the lights do, so the
        page and the stage can never disagree about what a room feels like.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-scene ease-settle"
        style={{ background: temperatureFor(scene.mood).wash }}
      />

      {/* WebGL layer */}
      <div className="absolute inset-0 z-stage" data-cursor="come closer">
        <SpatialStage
          pair={pair}
          scene={scene}
          magnetism={magnetism}
          locked={locked}
          exiting={exiting}
          reducedMotion={reduced}
          timeShift={timeShift}
          intimacy={intimacy}
          onFragment={setReading}
        />
      </div>

      {/* Intro */}
      <AnimatePresence>
        {phase === 'intro' && <IntroCurtain key="intro" onBegin={begin} />}
      </AnimatePresence>

      {/* Stage chrome */}
      <AnimatePresence>
        {showStageChrome && (
          <motion.div
            key="chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-artifacts flex flex-col justify-between px-gutter py-[clamp(1rem,3.5vh,2rem)]"
          >
            {/* top bar */}
            <div className="pointer-events-auto flex flex-col gap-4">
              <div className="flex items-start justify-end gap-2">
                <p className="mr-auto font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/40 md:hidden">
                  wed 7:00 pm · {pair.personA.name} × {pair.personB.name}
                </p>
                <button
                  onClick={swapPair}
                  className="border border-paper/15 px-2.5 py-1.5 font-mono text-micro uppercase text-paper/60 transition-colors hover:border-paper/45 hover:text-paper"
                  title="Run the same six rooms for a different pair"
                >
                  other pair
                </button>
                <button
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                  aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
                  data-cursor={soundOn ? 'go quiet' : 'let it click'}
                  className="flex items-center gap-1.5 border border-paper/15 px-2.5 py-1.5 font-mono text-micro uppercase text-paper/60 transition-colors hover:border-paper/45 hover:text-paper"
                >
                  {soundOn ? (
                    <Volume2 size={12} strokeWidth={2} aria-hidden />
                  ) : (
                    <VolumeX size={12} strokeWidth={2} aria-hidden />
                  )}
                  {soundOn ? 'sound on' : 'sound off'}
                </button>
              </div>

              <PairHeader pair={pair} />
            </div>

            {/* headline block — or the abstention, when there is nothing to send */}
            <div className="max-w-[min(36rem,90vw)] pb-4 sm:pb-10">
              <AnimatePresence mode="popLayout" initial={false}>
                {decision.send ? (
                  <motion.div key="headline" className="pointer-events-none">
                    <SceneHeadline scene={scene} isWinner={isWinner} timeShift={timeShift} />
                    {locked && <FirstFifteen pairId={pair.id} sceneId={scene.id} />}
                  </motion.div>
                ) : (
                  <NotThisWeek
                    key="abstain"
                    pair={pair}
                    decision={decision}
                    onSeeWorkings={openDecision}
                    onEaseOff={resetConditions}
                  />
                )}
              </AnimatePresence>

              {/* What the disruptions did, and — more importantly — did not do. */}
              {(conditions.disruptions.length > 0 || conditions.excluded.length > 0) && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pointer-events-none mt-5 inline-block border-l-2 border-acid pl-3 font-mono text-micro uppercase leading-relaxed text-paper/55"
                >
                  {conditions.excluded.length > 0 && (
                    <>
                      {conditions.excluded.length} venue{conditions.excluded.length > 1 ? 's' : ''} lost
                      <br />
                    </>
                  )}
                  {conditions.disruptions.map((d) => (
                    <span key={d}>
                      {DISRUPTION_LABELS[d].label}
                      <br />
                    </span>
                  ))}
                  <span className="text-mint">pair held · context replanned · nobody rematched</span>
                </motion.p>
              )}
            </div>

            {/* bottom bar */}
            <div className="pointer-events-auto flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="order-2 flex flex-wrap items-center gap-2 sm:order-1">
                <AnimatePresence mode="popLayout">
                  {!decision.send ? null : phase === 'exploring' ? (
                    <motion.button
                      key="choose"
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      onClick={commit}
                      className={`min-h-[44px] border px-4 py-2 font-mono text-micro uppercase transition-colors
                        ${isWinner ? 'border-acid text-acid hover:bg-acid hover:text-ink' : 'border-paper/25 text-paper/80 hover:border-paper/60 hover:text-paper'}`}
                    >
                      {isWinner ? 'choose this one' : 'choose anyway'}
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        key="why"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onClick={reasoningOpen ? closeReasoning : openReasoning}
                        className="min-h-[44px] border border-paper/25 px-4 py-2 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
                      >
                        why this one?
                      </motion.button>
                      <motion.button
                        key="real"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onClick={makeItReal}
                        data-cursor="make it real"
                        className="min-h-[44px] border border-acid bg-acid px-4 py-2 font-mono text-micro uppercase text-ink transition-colors hover:bg-transparent hover:text-acid"
                      >
                        make it real
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>

                <button
                  onClick={openDecision}
                  className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/40 underline-offset-4 transition-colors hover:text-paper/80 hover:underline"
                >
                  see the decision
                </button>
                <button
                  onClick={toggleHearMeOut}
                  className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/40 underline-offset-4 transition-colors hover:text-acid hover:underline"
                >
                  hear me out
                </button>
              </div>

              {/*
                Resilience. Each control invalidates one named part of the
                context and the plan is re-derived from what survives. The pair
                is never touched — and when nothing left clears the send bar,
                the plan is withdrawn rather than downgraded.
              */}
              <div className="order-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:order-3 sm:w-full sm:justify-start">
                <span className="font-mono text-micro uppercase text-paper/25">break it:</span>
                {(Object.keys(DISRUPTION_LABELS) as Disruption[]).map((d) => {
                  const spent =
                    d === 'venue'
                      ? conditions.excluded.length >= pair.scenes.length - 1
                      : conditions.disruptions.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => applyDisruption(d)}
                      disabled={spent}
                      title={DISRUPTION_LABELS[d].effect}
                      className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-paper/35 underline-offset-4 transition-colors hover:text-acid hover:underline disabled:text-paper/15 disabled:no-underline"
                    >
                      {DISRUPTION_LABELS[d].label}
                    </button>
                  );
                })}
                <span className="text-paper/15">·</span>
                <button
                  onClick={() => setWeek(conditions.week === 'normal' ? 'strained' : 'normal')}
                  aria-pressed={conditions.week === 'strained'}
                  className={`min-h-[44px] px-1 py-2 font-mono text-micro uppercase underline-offset-4 transition-colors hover:underline ${
                    conditions.week === 'strained' ? 'text-acid' : 'text-paper/35 hover:text-acid'
                  }`}
                  title="Exam week. Nobody's calendar changes; everybody's capacity does."
                >
                  {conditions.week === 'strained' ? 'exam week: on' : 'make it exam week'}
                </button>
                {(conditions.disruptions.length > 0 ||
                  conditions.excluded.length > 0 ||
                  conditions.week !== 'normal') && (
                  <button
                    onClick={resetConditions}
                    className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
                  >
                    reset
                  </button>
                )}
              </div>

              <div className="order-1 flex flex-col items-center gap-3 self-center sm:order-2 sm:self-end">
                <TimeDial />
                <SceneDial scenes={pair.scenes} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WhyThisScene scene={scene} open={reasoningOpen} onClose={closeReasoning} />
      <HearMeOut
        pair={pair}
        open={hearMeOutOpen}
        onClose={toggleHearMeOut}
        canChangeScene={decision.send && decision.scene.id !== scene.id}
        onChangeScene={() => {
          if (decision.send) goToScene(decision.scene.id, 'list');
          toggleHearMeOut();
        }}
      />
      <DecisionView
        pair={pair}
        currentSceneId={scene.id}
        conditions={conditions}
        open={decisionOpen}
        onClose={closeDecision}
        onPick={(id) => goToScene(id, 'list')}
      />

      <AnimatePresence>
        {inHandoff && (
          <Handoff
            key="handoff"
            pair={pair}
            scene={scene}
            soundOn={soundOn}
            onQuiet={reachQuiet}
            onFeedback={startFeedback}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{inFeedback && <FeedbackReceipt key="feedback" pair={pair} />}</AnimatePresence>

      {/*
        The blush. One line, only for the affectionate reasons, gone the moment
        you stop reading it. It is the smallest thing in the piece and probably
        the one people will mention.
      */}
      <AnimatePresence>
        {reading?.kind === 'spark' && showStageChrome && (
          <motion.p
            key="blush"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
            transition={{ duration: 0.28 }}
            className="pointer-events-none absolute left-1/2 top-[14%] z-overlay -translate-x-1/2 font-hand text-[1.35rem] text-acid/80"
          >
            okay cute
          </motion.p>
        )}
      </AnimatePresence>

      {showStageChrome && <JourneyRail phase={phase} />}
      <NarrativeCursor />
      {showStageChrome && <TooMuch />}

      {/* Disclosure persists on the stage, quietly. */}
      {showStageChrome && (
        <PrototypeDisclosure className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-center lg:block" />
      )}
    </div>
  );
}
