'use client';

import { create } from 'zustand';
import { replanAfter, replanFloor } from '@/lib/booking';
import { PAIRS, SCENE_ORDER, pairById } from '@/data/pairs';
import {
  NO_CONDITIONS,
  magnetismFor,
  rankScenes,
  sendDecision,
  type Conditions,
  type Disruption,
} from '@/lib/rankScenes';
import { track } from '@/lib/analytics';
import type { Phase } from '@/lib/types';

/**
 * Domain state and view state are kept in one store but never mixed in meaning:
 * `phase` / `selectedSceneId` / `conditions` are domain (they survive a
 * re-render, a resize, and a venue failure), while `dialPosition` is purely
 * visual and is allowed to be clobbered at any time.
 */

type FeedbackResult = {
  preserve: string[];
  increase: string[];
  decrease: string[];
  inferredHypotheses: { hypothesis: string; evidence: string; confidence: 'low' | 'medium' | 'high' }[];
  uncertainty: string[];
  source: 'model' | 'fallback';
};

type State = {
  phase: Phase;
  pairId: string;
  sceneId: string;
  /** Everything that can degrade this week. The reason abstention is possible. */
  conditions: Conditions;
  /** Continuous dial position in scene-index units. Visual only. */
  dialPosition: number;
  reasoningOpen: boolean;
  decisionOpen: boolean;
  hearMeOutOpen: boolean;
  feedbackText: string;
  feedback: FeedbackResult | null;
  feedbackPending: boolean;
  soundOn: boolean;
  hasInteracted: boolean;
  /** The plain-text escape hatch. */
  tldrOpen: boolean;
  /**
   * Earlier / as planned / later. Not a scheduler — a dimmer. The same two
   * people in the same room at a different hour is a different night, and the
   * only honest way to show that is to change the light.
   */
  timeShift: -1 | 0 | 1;
  /** How far into the opening fifteen minutes the user has scrubbed. */
  minute: 0 | 5 | 10 | 15;
  /**
   * The pair swap choreography. `out` pulls the current photographs back into
   * the sheet, `in` develops the new ones forward. The data changes at the
   * midpoint, so the swap is never visible as a pop.
   */
  swapPhase: 'idle' | 'out' | 'in';
  /** True while the closing line is on screen. */
  swapLine: boolean;
};

type Actions = {
  begin: () => void;
  setDialPosition: (p: number) => void;
  goToScene: (id: string, via: 'dial' | 'keyboard' | 'list') => void;
  stepScene: (delta: number) => void;
  selectScene: () => void;
  openReasoning: () => void;
  closeReasoning: () => void;
  openDecision: () => void;
  closeDecision: () => void;
  toggleHearMeOut: () => void;
  makeItReal: () => void;
  reachQuiet: () => void;
  applyDisruption: (d: Disruption) => void;
  setWeek: (week: Conditions['week']) => void;
  resetConditions: () => void;
  swapPair: () => void;
  /** Arrive from the possibility layer already on a specific pair. */
  landOnPair: (pairId: string) => void;
  startFeedback: () => void;
  setFeedbackText: (t: string) => void;
  submitFeedback: () => Promise<void>;
  toggleSound: () => void;
  toggleTldr: () => void;
  setTimeShift: (shift: -1 | 0 | 1) => void;
  setMinute: (minute: 0 | 5 | 10 | 15) => void;
  reset: () => void;
};

const initial: State = {
  phase: 'intro',
  pairId: PAIRS[0].id,
  sceneId: 'coffee',
  conditions: NO_CONDITIONS,
  dialPosition: 0,
  reasoningOpen: false,
  decisionOpen: false,
  hearMeOutOpen: false,
  feedbackText: '',
  feedback: null,
  feedbackPending: false,
  soundOn: false,
  hasInteracted: false,
  tldrOpen: false,
  timeShift: 0,
  minute: 0,
  swapPhase: 'idle',
  swapLine: false,
};

/** Move the dial onto whichever scene the engine currently ranks first. */
function snapToBest(pairId: string, conditions: Conditions) {
  const ranked = rankScenes(pairById(pairId), conditions);
  const best = ranked[0];
  if (!best) return null;
  return {
    sceneId: best.scene.id,
    dialPosition: SCENE_ORDER.indexOf(best.scene.id as (typeof SCENE_ORDER)[number]),
  };
}

export const usePrototype = create<State & Actions>((set, get) => ({
  ...initial,

  begin: () => {
    if (get().phase !== 'intro') return;
    set({ phase: 'exploring' });
    track('prototype_started');
  },

  setDialPosition: (p) => set({ dialPosition: p, hasInteracted: true }),

  goToScene: (id, via) => {
    const { sceneId, phase, conditions } = get();
    if (id === sceneId) return;
    if (conditions.excluded.includes(id)) return;
    const index = SCENE_ORDER.indexOf(id as (typeof SCENE_ORDER)[number]);
    set({
      sceneId: id,
      dialPosition: index,
      hasInteracted: true,
      // Moving off a chosen scene returns us to exploring — the selection was
      // about *this* scene, so it cannot survive changing scene.
      phase: phase === 'selected' || phase === 'reasoning' ? 'exploring' : phase,
      reasoningOpen: false,
      // The beats belong to a room, so scrubbing resets when the room changes.
      minute: 0,
    });
    // Magnetism is the one number the whole stage is driven by, so it belongs
    // in the event: if the physical language ever stops tracking the model,
    // this is where it shows up first.
    track('scene_changed', {
      scene: id,
      via,
      magnetism: Number(magnetismFor(pairById(get().pairId), id, conditions).toFixed(3)),
    });
  },

  stepScene: (delta) => {
    const { sceneId } = get();
    const i = SCENE_ORDER.indexOf(sceneId as (typeof SCENE_ORDER)[number]);
    const next = SCENE_ORDER[(i + delta + SCENE_ORDER.length) % SCENE_ORDER.length];
    get().goToScene(next, 'keyboard');
  },

  selectScene: () => {
    const { sceneId, pairId } = get();
    set({ phase: 'selected' });
    track('scene_selected', { scene: sceneId, pair: pairId });
  },

  openReasoning: () => {
    set({ reasoningOpen: true, phase: 'reasoning' });
    track('why_opened', { scene: get().sceneId });
  },
  closeReasoning: () => set({ reasoningOpen: false, phase: 'selected' }),

  openDecision: () => {
    set({ decisionOpen: true });
    track('decision_view_opened', { pair: get().pairId });
  },
  closeDecision: () => set({ decisionOpen: false }),

  toggleHearMeOut: () => {
    const next = !get().hearMeOutOpen;
    set({ hearMeOutOpen: next });
    if (next) track('hear_me_out_opened', { pair: get().pairId });
  },

  makeItReal: () => {
    set({ phase: 'handoff', reasoningOpen: false, decisionOpen: false });
    track('make_real_clicked', { scene: get().sceneId, pair: get().pairId });
  },

  reachQuiet: () => {
    if (get().phase !== 'handoff') return;
    set({ phase: 'quiet' });
    track('handoff_completed');
  },

  /**
   * Resilience. Each disruption invalidates a specific part of the *context*
   * and the plan is re-derived — the pair is never touched. If the best
   * surviving opening falls under the send bar, the plan is withdrawn rather
   * than downgraded.
   */
  applyDisruption: (d) => {
    const { conditions, pairId, sceneId } = get();
    if (conditions.disruptions.includes(d)) return;

    const next: Conditions =
      d === 'venue'
        ? { ...conditions, excluded: [...conditions.excluded, sceneId] }
        : { ...conditions, disruptions: [...conditions.disruptions, d] };

    const pair = pairById(pairId);

    /*
     * A lost venue re-plans against the clock, not just against the scores.
     *
     * `snapToBest` takes the highest-scoring room that survives, which is
     * correct about rooms and silent about time -- so losing an 8:32 PM walk
     * snapped the stage to a 5:18 PM errand while the panel a few lines below
     * it, which does consult the clock, said "nothing left late enough
     * tonight". The two halves of one screen disagreed because only one of
     * them had been taught about the hour.
     *
     * When nothing survives late enough, the honest state is that the plan has
     * been withdrawn: stay where we are and drop to 'exploring', so the
     * abstention reads as an abstention instead of a quiet downgrade.
     */
    /*
     * The same floor the stage computes, from the same function.
     *
     * This used the hour of the single scene just excluded while the stage took
     * the latest across all of them, so on a second venue break the two halves
     * of the screen disagreed again -- the precise failure the clock was
     * introduced to fix.
     */
    const floor = d === 'venue' ? replanFloor(pair, next.excluded) : null;
    const replanned = floor === null ? null : replanAfter(pair, sceneId, floor, next);

    const snapped =
      d === 'venue'
        ? replanned
          ? {
              sceneId: replanned.scene.id,
              dialPosition: SCENE_ORDER.indexOf(
                replanned.scene.id as (typeof SCENE_ORDER)[number],
              ),
            }
          : null
        : snapToBest(pairId, next);

    const decision = sendDecision(pair, next);
    const sending = d === 'venue' ? Boolean(replanned) : decision.send;

    set({
      conditions: next,
      ...(snapped ?? {}),
      phase: sending ? 'selected' : 'exploring',
      reasoningOpen: false,
    });

    track('venue_broken', {
      disruption: d,
      from: sceneId,
      to: snapped?.sceneId ?? null,
      stillSending: sending,
    });
  },

  setWeek: (week) => {
    const { pairId, conditions } = get();
    const next: Conditions = { ...conditions, week };
    const decision = sendDecision(pairById(pairId), next);
    const snapped = snapToBest(pairId, next);
    set({
      conditions: next,
      ...(snapped ?? {}),
      phase: decision.send ? get().phase : 'exploring',
      reasoningOpen: false,
    });
    track('week_condition_changed', { week, stillSending: decision.send });
  },

  resetConditions: () => {
    set({ conditions: NO_CONDITIONS, phase: 'exploring', reasoningOpen: false });
    track('conditions_reset');
  },

  /**
   * The pair swap, as a sequence rather than a state change.
   *
   * This is the strongest proof the piece has — same rooms, same engine, same
   * weights, different answer — and as a button that instantly replaced two
   * images it read as a utility toggle. Run as choreography instead: the
   * current photographs recede and go dark, the data changes while nothing is
   * legible, the new ones develop forward, and the dial lands on whichever
   * opening now wins.
   *
   * Note it does *not* hardcode coffee. It asks the engine which scene wins for
   * the incoming pair — which is the entire point, and would be a lie if the
   * destination were baked in.
   */
  /**
   * Same honest landing as swapPair — ask the engine where this pair opens —
   * without the theatre, because arrival from /possibility happens behind the
   * intro curtain where nothing is legible yet.
   */
  landOnPair: (pairId: string) => {
    const pair = pairById(pairId);
    if (pair.id === get().pairId) return;
    const decision = sendDecision(pair, NO_CONDITIONS);
    const landing = decision.send ? decision.scene.id : pair.scenes[0].id;
    /*
     * Landing on a pair resets the view, not only the data.
     *
     * This set the pair and left `phase` alone. Arrive from a link while the
     * store is sitting in a terminal phase -- handoff, quiet, memory -- and the
     * new pair loads underneath a receipt for the old one, with no control on
     * screen to leave it, because the stage chrome only renders while
     * exploring. `swapPair` already clears these; this is the same journey
     * arriving by a different door.
     */
    set({
      pairId: pair.id,
      sceneId: landing,
      dialPosition: Math.max(0, SCENE_ORDER.indexOf(landing as (typeof SCENE_ORDER)[number])),
      conditions: NO_CONDITIONS,
      minute: 0,
      feedback: null,
      feedbackText: '',
      phase: 'exploring',
      reasoningOpen: false,
      decisionOpen: false,
      hearMeOutOpen: false,
    });
  },

  swapPair: () => {
    if (get().swapPhase !== 'idle') return;
    const current = get().pairId;
    const next = PAIRS.find((p) => p.id !== current) ?? PAIRS[0];

    set({ swapPhase: 'out', reasoningOpen: false, decisionOpen: false, hearMeOutOpen: false });

    // Midpoint: nothing is legible on stage, so the data can change here.
    setTimeout(() => {
      const decision = sendDecision(next, NO_CONDITIONS);
      const landing = decision.send ? decision.scene.id : next.scenes[0].id;
      set({
        pairId: next.id,
        phase: 'exploring',
        sceneId: landing,
        dialPosition: SCENE_ORDER.indexOf(landing as (typeof SCENE_ORDER)[number]),
        conditions: NO_CONDITIONS,
        minute: 0,
        feedback: null,
        feedbackText: '',
        swapPhase: 'in',
      });
      track('pair_swapped', { pair: next.id, landedOn: landing });
    }, 620);

    // The line arrives after the new pair has settled, and leaves on its own.
    setTimeout(() => set({ swapPhase: 'idle', swapLine: true }), 1750);
    setTimeout(() => set({ swapLine: false }), 6200);
  },

  startFeedback: () => {
    set({ phase: 'post-date' });
    track('feedback_started');
  },

  setFeedbackText: (t) => set({ feedbackText: t }),

  submitFeedback: async () => {
    const { feedbackText, pairId, sceneId } = get();
    if (!feedbackText.trim() || get().feedbackPending) return;
    set({ feedbackPending: true });
    track('feedback_submitted', { length: feedbackText.length });

    // Deterministic fallback is computed first and is always sufficient. The
    // model call is an upgrade, never a dependency — if it fails, times out, or
    // is not configured, the interface never notices.
    const { interpretLocally } = await import('@/lib/feedbackSchema');
    let result: FeedbackResult = { ...interpretLocally(feedbackText), source: 'fallback' };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: feedbackText, pairId, sceneId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        // Trust the server's own label. It answers ok:true with
        // source:'fallback' whenever there is no API key, the upstream call
        // failed, or the response failed its schema -- and overwriting that
        // with 'model' made this site claim a model wrote words the local
        // interpreter wrote. On a site that shows its own source, that is the
        // one bug that is not allowed.
        if (json?.ok && json.data) result = json.data as FeedbackResult;
      }
    } catch {
      // Intentionally silent. The fallback already holds a complete answer.
    }

    set({ feedback: result, feedbackPending: false, phase: 'memory' });
    track('memory_update_viewed', { source: result.source });
  },

  toggleSound: () => set({ soundOn: !get().soundOn }),

  setTimeShift: (shift) => {
    if (get().timeShift === shift) return;
    set({ timeShift: shift });
    track('time_shifted', { shift });
  },

  setMinute: (minute) => {
    if (get().minute === minute) return;
    set({ minute });
    track('first_fifteen_scrubbed', { minute, scene: get().sceneId });
  },

  toggleTldr: () => {
    const next = !get().tldrOpen;
    set({ tldrOpen: next });
    if (next) track('tldr_opened');
  },

  reset: () => set({ ...initial, soundOn: get().soundOn }),
}));

/* ----- derived selectors ------------------------------------------------- */

export const useCurrentPair = () => usePrototype((s) => pairById(s.pairId));

export const useConditions = () => usePrototype((s) => s.conditions);

export const useTimeShift = () => usePrototype((s) => s.timeShift);

/**
 * How settled the pair should read, over and above context fit — 0 at the
 * start of the evening, 1 by minute fifteen. Kept separate from magnetism so
 * the ranking maths is never touched by a scrub.
 */
export const useIntimacy = () => usePrototype((s) => s.minute / 15);

/**
 * 0 on stage, 1 fully receded into the sheet. One number for the whole swap, so
 * the cards, their photographs and the contact sheet can never disagree.
 */
export const useSwap = () => usePrototype((s) => (s.swapPhase === 'out' ? 1 : 0));

export const useCurrentScene = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  return pair.scenes.find((sc) => sc.id === sceneId) ?? pair.scenes[0];
};

export const useRanked = () => rankScenes(useCurrentPair(), useConditions());

export const useMagnetism = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  const conditions = useConditions();
  return magnetismFor(pair, sceneId, conditions);
};

/** The send decision under current conditions. Drives the abstention surface. */
export const useSendDecision = () => sendDecision(useCurrentPair(), useConditions());

/** True when the viewed scene is the one the engine ranked first *and* would send. */
export const useIsWinner = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  const conditions = useConditions();
  const decision = sendDecision(pair, conditions);
  return decision.send && decision.scene.id === sceneId;
};
