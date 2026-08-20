'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRAGMENT_SCALE, fragmentSlot, fragmentTexture } from '@/lib/fragments';
import { damp, lerp, seeded, smoothstep } from '@/lib/motion';
import { useStageLayout } from './useStageLayout';
import type { Fragment, MatchPair } from '@/lib/types';

/**
 * The reasons, as a physical field.
 *
 * This is the part that stops compatibility from being a number. The fragments
 * belong to the pair and never change — "both ambitious, maybe too ambitious"
 * is true of these two in every room. What the room decides is how many of them
 * ever surface.
 *
 * So a bad context is not just two people held apart: it is two people held
 * apart with almost nothing visible between them. As the context improves,
 * reasons rise out of the dark one at a time and gather inward. By the winning
 * scene the space between them is full of evidence.
 *
 * `tension` fragments are the honest ones. They surface early, they never
 * settle, and they do not go away when the scene gets good — because "both
 * ambitious, maybe too ambitious" is not solved by picking a better venue.
 */

type Props = {
  pair: MatchPair;
  magnetism: number;
  locked: boolean;
  exiting: number;
  reducedMotion: boolean;
  onHover: (fragment: Fragment | null) => void;
};

const BASE_SCALE = FRAGMENT_SCALE;

function FragmentNote({
  fragment,
  index,
  total,
  magnetism,
  locked,
  exiting,
  reducedMotion,
  onHover,
}: {
  fragment: Fragment;
  index: number;
  total: number;
  magnetism: number;
  locked: boolean;
  exiting: number;
  reducedMotion: boolean;
  onHover: (fragment: Fragment | null) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const layout = useStageLayout();
  const hovered = useRef(false);

  const { texture, aspect } = useMemo(
    () => fragmentTexture(fragment.text, fragment.kind),
    [fragment.text, fragment.kind],
  );

  const place = useMemo(() => {
    const rand = seeded(index * 4241 + fragment.text.length * 97);
    const slot = fragmentSlot(index, total, fragment.pull);
    return {
      x: slot.x,
      y: slot.y + (slot.row === 0 ? 1 : -1) * rand() * 0.16,
      z: 0.42 + rand() * 0.3,
      rot: (rand() - 0.5) * 0.14,
      phase: rand() * Math.PI * 2,
    };
  }, [fragment.pull, fragment.text.length, index, total]);

  useFrame((state, rawDelta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;

    // A fragment surfaces once the context is good enough to have earned it.
    const risen = smoothstep(fragment.surfacesAt, fragment.surfacesAt + 0.16, magnetism);

    // As things resolve the reasons gather inward — but only slightly. Pulling
    // them all the way in re-creates the pile-up the row layout exists to fix.
    const gather = lerp(1, 0.86, magnetism);

    // Tension never settles. Everything else does.
    const jitter =
      reducedMotion || fragment.kind !== 'tension' ? 0 : 0.022 + (1 - magnetism) * 0.02;
    const breathe = reducedMotion ? 0 : 0.012;

    const targetX = place.x * gather + Math.sin(t * 5.1 + place.phase) * jitter;
    const targetY =
      place.y * gather +
      Math.cos(t * 0.7 + place.phase) * breathe +
      Math.sin(t * 4.7 + place.phase) * jitter +
      // unrisen fragments sit below, in the dark, and rise into place
      (1 - risen) * -0.55 +
      exiting * 2.2;

    const lambda = locked ? 8 : 4;
    m.position.x = damp(m.position.x, targetX * layout.scale, lambda, dt);
    m.position.y = damp(m.position.y, targetY * layout.scale, lambda, dt);
    m.position.z = damp(m.position.z, place.z + (hovered.current ? 0.22 : 0), 8, dt);
    m.rotation.z = damp(m.rotation.z, place.rot + Math.sin(t * 3.9 + place.phase) * jitter, lambda, dt);

    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity = damp(mat.opacity, risen * (1 - exiting) * (hovered.current ? 1 : 0.9), 6, dt);

    const s = BASE_SCALE * layout.scale * lerp(0.86, 1, risen) * (hovered.current ? 1.07 : 1);
    const cur = damp(m.scale.y, s, 8, dt);
    m.scale.set(cur * aspect, cur, 1);
  });

  return (
    <mesh
      ref={mesh}
      scale={[BASE_SCALE * aspect, BASE_SCALE, 1]}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        onHover(fragment);
      }}
      onPointerOut={() => {
        hovered.current = false;
        onHover(null);
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export function ReasonField({ pair, magnetism, locked, exiting, reducedMotion, onHover }: Props) {
  return (
    <>
      {pair.fragments.map((fragment, i) => (
        <FragmentNote
          key={fragment.text}
          fragment={fragment}
          index={i}
          total={pair.fragments.length}
          magnetism={magnetism}
          locked={locked}
          exiting={exiting}
          reducedMotion={reducedMotion}
          onHover={onHover}
        />
      ))}
    </>
  );
}
