'use client';

import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

export const CARD_W = 1.42;
export const CARD_H = 1.74;

export type StageLayout = {
  /** Portrait viewports stack the two people vertically instead of side by side. */
  portrait: boolean;
  /** Uniform scale applied to the whole rig so it always fits the viewport. */
  scale: number;
  /** Separation between card centres when the context is wrong. */
  spreadMax: number;
  /** Separation when the context is right — close, and never overlapping. */
  spreadMin: number;
};

/**
 * Stage geometry, derived from the actual viewport rather than guessed.
 *
 * Two things this fixes, both of which only became visible once the piece was
 * looked at rather than tested:
 *
 * 1. The original separation range was far too narrow. The distance between the
 *    worst context and the best has to be legible at a glance — it is the whole
 *    argument — and moving the cards by a third of their own width is not. The
 *    gap between them is the thing being communicated, so it needs to be large
 *    enough to be a shape in its own right.
 *
 * 2. `spreadMin` was *smaller than the card*, so at full magnetism the two
 *    photographs overlapped. That reads as a z-fighting bug, not as closeness.
 *    They now come to rest just short of touching, which is what an
 *    introduction looks like.
 *
 * The wide separation immediately broke portrait viewports — the cards ran off
 * both edges — which is why layout is computed from `viewport` instead of being
 * a constant.
 */
/**
 * Pure geometry, extracted from the hook so it can be asserted without a
 * browser. `npm run check` covers the invariants that matter: a wrong context
 * must leave a visible gap, a right one must bring the cards close *without*
 * overlapping, and neither arrangement may run off the viewport.
 */
export function computeStageLayout(width: number, height: number): StageLayout {
  const portrait = width < height;

  if (portrait) {
      // Fit the tallest arrangement (two stacked cards at full separation)
      // into the available height, with margin.
    const wanted = 3.05;
    const needed = wanted + CARD_H;
    const scale = Math.min(1, (height * 0.92) / needed, (width * 0.92) / CARD_W);
    return { portrait, scale, spreadMax: wanted, spreadMin: CARD_H + 0.22 };
  }

  // Landscape: keep both cards fully on screen at maximum separation.
  const affordable = width - CARD_W - 0.7;
  return {
    portrait,
    scale: 1,
    spreadMax: Math.max(CARD_W + 0.5, Math.min(3.35, affordable)),
    spreadMin: CARD_W + 0.14,
  };
}

export function useStageLayout(): StageLayout {
  const viewport = useThree((s) => s.viewport);
  return useMemo(
    () => computeStageLayout(viewport.width, viewport.height),
    [viewport.width, viewport.height],
  );
}
