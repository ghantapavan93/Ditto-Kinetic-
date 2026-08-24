'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { replanAfter, replanFloor } from '@/lib/booking';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SpatialStage } from '@/components/three/SpatialStage';
import { RoomPlate } from './RoomPlate';
import { CLOUD_COUNT, possibilityCloud } from '@/lib/possibility';
import { SceneDial } from './SceneDial';
import { SceneHeadline } from './SceneHeadline';
import { IntroCurtain } from './IntroCurtain';
import { WhyThisScene } from '@/components/reasoning/WhyThisScene';
import { DecisionView } from '@/components/reasoning/DecisionView';
import { HearMeOut } from '@/components/reasoning/HearMeOut';
import { NotThisWeek } from '@/components/reasoning/NotThisWeek';
import { DISRUPTION_LABELS, SEND_THRESHOLD, rankScenes, type Disruption } from '@/lib/rankScenes';
import { Handoff } from '@/components/handoff/Handoff';
import { FeedbackReceipt } from '@/components/feedback/FeedbackReceipt';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { SiteMenu } from '@/components/shared/SiteMenu';
import { Volume2, VolumeX } from 'lucide-react';
import { TooMuch } from './TooMuch';
import { TimeDial } from './TimeDial';
import { JourneyRail } from './JourneyRail';
import { PairHeader } from './PairHeader';
import { FirstFifteen } from './FirstFifteen';
import { PairSwap } from './PairSwap';
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
  useSwap,
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

  /*
   * What losing a venue actually leaves you, once the clock is honoured.
   *
   * The panel below used to say "context replanned" without checking whether a
   * replan was possible in time. It was not always: re-sorting by score and
   * ignoring `scene.time` could answer an 8:32 PM cancellation with a 5:18 PM
   * errand -- three hours earlier, a plan for an evening that had already
   * happened. `replanAfter` refuses anything starting before the hour the lost
   * plan was due, and returns null when nothing survives, which is a real and
   * sayable answer rather than a scheduling error rendered as reassurance.
   */
  const replan = useMemo(() => {
    if (conditions.excluded.length === 0) return undefined;

    /*
     * The floor is the LATEST room lost, not the first one.
     *
     * This read `excluded[0]` for exactly one commit. `excluded` accumulates,
     * so on a second venue break the clock guard was still anchored to the
     * first cancellation -- an earlier hour -- and would happily hand back an
     * evening that had already started. The guard was right and it was pointed
     * at the wrong moment.
     */
    const floor = replanFloor(pair, conditions.excluded);
    if (floor === null) return undefined;

    const mostRecent = conditions.excluded[conditions.excluded.length - 1];
    return replanAfter(pair, mostRecent, floor, conditions);
  }, [pair, conditions]);
  const timeShift = useTimeShift();
  const intimacy = useIntimacy();
  const swap = useSwap();
  const swapPhase = usePrototype((s) => s.swapPhase);

  const begin = usePrototype((s) => s.begin);
  const goToScene = usePrototype((s) => s.goToScene);
  const stepScene = usePrototype((s) => s.stepScene);
  const selectScene = usePrototype((s) => s.selectScene);
  const openReasoning = usePrototype((s) => s.openReasoning);
  const closeReasoning = usePrototype((s) => s.closeReasoning);
  const openDecision = usePrototype((s) => s.openDecision);
  const landOnPair = usePrototype((s) => s.landOnPair);

  // Arrival from /possibility: ?pair=<id>, read once from the raw location
  // rather than useSearchParams, which would demand a Suspense boundary for a
  // value that never changes after load.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('pair');
    if (wanted) landOnPair(wanted);
  }, [landOnPair]);

  /**
   * The possibility cloud. Local rather than in the store because nothing else
   * in the app needs to know about it — it opens, it is looked at, it closes.
   */
  const [cloudOpen, setCloudOpen] = useState(false);

  /** The site index. One button here instead of twenty-six links on the stage. */
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * Progressive depth.
   *
   * The stage used to open with every affordance it has — disruptions, the
   * decision view, the cloud, the time dial, the index — before a first-time
   * visitor had turned the dial once. All of it read as proof of effort, and
   * the one interaction that matters (turn, feel the rooms differ, snap) had
   * to compete with its own control panel.
   *
   * So the chrome now arrives in the order the story needs it:
   *   meet    — the two people, the verdict, the dial. Nothing else.
   *   played  — after the first turn, the commit button.
   *   depth   — after the choice (or enough playing, or ~22s), everything
   *             else: break it, the decision view, the cloud, the index.
   * Nothing is removed and nothing needs a manual: every control still exists,
   * it just waits for the moment it answers a question the visitor has
   * actually formed. Keyboard paths (D, C, arrows) work from the first frame
   * regardless — discovery gates the chrome, never the machinery.
   */
  const [turns, setTurns] = useState(0);
  const prevSceneRef = useRef(scene.id);
  useEffect(() => {
    if (scene.id !== prevSceneRef.current) {
      prevSceneRef.current = scene.id;
      setTurns((t) => t + 1);
    }
  }, [scene.id]);

  /*
   * The stage teaches itself, then hands over.
   *
   * Nobody reads a tutorial modal, and a busy reviewer glancing at this tab
   * while half-reading a message can miss the entire thesis if the dial just
   * sits there. So on a first visit the stage demonstrates the mechanic:
   * a beat after the intro clears, the dial steps one room by itself — proof
   * that this thing moves — a handwritten "your turn" appears, and if the
   * visitor still does nothing the world auditions the remaining rooms one
   * by one, stopping on the winner so even a hands-off viewer receives the
   * argument: THIS ONE. they need less pressure.
   *
   * The first real input — pointer, key, wheel, touch — ends the
   * demonstration permanently for the session (sessionStorage, nothing
   * leaves the browser). The listener attaches shortly AFTER the chrome
   * mounts so the tap that dismissed the intro doesn't count as ownership.
   * It never commits a scene on the visitor's behalf, and under reduced
   * motion it does not run at all: a self-moving interface is exactly what
   * that preference declined.
   */
  // Lazy init: the stage is client-only (ssr:false), so sessionStorage is
  // readable at first render and the state never needs a sync write-back.
  const [owned, setOwned] = useState(
    () => typeof window === 'undefined' || !!window.sessionStorage.getItem('fs-owned'),
  );
  const [demoHint, setDemoHint] = useState(false);
  useEffect(() => {
    if (phase !== 'exploring' || reduced || owned) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const claim = () => {
      window.sessionStorage.setItem('fs-owned', '1');
      setOwned(true);
      setDemoHint(false);
      timers.forEach(clearTimeout);
    };

    // One demonstration step, then the invitation.
    timers.push(setTimeout(() => usePrototype.getState().stepScene(1), 1500));
    timers.push(setTimeout(() => setDemoHint(true), 2700));

    // The idle audition: keep stepping until the winner is on stage.
    for (let k = 0; k < 5; k++) {
      timers.push(
        setTimeout(() => {
          const st = usePrototype.getState();
          if (st.phase !== 'exploring') return;
          if (st.sceneId === 'postshow') return;
          st.stepScene(1);
        }, 5200 + k * 2100),
      );
    }

    const arm = setTimeout(() => {
      window.addEventListener('pointerdown', claim, { once: true });
      window.addEventListener('keydown', claim, { once: true });
      window.addEventListener('wheel', claim, { once: true, passive: true });
      window.addEventListener('touchstart', claim, { once: true, passive: true });
    }, 450);
    timers.push(arm);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('pointerdown', claim);
      window.removeEventListener('keydown', claim);
      window.removeEventListener('wheel', claim);
      window.removeEventListener('touchstart', claim);
    };
  }, [phase, reduced, owned]);

  const [depthByTime, setDepthByTime] = useState(false);
  useEffect(() => {
    if (phase !== 'exploring') return;
    const t = setTimeout(() => setDepthByTime(true), 22000);
    return () => clearTimeout(t);
  }, [phase]);

  const played = turns >= 1;
  const depth =
    phase !== 'intro' && (phase !== 'exploring' || turns >= 3 || depthByTime);
  const cloud = useMemo(() => possibilityCloud(pair, scene, conditions), [pair, scene, conditions]);
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

  /*
   * The photograph knows the score. One state per room, derived from the
   * same ranking everything else reads: the winner's plate develops a shade
   * brighter, a room under the send bar washes out, and a room whose venue
   * broke overexposes into a ghost. The image is part of the argument now —
   * a viewer who never opens the decision table still sees viability.
   */
  const plateState = useMemo(() => {
    if (conditions.excluded.includes(scene.id)) return 'lost' as const;
    if (isWinner) return 'winner' as const;
    const entry = rankScenes(pair, conditions).find((r) => r.scene.id === scene.id);
    if (!entry || entry.utility < SEND_THRESHOLD) return 'under' as const;
    return 'possible' as const;
  }, [conditions, isWinner, pair, scene.id]);

  const locked = phase === 'selected' || phase === 'reasoning';
  const inHandoff = phase === 'handoff' || phase === 'quiet';
  const inFeedback = phase === 'post-date' || phase === 'memory';
  const showStageChrome = phase === 'exploring' || locked;

  /** The reason fragment currently under the pointer, if any. */
  const [reading, setReading] = useState<Fragment | null>(null);

  /*
   * Feel / explain. Hold the spacebar and the chrome recedes — labels,
   * evidence and controls fade to almost nothing, leaving photography, light
   * and two people. Release and the machinery returns. One page, two
   * readings: the designer's and the engineer's. Deliberately unlabeled; the
   * people who find it will feel found.
   */
  const [feel, setFeel] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'BUTTON') return;
      e.preventDefault();
      setFeel(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') setFeel(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

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
        // The cloud is a mode, and a mode you cannot leave is a trap: with
        // the chrome dimmed to near-nothing, Escape and the readout's own
        // button are the exits a first-time visitor can actually find.
        else if (cloudOpen) setCloudOpen(false);
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
      } else if (e.key.toLowerCase() === 'c') {
        setCloudOpen((v) => !v);
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
    cloudOpen,
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

      {/*
        A photograph of the room, if one has been dropped into public/rooms.
        Renders nothing at all when the file is absent, which is the state this
        repo ships in — see RoomPlate.
      */}
      <RoomPlate scene={scene} state={plateState} reducedMotion={reduced} />

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
          swap={Math.max(swap, cloudOpen ? 0.5 : 0)}
          cloud={cloudOpen ? 1 : 0}
          onFragment={setReading}
        />
      </div>

      {/*
        The cloud states its own numbers.

        The fan on its own is only a mood — it shows that a room is uncertain
        without ever saying how much, and an uncertainty display that cannot be
        read is decoration. This is also where the honesty has to live: seven is
        openly a device for showing a range, so the copy says what the spread is
        and refuses to call it a forecast.
      */}
      <AnimatePresence>
        {cloudOpen && phase !== 'intro' && (
          <motion.aside
            key="cloud-readout"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.22 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            aria-label="The range of outcomes"
            className="pointer-events-none absolute right-gutter top-[24%] z-overlay max-w-[22rem] rounded-artifact border border-paper/10 bg-ink/70 px-5 py-4 text-right backdrop-blur-md"
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
              what could happen
            </p>
            <p className="mt-2 font-voice text-[clamp(1.3rem,2.6vw,1.8rem)] leading-tight text-paper">
              {cloud.agreeing} of {CLOUD_COUNT} versions land in the same place.
            </p>
            <p className="ml-auto mt-2 max-w-[28ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-tungsten">
              when it doesn&rsquo;t: {cloud.likeliestDrift}.
            </p>
            <p className="ml-auto mt-3 max-w-[30ch] font-editorial text-[0.68rem] lowercase leading-relaxed tracking-wide text-paper/55">
              seven is a way of drawing a range, not a number of anything that was
              run. the spread is what we don&rsquo;t know yet, not a forecast.
            </p>
            {/*
              The way back, at full opacity. Opening the cloud dims the rest
              of the chrome to near-nothing — including the button that
              opened it — which read as a room with no door. This one never
              dims, and Escape does the same thing.
            */}
            <button
              onClick={() => setCloudOpen(false)}
              data-cursor="back to the room"
              className="pointer-events-auto mt-4 border border-paper/25 px-3 py-1.5 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
            >
              close &middot; esc
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Intro */}
      <AnimatePresence>
        {phase === 'intro' && <IntroCurtain key="intro" pair={pair} onBegin={begin} />}
      </AnimatePresence>

      {/* Stage chrome */}
      <AnimatePresence>
        {showStageChrome && (
          <motion.div
            key="chrome"
            initial={{ opacity: 0 }}
            /*
              The cloud is a mode, not an overlay. Laid over a full stage it
              competed with the headline and the notes and read as haze; with
              the room cleared it is the only thing happening, which is the
              only way "what could happen" is worth looking at. The controls
              stay lit so you can always get back out.
            */
            animate={{ opacity: feel ? 0.04 : cloudOpen ? 0.16 : 1 }}
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-artifacts flex flex-col justify-between px-gutter py-[clamp(1rem,3.5vh,2rem)] pb-[clamp(2.4rem,6vh,2.6rem)] sm:pb-[clamp(1rem,3.5vh,2rem)]"
          >
            {/* top bar */}
            <div className="pointer-events-auto flex flex-col gap-4">
              <div className="flex items-start justify-end gap-2">
                <p className="mr-auto font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/62 md:hidden short:md:block">
                  wed 7:00 pm · {pair.personA.name} × {pair.personB.name}
                </p>
                {depth && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    onClick={swapPair}
                    disabled={swapPhase !== 'idle'}
                    data-cursor="same rooms, different people"
                    className="border border-paper/15 px-2.5 py-1.5 font-editorial text-[0.68rem] lowercase tracking-wide text-paper/60 transition-colors hover:border-paper/45 hover:text-paper disabled:opacity-30"
                    title="Run the same six rooms for a different pair"
                  >
                    try another pair
                  </motion.button>
                )}
                <button
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                  aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
                  data-cursor={soundOn ? 'go quiet' : 'let it click'}
                  className="flex items-center gap-1.5 border border-paper/15 px-2.5 py-1.5 font-editorial text-[0.68rem] lowercase tracking-wide text-paper/60 transition-colors hover:border-paper/45 hover:text-paper"
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
            <div className="max-w-[min(36rem,90vw)] pb-4 sm:pb-10 short:pb-2">
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
                  {/*
                    The sentence before the ledger. The mono lines below are
                    the accounting; this is the point of the accounting, in
                    the voice the product actually speaks.
                  */}
                  <span className="mb-1 block font-voice text-[1.05rem] normal-case italic tracking-normal text-paper">
                    {conditions.excluded.length > 0
                      ? 'the place broke. the match didn\u2019t.'
                      : 'the week broke. the match didn\u2019t.'}
                  </span>
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
                  {replan === undefined ? (
                    <span className="text-mint">pair held · context replanned · nobody rematched</span>
                  ) : replan ? (
                    <span className="text-mint">
                      pair held · moved to {replan.scene.label.toLowerCase()}, {replan.scene.time}
                      <br />
                      nobody rematched
                    </span>
                  ) : (
                    /* The honest answer, and the one the old copy could not give. */
                    <span className="text-acid">
                      pair held · nothing left late enough tonight
                      <br />
                      no replacement rather than a worse one
                    </span>
                  )}
                </motion.p>
              )}
            </div>

            {/*
              bottom bar

              The disclosure joins this stack on small screens rather than
              floating above it. Absolutely positioned, it landed on top of the
              disruption controls -- which is presumably why the original simply
              hid it below 1024px. In the flow it costs one short line and
              collides with nothing.
            */}
            {/*
              Two columns, not four stacked rows.

              The old bar stacked buttons, disruptions and the index each as a
              full-width row *under* the dial column, which put its own bottom
              edge ~140px past the fold on a 720-high screen — inside a stage
              that cannot scroll. Everything below the headline was cropped:
              the dial's lower arc, "break it", the index. Stacked beside the
              dial instead, the bar is exactly as tall as the dial column and
              the whole stage fits the viewports it actually ships on.
            */}
            <div className="pointer-events-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="order-2 flex min-w-0 flex-col gap-1.5 sm:order-1">
              <div className="flex flex-wrap items-center gap-2">
                <AnimatePresence mode="popLayout">
                  {!decision.send ? null : phase === 'exploring' ? (
                    !played ? null : (
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
                    )
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
                        className="u-sheen min-h-[44px] border border-acid bg-acid px-4 py-2 font-mono text-micro uppercase text-ink transition-colors hover:bg-transparent hover:text-acid"
                      >
                        make it real
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>

                {depth && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="contents"
                  >
                    <button
                      onClick={openDecision}
                      className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/62 underline-offset-4 transition-colors hover:text-paper/80 hover:underline"
                    >
                      see the decision
                    </button>
                    <button
                      onClick={() => setCloudOpen((v) => !v)}
                      data-cursor="see every version"
                      className={`min-h-[44px] px-2 py-2 font-mono text-micro uppercase underline-offset-4 transition-colors hover:underline ${
                        cloudOpen ? 'text-tungsten underline' : 'text-paper/62 hover:text-paper/80'
                      }`}
                    >
                      what could happen
                    </button>
                    <button
                      onClick={toggleHearMeOut}
                      className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/62 underline-offset-4 transition-colors hover:text-acid hover:underline"
                    >
                      hear me out
                    </button>
                  </motion.span>
                )}
              </div>

              {/*
                Resilience. Each control invalidates one named part of the
                context and the plan is re-derived from what survives. The pair
                is never touched — and when nothing left clears the send bar,
                the plan is withdrawn rather than downgraded.
              */}
              {depth && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
              >
                <span className="font-mono text-micro uppercase text-paper/55">break it:</span>
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
                      className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-paper/55 underline-offset-4 transition-colors hover:text-acid hover:underline disabled:text-paper/30 disabled:line-through disabled:decoration-paper/40"
                    >
                      {DISRUPTION_LABELS[d].label}
                    </button>
                  );
                })}
                <span className="text-paper/55">·</span>
                <button
                  onClick={() => setWeek(conditions.week === 'normal' ? 'strained' : 'normal')}
                  aria-pressed={conditions.week === 'strained'}
                  className={`min-h-[44px] px-1 py-2 font-mono text-micro uppercase underline-offset-4 transition-colors hover:underline ${
                    conditions.week === 'strained' ? 'text-acid' : 'text-paper/55 hover:text-acid'
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
                    className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
                  >
                    reset
                  </button>
                )}
              </motion.div>
              )}

              {/*
                The other surfaces.

                For a while this was the opposite problem twice over. First the
                stage had no outgoing links at all; then it had all twenty-six,
                inline, as one wrapping paragraph of micro type — which on a
                short viewport stacked past the fold of a stage that cannot
                scroll, clipping the dial and half the controls with it. The
                index is one button now. The grouping, the descriptions and the
                room to read them live in the menu it opens.
              */}
              {depth && (
              <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                aria-label="Other surfaces"
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
              >
                <span className="font-mono text-micro uppercase text-paper/55">also:</span>
                <Link
                  href="/start"
                  data-cursor="the guided way in"
                  className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-paper/62 underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  start here
                </Link>
                <button
                  onClick={() => setMenuOpen(true)}
                  data-cursor="see all of it"
                  className="min-h-[44px] px-1 py-2 font-mono text-micro uppercase text-tungsten underline-offset-4 transition-colors hover:underline"
                >
                  everything else &rarr;
                </button>
              </motion.nav>
              )}

              {/*
                The disclosure, in the flow.

                Its absolute desktop position (bottom-9, right) laid a 660px
                sentence straight across the dial's face — pointer-events-none,
                so it worked, but it *read* as collision. As the left column's
                last line it costs 15px and touches nothing. The fixed strip
                below remains for small screens only.
              */}
              <PrototypeDisclosure compact className="hidden pt-1 sm:block" />
              </div>

              <div className="relative order-1 flex shrink-0 flex-col items-center gap-3 self-center sm:order-2 sm:self-end short:gap-2">
                <AnimatePresence>
                  {demoHint && !owned && (
                    <motion.p
                      key="your-turn"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.5 }}
                      className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-hand text-[1.3rem] text-tungsten"
                    >
                      &larr; your turn &rarr;
                    </motion.p>
                  )}
                </AnimatePresence>
                {depth && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <TimeDial />
                  </motion.div>
                )}
                <SceneDial scenes={pair.scenes} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteMenu open={menuOpen} onOpenChange={setMenuOpen} />

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
            className="pointer-events-none absolute left-1/2 top-[14%] z-overlay -translate-x-1/2 font-hand text-[1.35rem] text-acid"
          >
            okay cute
          </motion.p>
        )}
      </AnimatePresence>

      <PairSwap />
      {showStageChrome && !feel && <JourneyRail phase={phase} />}
      <NarrativeCursor />
      {showStageChrome && !feel && <TooMuch />}

      {/*
        The disclosure persists on the stage, quietly, and at every width.

        It used to carry `hidden ... lg:block`, so the one sentence naming this
        as unofficial did not render on any phone -- the device most people will
        open the link on. The previous commit raised its contrast from 2.23:1
        without noticing it was not being drawn at all below 1024px, which is a
        good argument for checking that a thing renders before improving how it
        looks.

        Bottom-left on small screens because the bottom-right corner belongs to
        the "too much?" control there; it moves to the right once there is room.
      */}
      {showStageChrome && (
        <PrototypeDisclosure
          compact
          className="pointer-events-none fixed bottom-0 left-0 z-sheet w-full bg-ink/92 px-gutter py-1.5 text-left backdrop-blur-sm sm:hidden"
        />
      )}
    </div>
  );
}
