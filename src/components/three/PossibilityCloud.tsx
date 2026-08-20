'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { possibilityCloud } from '@/lib/possibility';
import { damp, spring, type Spring } from '@/lib/motion';
import { CARD_H, CARD_W } from './useStageLayout';
import type { Scene } from '@/lib/types';

/**
 * Seven versions of the same night, floating where the evening would be.
 *
 * The stage has always drawn one outcome with total confidence. This draws the
 * confidence itself: `uncertainty` becomes the distance the versions drift, so
 * a room the system is sure about clusters and a room it is not scatters. You
 * read the spread before you read anything.
 *
 * Rendering choices that are load-bearing rather than aesthetic:
 *
 * The ghosts are unlit `MeshBasicMaterial`, not the physical material the real
 * cards use. A lit ghost picks up the scene's key light and starts to look like
 * an object in the room, which is the one thing it must not be — these are not
 * more evenings sitting on the table, they are the same evening imagined. Being
 * conspicuously flat and self-illuminated is what keeps them reading as thought
 * rather than as furniture.
 *
 * They are also depth-write-disabled and additively blended, so overlapping
 * versions accumulate light instead of occluding each other. That is the whole
 * point of a cluster: where many versions agree, the stage is physically
 * brighter there. Certainty is luminance.
 *
 * The geometry is shared across all seven, and the group is skipped outright
 * when closed, so this costs nothing on the ninety percent of frames where the
 * cloud is not open.
 */
const GHOST_SCALE = 0.46;
const GHOST_GAP = CARD_W * GHOST_SCALE * 0.62;

/**
 * Where the cloud hangs: above the table and behind it.
 *
 * At the cards' own height and depth the ghosts blend additively *over* the lit
 * paper and wash it grey, which makes the real evening look like the uncertain
 * thing. Lifted and pushed back, they sit against the dark and the two people
 * stay solid in front of them.
 */
const CLOUD_Y = 0.62;
const CLOUD_Z = -0.35;

/**
 * A soft-edged card silhouette, drawn once into a canvas.
 *
 * The first pass used bare `PlaneGeometry` and the ghosts read as grey
 * rectangles — UI debris floating over the scene rather than anything to do
 * with an evening. A hard edge is the problem: a crisp rectangle is an object,
 * and these are explicitly not objects. Feathering the alpha turns each one
 * into an exposure instead, which is both the right metaphor and the only way
 * seven of them can overlap without looking like a stack of windows.
 *
 * Procedural for the same reason everything else here is: this project ships no
 * image assets, and a gradient that can be described in nine lines should not
 * become a network request.
 */
function softCardTexture(): THREE.CanvasTexture {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.06, S / 2, S / 2, S * 0.52);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const GHOST_GEOMETRY = new THREE.PlaneGeometry(CARD_W * GHOST_SCALE, CARD_H * GHOST_SCALE);

export function PossibilityCloud({
  scene,
  open,
  reducedMotion,
}: {
  scene: Scene;
  /** 0 closed, 1 fully fanned. */
  open: number;
  reducedMotion: boolean;
}) {
  const cloud = useMemo(() => possibilityCloud(scene), [scene]);

  // Built on first render rather than at module scope: this touches `document`,
  // and the module is imported during the server pass.
  const texture = useMemo(() => softCardTexture(), []);

  const group = useRef<THREE.Group>(null);
  const ghosts = useRef<(THREE.Group | null)[]>([]);

  // One spring for the whole fan, so the versions leave and return together
  // rather than as seven independent animations. Critically damped: this should
  // bloom open and settle, never bounce — a bouncing uncertainty display would
  // read as playful about the thing it is being careful about.
  const fan = useRef<Spring>({ x: 0, v: 0 });
  const t = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    t.current += dt;

    const amount = reducedMotion ? (open > 0.5 ? 1 : 0) : spring(fan.current, open, 9, dt);
    const g = group.current;
    if (!g) return;

    // Fully closed: stop touching the scene graph entirely.
    g.visible = amount > 0.002;
    if (!g.visible) return;

    for (let i = 0; i < cloud.possibilities.length; i++) {
      const mesh = ghosts.current[i];
      if (!mesh) continue;
      const p = cloud.possibilities[i];

      // Each version breathes on its own phase, so the cloud never pulses in
      // unison — synchronised drift reads as one object wobbling, and these are
      // supposed to read as several futures that do not know about each other.
      const phase = i * 1.7;
      const breath = reducedMotion ? 0 : Math.sin(t.current * 0.55 + phase) * 0.035;
      const sway = reducedMotion ? 0 : Math.cos(t.current * 0.4 + phase) * 0.045;

      mesh.position.set(
        p.offset[0] * amount + sway * amount,
        p.offset[1] * amount + breath * amount + CLOUD_Y,
        p.offset[2] * amount + CLOUD_Z * amount,
      );

      // Versions that agree face you squarely. Versions that diverge turn away,
      // by an amount equal to how far off they landed.
      mesh.rotation.y = p.offset[0] * 0.28 * amount;
      mesh.rotation.z = p.converges ? 0 : p.offset[1] * 0.5 * amount;

      mesh.scale.setScalar(0.72 + amount * 0.28);

      const material = (mesh.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      // Agreement is bright and near; divergence is faint and far. The falloff
      // is deliberately steep so a scattered cloud looks thin, not just wide.
      // These numbers are small on purpose. Additive blending accumulates, and
      // the converging versions sit almost on top of each other by definition —
      // the first pass used 0.3 each, which summed past 1.0 and turned the
      // cluster into a solid white rectangle. Agreement should read as a warm
      // concentration you can still see through, not as a blown highlight.
      const base = p.converges ? 0.2 : 0.15 * (1 - p.distance * 0.45);
      const next = damp(material.opacity, base * amount, 12, dt);
      for (const child of mesh.children) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = next;
      }
    }
  });

  return (
    <group ref={group} visible={false}>
      {cloud.possibilities.map((p, i) => (
        <group
          key={p.id}
          ref={(g) => {
            ghosts.current[i] = g;
          }}
        >
          {/*
            Two silhouettes, not one. A single ghost card reads as a spare card;
            a pair reads as the same two people, again. The cloud is versions of
            an evening, and an evening here has always been two people and the
            distance between them — so that is what a version has to look like.
          */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={GHOST_GEOMETRY}
              position={[side * GHOST_GAP, 0, 0]}
              rotation={[0, side * -0.16, 0]}
              renderOrder={2}
            >
              <meshBasicMaterial
                map={texture}
                color={p.converges ? '#F4EDE4' : '#E8913C'}
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
