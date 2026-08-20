import { lerp } from '@/lib/motion';
import type { StageLayout } from './useStageLayout';

/**
 * Where a card wants to be, as a pure function.
 *
 * Extracted from `Polaroid3D`'s frame callback so the motion can be simulated
 * and asserted without a browser. The questions that matter here are not
 * aesthetic — "does a wrong context actually come to rest far apart", "does a
 * right context converge", "does an unsettled scene keep moving" — and all of
 * them are answerable by stepping this function through a damped loop in Node.
 *
 * That turned out to be the only way to check it: a backgrounded tab suspends
 * `requestAnimationFrame`, so the stage renders a single un-animated frame and
 * every screenshot shows the cards at their origin.
 */
export type CardTarget = {
  x: number;
  y: number;
  z: number;
  rotZ: number;
  rotY: number;
};

export function cardTarget(
  side: -1 | 1,
  magnetism: number,
  layout: StageLayout,
  /** Elapsed seconds — only affects the idle/unrest drift. */
  t = 0,
  reducedMotion = false,
): CardTarget {
  const misfit = 1 - magnetism;

  const spread = lerp(layout.spreadMax, layout.spreadMin, magnetism);
  const along = side * spread * 0.5;

  const x = layout.portrait ? side * 0.16 * misfit : along;
  const baseY = layout.portrait ? -along : lerp(side === -1 ? 0.3 : -0.26, 0, magnetism);

  // A weak scene refuses to settle: the card keeps hunting around its rest
  // position. A strong one comes to rest and stays there.
  const unrest = reducedMotion ? 0 : misfit * 0.055;
  const idle = reducedMotion ? 0 : 0.012;
  const phase = side === -1 ? 0 : 2.1;
  const driftX = Math.sin(t * 0.62 + phase) * (idle + unrest);
  const driftY = Math.cos(t * 0.48 + phase * 1.7) * (idle + unrest * 0.8);
  const driftRot = Math.sin(t * 0.53 + phase) * unrest * 0.5;

  return {
    x: (x + driftX) * layout.scale,
    y: (baseY + driftY) * layout.scale,
    z: side * misfit * 0.55,
    rotZ: side * misfit * 0.3 + driftRot,
    rotY: -side * lerp(0.4, -0.07, magnetism),
  };
}
