'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { portraitTexture } from '@/lib/portrait';
import { damp, lerp, seeded } from '@/lib/motion';
import { CARD_H, CARD_W, useStageLayout } from './useStageLayout';
import { cardTarget } from './cardTransform';
import type { Person } from '@/lib/types';

const CARD_D = 0.034;
const PHOTO_W = 1.2;
const PHOTO_H = 1.28;
const PHOTO_Y = 0.16;

/**
 * Rounded, bevelled card body.
 *
 * Built here rather than pulled from drei's `RoundedBox` — that was the only
 * thing this project used from drei, and a single extruded shape is not worth
 * the dependency's weight in the first-load bundle. The bevel matters: it is
 * what gives the paper edge a highlight instead of a hard black line, which is
 * most of what makes these read as objects rather than textured quads.
 *
 * Created once at module scope and shared by both cards.
 */
const CARD_GEOMETRY = (() => {
  const r = 0.03;
  const w = CARD_W - r * 2;
  const h = CARD_H - r * 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2 - r);
  shape.lineTo(w / 2, -h / 2 - r);
  shape.quadraticCurveTo(w / 2 + r, -h / 2 - r, w / 2 + r, -h / 2);
  shape.lineTo(w / 2 + r, h / 2);
  shape.quadraticCurveTo(w / 2 + r, h / 2 + r, w / 2, h / 2 + r);
  shape.lineTo(-w / 2, h / 2 + r);
  shape.quadraticCurveTo(-w / 2 - r, h / 2 + r, -w / 2 - r, h / 2);
  shape.lineTo(-w / 2 - r, -h / 2);
  shape.quadraticCurveTo(-w / 2 - r, -h / 2 - r, -w / 2, -h / 2 - r);

  const bevel = 0.006;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: CARD_D - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -CARD_D / 2);
  geometry.computeVertexNormals();
  return geometry;
})();

/**
 * Paper material. One per card rather than one shared instance, because the
 * blush tint has to be able to move independently of anything else on stage.
 */
function makeCardMaterial() {
  return new THREE.MeshStandardMaterial({ color: '#F4F1E8', roughness: 0.86, metalness: 0.02 });
}

const PAPER_COLD = new THREE.Color('#F4F1E8');
const PAPER_WARM = new THREE.Color('#FFE2E9');

type Props = {
  person: Person;
  /** -1 for the left card, +1 for the right. */
  side: -1 | 1;
  /** 0..1. How well this scene works for this pair. Drives everything. */
  magnetism: number;
  /** True once the user has committed to this scene. Triggers the hard snap. */
  locked: boolean;
  /** Global handoff progress 0..1 — cards leave the stage as this rises. */
  exiting: number;
  reducedMotion: boolean;
  /** Warms the paper when an affectionate reason is being read. */
  blush?: boolean;
};

/**
 * A photograph with thickness.
 *
 * The card's *resting transform is a function of magnetism*, not of a keyframe:
 * a weak scene leaves the two cards far apart and rotationally misaligned, a
 * strong one pulls them in and squares them up. Nothing about this is decorative
 * — the geometry is the argument.
 */
export function Polaroid3D({ person, side, magnetism, locked, exiting, reducedMotion, blush = false }: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const wobble = useRef({ x: 0, y: 0 });
  const layout = useStageLayout();
  const material = useMemo(() => makeCardMaterial(), []);

  const texture = useMemo(
    () => portraitTexture(person.portraitSeed, person.portraitTint),
    [person.portraitSeed, person.portraitTint],
  );

  // Per-card idle drift phase, so the two never breathe in lockstep.
  const phase = useMemo(() => seeded(person.portraitSeed)() * Math.PI * 2, [person.portraitSeed]);

  useFrame((state, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;
    // Resting transform comes from a pure function so the same maths can be
    // stepped through a damped loop in `npm run check` -- see cardTransform.ts.
    const target = cardTarget(side, magnetism, layout, t, reducedMotion);

    // Handoff: the cards are the last thing to leave, and they leave upward.
    const exitY = exiting * 3.4;
    const exitScale = layout.scale * lerp(1, 0.82, exiting);

    const lambda = locked ? 9 : 4.2;

    g.position.x = damp(g.position.x, target.x, lambda, dt);
    g.position.y = damp(g.position.y, target.y + exitY * layout.scale, lambda, dt);
    g.position.z = damp(g.position.z, target.z + (hovered ? 0.3 : 0), 7, dt);

    g.rotation.z = damp(g.rotation.z, target.rotZ, lambda, dt);
    g.rotation.y = damp(g.rotation.y, target.rotY + (hovered ? side * 0.06 : 0), lambda, dt);
    g.rotation.x = damp(g.rotation.x, hovered ? -0.05 : wobble.current.x, 6, dt);

    const s = damp(g.scale.x, exitScale * (hovered ? 1.035 : 1), 7, dt);
    g.scale.setScalar(s);

    const photo = (g.getObjectByName('photo') as THREE.Mesh | undefined)?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (photo) photo.opacity = 1 - exiting;

    // The blush. Barely there, and gone the moment you look away.
    material.color.lerp(blush ? PAPER_WARM : PAPER_COLD, 1 - Math.exp(-4.5 * dt));
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* paper body */}
      <mesh geometry={CARD_GEOMETRY} material={material} castShadow receiveShadow />

      {/* the photograph sits just proud of the paper, as it does on a real polaroid */}
      <mesh name="photo" position={[0, PHOTO_Y, CARD_D / 2 + 0.001]}>
        <planeGeometry args={[PHOTO_W, PHOTO_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent />
      </mesh>

      {/* handwritten caption strip on the wide bottom border */}
      <mesh position={[0, -CARD_H / 2 + 0.16, CARD_D / 2 + 0.001]}>
        <planeGeometry args={[PHOTO_W, 0.03]} />
        <meshBasicMaterial color="#0B0D12" transparent opacity={0.22 * (1 - exiting)} />
      </mesh>
    </group>
  );
}

