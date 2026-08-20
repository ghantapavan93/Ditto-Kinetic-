'use client';

import { create } from 'zustand';
import { PAIRS, SCENE_ORDER, pairById } from '@/data/pairs';
import { magnetismFor, rankScenes, replanVenue } from '@/lib/rankScenes';
import { track } from '@/lib/analytics';
import type { Phase } from '@/lib/types';

/**
 * Domain state and view state are kept in one store but never mixed in meaning:
 * `phase` / `selectedSceneId` are domain (they survive a re-render, a resize,
 * and a venue failure), while `dialAngle` is purely visual and is allowed to be
 * clobbered at any time.
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
  /** Continuous dial position in scene-index units. Visual only. */
  dialPosition: number;
  reasoningOpen: boolean;
  decisionOpen: boolean;
  hearMeOutOpen: boolean;
  /** Set when the resilience test has broken the chosen venue. */
  brokenSceneId: string | null;
  feedbackText: string;
  feedback: FeedbackResult | null;
  feedbackPending: boolean;
  soundOn: boolean;
  hasInteracted: boolean;
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
  breakVenue: () => void;
  swapPair: () => void;
  startFeedback: () => void;
  setFeedbackText: (t: string) => void;
  submitFeedback: () => Promise<void>;
  toggleSound: () => void;
  reset: () => void;
};

const initial: State = {
  phase: 'intro',
  pairId: PAIRS[0].id,
  sceneId: 'coffee',
  dialPosition: 0,
  reasoningOpen: false,
  decisionOpen: false,
  hearMeOutOpen: false,
  brokenSceneId: null,
  feedbackText: '',
  feedback: null,
  feedbackPending: false,
  soundOn: false,
  hasInteracted: false,
};

export const usePrototype = create<State & Actions>((set, get) => ({
  ...initial,

  begin: () => {
    if (get().phase !== 'intro') return;
    set({ phase: 'exploring' });
    track('prototype_started');
  },

  setDialPosition: (p) => set({ dialPosition: p, hasInteracted: true }),

  goToScene: (id, via) => {
    const { sceneId, phase } = get();
    if (id === sceneId) return;
    const index = SCENE_ORDER.indexOf(id as (typeof SCENE_ORDER)[number]);
    set({
      sceneId: id,
      dialPosition: index,
      hasInteracted: true,
      // Moving off a chosen scene returns us to exploring — the selection was
      // about *this* scene, so it cannot survive changing scene.
      phase: phase === 'selected' || phase === 'reasoning' ? 'exploring' : phase,
      reasoningOpen: false,
    });
    track('scene_changed', { scene: id, via });
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
   * Resilience test. The venue is invalidated; the pair is not.
   * We re-plan context only — the humans were never what failed.
   */
  breakVenue: () => {
    const { pairId, sceneId } = get();
    const pair = pairById(pairId);
    const next = replanVenue(pair, sceneId);
    if (!next) return;
    set({
      brokenSceneId: sceneId,
      sceneId: next.scene.id,
      dialPosition: SCENE_ORDER.indexOf(next.scene.id as (typeof SCENE_ORDER)[number]),
      phase: 'selected',
    });
    track('venue_broken', { from: sceneId, to: next.scene.id });
  },

  swapPair: () => {
    const current = get().pairId;
    const next = PAIRS.find((p) => p.id !== current) ?? PAIRS[0];
    set({
      pairId: next.id,
      phase: 'exploring',
      sceneId: 'coffee',
      dialPosition: 0,
      reasoningOpen: false,
      brokenSceneId: null,
      feedback: null,
      feedbackText: '',
    });
    track('pair_swapped', { pair: next.id });
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
        if (json?.ok && json.data) result = { ...json.data, source: 'model' as const };
      }
    } catch {
      // Intentionally silent. The fallback already holds a complete answer.
    }

    set({ feedback: result, feedbackPending: false, phase: 'memory' });
    track('memory_update_viewed', { source: result.source });
  },

  toggleSound: () => set({ soundOn: !get().soundOn }),

  reset: () => set({ ...initial, soundOn: get().soundOn }),
}));

/* ----- derived selectors ------------------------------------------------- */

export const useCurrentPair = () => usePrototype((s) => pairById(s.pairId));

export const useCurrentScene = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  return pair.scenes.find((sc) => sc.id === sceneId) ?? pair.scenes[0];
};

export const useRanked = () => rankScenes(useCurrentPair());

export const useMagnetism = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  return magnetismFor(pair, sceneId);
};

/** True when the currently viewed scene is the one the engine ranked first. */
export const useIsWinner = () => {
  const pair = useCurrentPair();
  const sceneId = usePrototype((s) => s.sceneId);
  return rankScenes(pair)[0].scene.id === sceneId;
};
