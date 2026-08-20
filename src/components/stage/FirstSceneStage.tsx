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
import { Handoff } from '@/components/handoff/Handoff';
import { FeedbackReceipt } from '@/components/feedback/FeedbackReceipt';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { play } from '@/components/shared/sound';
import { track } from '@/lib/analytics';
import { damp } from '@/lib/motion';
import {
  useCurrentPair,
  useCurrentScene,
  useIsWinner,
  useMagnetism,
  usePrototype,
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
  const brokenSceneId = usePrototype((s) => s.brokenSceneId);
  const soundOn = usePrototype((s) => s.soundOn);

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
  const breakVenue = usePrototype((s) => s.breakVenue);
  const swapPair = usePrototype((s) => s.swapPair);
  const startFeedback = usePrototype((s) => s.startFeedback);
  const toggleSound = usePrototype((s) => s.toggleSound);

  const locked = phase === 'selected' || phase === 'reasoning';
  const inHandoff = phase === 'handoff' || phase === 'quiet';
  const inFeedback = phase === 'post-date' || phase === 'memory';
  const showStageChrome = phase === 'exploring' || locked;

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
      {/* Ambient wash — shifts with the scene's mood without being a gradient soup. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-scene ease-settle"
        style={{
          background:
            scene.mood === 'inevitable'
              ? 'radial-gradient(120% 90% at 22% 28%, rgba(255,120,60,0.16), transparent 55%), radial-gradient(100% 80% at 82% 76%, rgba(43,68,255,0.20), transparent 60%)'
              : scene.mood === 'depleted'
                ? 'radial-gradient(120% 90% at 50% 40%, rgba(120,130,150,0.08), transparent 60%)'
                : scene.mood === 'busy'
                  ? 'radial-gradient(90% 70% at 78% 30%, rgba(255,46,136,0.14), transparent 58%), radial-gradient(90% 70% at 20% 70%, rgba(43,68,255,0.12), transparent 60%)'
                  : 'radial-gradient(110% 85% at 32% 26%, rgba(43,68,255,0.14), transparent 58%)',
        }}
      />

      {/* WebGL layer */}
      <div className="absolute inset-0 z-stage">
        <SpatialStage
          pair={pair}
          scene={scene}
          magnetism={magnetism}
          locked={locked}
          exiting={exiting}
          reducedMotion={reduced}
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
            <div className="pointer-events-auto flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-label uppercase text-paper/55">WED 7:00 PM</p>
                <p className="mt-1 font-mono text-micro uppercase text-paper/30">
                  {pair.personA.name} × {pair.personB.name} · {pair.personA.fictionalCampus}
                </p>
              </div>

              <div className="flex items-center gap-2">
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
                  className="border border-paper/15 px-2.5 py-1.5 font-mono text-micro uppercase text-paper/60 transition-colors hover:border-paper/45 hover:text-paper"
                >
                  {soundOn ? 'sound on' : 'sound off'}
                </button>
              </div>
            </div>

            {/* headline block */}
            <div className="pointer-events-none max-w-[min(34rem,86vw)] pb-4 sm:pb-10">
              <SceneHeadline scene={scene} isWinner={isWinner} />

              {brokenSceneId && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 inline-block border-l-2 border-acid pl-3 font-mono text-micro uppercase leading-relaxed text-paper/55"
                >
                  venue fell through · pair held · context replanned
                  <br />
                  <span className="text-acid/70">romance is fragile. the plan shouldn’t be.</span>
                </motion.p>
              )}
            </div>

            {/* bottom bar */}
            <div className="pointer-events-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="order-2 flex flex-wrap items-center gap-2 sm:order-1">
                <AnimatePresence mode="popLayout">
                  {phase === 'exploring' ? (
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
                {locked && !brokenSceneId && (
                  <button
                    onClick={breakVenue}
                    className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/30 underline-offset-4 transition-colors hover:text-paper/70 hover:underline"
                    title="Invalidate the venue and see what survives"
                  >
                    break the plan
                  </button>
                )}
              </div>

              <div className="order-1 self-center sm:order-2 sm:self-end">
                <SceneDial scenes={pair.scenes} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WhyThisScene scene={scene} open={reasoningOpen} onClose={closeReasoning} />
      <HearMeOut pair={pair} open={hearMeOutOpen} onClose={toggleHearMeOut} />
      <DecisionView
        pair={pair}
        currentSceneId={scene.id}
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

      {/* Disclosure persists on the stage, quietly. */}
      {showStageChrome && (
        <PrototypeDisclosure className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-center lg:block" />
      )}
    </div>
  );
}
