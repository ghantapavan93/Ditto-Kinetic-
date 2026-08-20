'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useStageLayout } from './useStageLayout';

/**
 * Development-only geometry readout.
 *
 * The physical language *is* the argument here, so "do the cards actually move
 * between a bad context and a good one" is a correctness question, not a taste
 * question — and it is one that cannot be answered by reading the source or by
 * eyeballing a screenshot. Twice during this build I estimated card positions
 * from a compressed image and got them wrong in opposite directions.
 *
 * This publishes what the stage is really doing to `window.__fsStage`, so the
 * separation, scale and camera can be asserted against the model instead of
 * guessed at. Stripped from production builds.
 */
export function StageProbe({ magnetism }: { magnetism: number }) {
  const layout = useStageLayout();
  const { camera, viewport, scene } = useThree();

  useFrame(() => {
    const cards = scene.children
      .filter((o) => o.type === 'Group')
      .map((o) => ({
        x: +o.position.x.toFixed(3),
        y: +o.position.y.toFixed(3),
        z: +o.position.z.toFixed(3),
        rotZ: +o.rotation.z.toFixed(3),
        rotY: +o.rotation.y.toFixed(3),
        scale: +o.scale.x.toFixed(3),
      }));

    (window as unknown as { __fsStage?: unknown }).__fsStage = {
      magnetism: +magnetism.toFixed(3),
      layout,
      viewport: { w: +viewport.width.toFixed(2), h: +viewport.height.toFixed(2) },
      camera: { x: +camera.position.x.toFixed(2), z: +camera.position.z.toFixed(2) },
      cards,
      separation: cards.length === 2 ? +Math.abs(cards[0].x - cards[1].x).toFixed(3) : null,
      verticalSeparation: cards.length === 2 ? +Math.abs(cards[0].y - cards[1].y).toFixed(3) : null,
    };
  });

  return null;
}
