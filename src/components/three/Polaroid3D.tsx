'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { portraitTexture } from '@/lib/portrait';
import { damp, lerp, seeded } from '@/lib/motion';
import { CARD_H, CARD_W, useStageLayout } from './useStageLayout';
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
    const misfit = 1 - magnetism;

    // Separation is the argument. Wrong context holds them a card-and-a-half
    // apart with a void between them; right context brings them to rest just
    // short of touching. They never overlap — this is an introduction, not a
    // merge — and they never meet, either.
    const spread = lerp(layout.spreadMax, layout.spreadMin, magnetism);
    const along = side * spread * 0.5;

    // Portrait viewports stack the pair vertically, with a slight diagonal
    // offset so the composition still reads as two people rather than a list.
    const targetX = layout.portrait ? side * 0.16 * misfit : along;
    const baseY = layout.portrait ? -along : lerp(side === -1 ? 0.3 : -0.26, 0, magnetism);

    // Four independent channels resolve together as context improves: roll,
    // yaw, height, and depth. A bad scene is askew, turned away, unlevel and
    // on two different planes. The winning scene is square, facing in, level,
    // and sharing one plane — which is why it stops looking like scattered
    // objects and starts looking like a photograph.
    const targetZRot = side * misfit * 0.3;
    const targetYRot = -side * lerp(0.4, -0.07, magnetism);
    const targetZ = side * misfit * 0.55;

    // A weak scene refuses to settle: the card keeps hunting around its rest
    // position. A strong one comes to rest and stays there.
    const unrest = reducedMotion ? 0 : misfit * 0.055;
    const idle = reducedMotion ? 0 : 0.012;
    const driftX = Math.sin(t * 0.62 + phase) * (idle + unrest);
    const driftY = Math.cos(t * 0.48 + phase * 1.7) * (idle + unrest * 0.8);
    const driftRot = Math.sin(t * 0.53 + phase) * unrest * 0.5;

    // Handoff: the cards are the last thing to leave, and they leave upward.
    const exitY = exiting * 3.4;
    const exitScale = layout.scale * lerp(1, 0.82, exiting);

    const lambda = locked ? 9 : 4.2;

    g.position.x = damp(g.position.x, (targetX + driftX) * layout.scale, lambda, dt);
    g.position.y = damp(g.position.y, (baseY + driftY + exitY) * layout.scale, lambda, dt);
    g.position.z = damp(g.position.z, targetZ + (hovered ? 0.3 : 0), 7, dt);

    g.rotation.z = damp(g.rotation.z, targetZRot + driftRot, lambda, dt);
    g.rotation.y = damp(g.rotation.y, targetYRot + (hovered ? side * 0.06 : 0), lambda, dt);
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

