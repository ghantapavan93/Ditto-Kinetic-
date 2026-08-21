'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { spring, type Spring } from '@/lib/motion';
import type { Candidate } from '@/lib/intersections';

/**
 * The possibility field.
 *
 * Phase one is a person's own world: a handful of belongings floating at
 * different depths, close enough to fill the frame. Phase two is what happens
 * after the sentence — the camera pulls back, the belongings recede, and the
 * space around them fills with possible human moments.
 *
 * Nothing in this canvas is a person. Every object is an artifact — a ticket,
 * a receipt, a table light — because the model behind it holds no person data
 * until the lock, and the renderer cannot draw what the data does not carry.
 *
 * The physics is the ranking, translated rather than displayed:
 *
 *   distance   `gapFor` on the same utility the scorer computes
 *   stillness  the field's coherence — a contested evening will not settle
 *   approach   only a candidate that clears the send bar may close in
 *   turning    candidates that cannot clear rotate away as they oscillate
 *
 * So a held-back pair is visible, near-ish, and never still — which is what
 * being held back looks like from this side. No number appears anywhere.
 */

const YOURS: { kind: Candidate['artifact']; at: [number, number, number]; rot: number }[] = [
  { kind: 'ticket', at: [-0.8, 0.35, 0.4], rot: -0.14 },
  { kind: 'photo', at: [0.7, 0.55, -0.2], rot: 0.1 },
  { kind: 'receipt', at: [0.95, -0.3, 0.3], rot: 0.18 },
  { kind: 'book', at: [-0.95, -0.45, -0.1], rot: -0.08 },
  { kind: 'route', at: [0.1, -0.7, 0.55], rot: 0.05 },
  { kind: 'table', at: [-0.15, 0.8, -0.4], rot: 0 },
];

const TINT: Record<Candidate['artifact'], string> = {
  ticket: '#E8913C',
  receipt: '#F4EDE4',
  photo: '#D8C7AE',
  table: '#FFB865',
  book: '#8A6CC8',
  route: '#2FD8A8',
};

const SHAPE: Record<Candidate['artifact'], [number, number]> = {
  ticket: [0.52, 0.24],
  receipt: [0.26, 0.5],
  photo: [0.4, 0.46],
  table: [0.34, 0.34],
  book: [0.34, 0.44],
  route: [0.5, 0.3],
};

const GEOMETRY = new Map<string, THREE.PlaneGeometry>();
function geometryFor(kind: Candidate['artifact']): THREE.PlaneGeometry {
  const existing = GEOMETRY.get(kind);
  if (existing) return existing;
  const [w, h] = SHAPE[kind];
  const g = new THREE.PlaneGeometry(w, h);
  GEOMETRY.set(kind, g);
  return g;
}

export function PossibilityWorld({
  candidates,
  lockedId,
  opened,
  settled,
  onSettled,
  reducedMotion,
}: {
  candidates: Candidate[];
  /** Candidate id allowed to approach, or null. */
  lockedId: string | null;
  /** True once the sentence has been said. */
  opened: boolean;
  /** True once the approach has already completed (day scrubs after lock). */
  settled: boolean;
  onSettled: () => void;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 3.1], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={['#0B0907']} />
      <fog attach="fog" args={['#0B0907', 7, 15]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 4, 5]} intensity={0.7} color="#FFD9A8" />

      <Field
        candidates={candidates}
        lockedId={lockedId}
        opened={opened}
        settled={settled}
        onSettled={onSettled}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

function Field({
  candidates,
  lockedId,
  opened,
  settled,
  onSettled,
  reducedMotion,
}: {
  candidates: Candidate[];
  lockedId: string | null;
  opened: boolean;
  settled: boolean;
  onSettled: () => void;
  reducedMotion: boolean;
}) {
  const yours = useRef<THREE.Group>(null);
  const field = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);

  /** 0 = your world, 1 = pulled back into the possibility field. */
  const pull = useRef<Spring>({ x: 0, v: 0 });
  /** 1 = at ring distance, 0 = arrived. One spring, only the winner uses it. */
  const approach = useRef<Spring>({ x: 1, v: 0 });
  const announced = useRef(false);

  // Ring order is stable by id, so a day scrub moves nothing sideways.
  const order = useMemo(
    () => [...candidates].sort((a, b) => a.id.localeCompare(b.id)),
    [candidates],
  );

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 30);
    clock.current += dt;

    const target = opened ? 1 : 0;
    const p = reducedMotion
      ? (pull.current.x = target)
      : spring(pull.current, target, 4.2, dt);

    camera.position.set(0, 0.2 + p * 1.6, 3.1 + p * 5.2);
    camera.lookAt(0, 0.1, 0);

    // Your world recedes as the field opens — it does not vanish. The person
    // is still at the centre of all of it.
    if (yours.current) {
      yours.current.scale.setScalar(1 - p * 0.45);
      yours.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (m && 'opacity' in m) m.opacity = (o.userData.base ?? 0.8) * (1 - p * 0.55);
      });
      if (!reducedMotion) yours.current.rotation.y = clock.current * 0.05;
    }

    if (field.current) {
      field.current.visible = p > 0.02;
    }

    const wantedApproach = settled ? 0 : lockedId ? 0 : 1;
    const a = reducedMotion
      ? (approach.current.x = wantedApproach)
      : spring(approach.current, lockedId ? 0 : 1, 2.6, dt);

    if (lockedId && !announced.current && a < 0.06 && Math.abs(approach.current.v) < 0.05) {
      announced.current = true;
      onSettled();
    }
    if (!lockedId) announced.current = false;

    order.forEach((c, i) => {
      const g = meshes.current[i];
      if (!g) return;

      const angle = (i / order.length) * Math.PI * 2 + 0.35;
      const isWinner = c.id === lockedId;

      // Distance is the ranking. The winner rides the approach spring from its
      // honest resting gap down to arm's length; everybody else stays where
      // their utility puts them.
      const ringRadius = 1.15 + c.gap;
      const radius = isWinner ? 0.95 + (ringRadius - 0.95) * a : ringRadius;

      // A contested field never sits still, and one that cannot clear turns
      // away in the same motion.
      const wobble = reducedMotion ? 0 : c.jitter * Math.sin(clock.current * 5.2 + i * 2.1) * 0.11;
      const turnAway = c.clears ? 0 : 0.7 + wobble * 2.4;

      g.position.set(
        Math.cos(angle) * radius + wobble,
        0.15 + Math.sin(clock.current * 0.5 + i * 1.7) * (reducedMotion ? 0 : 0.05),
        Math.sin(angle) * radius,
      );
      g.rotation.y = -angle + Math.PI / 2 + turnAway + wobble;

      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (m && 'opacity' in m) {
          const dim = c.availableToday ? 1 : 0.28;
          const lift = isWinner ? 1 : 0.72;
          m.opacity = (o.userData.base ?? 0.8) * dim * lift;
        }
      });
    });
  });

  return (
    <>
      {/* ZOOM 01 — the things you carry */}
      <group ref={yours}>
        {YOURS.map((a, i) => (
          <mesh
            key={i}
            geometry={geometryFor(a.kind)}
            position={a.at}
            rotation={[0, 0, a.rot]}
            userData={{ base: 0.85 }}
          >
            <meshBasicMaterial color={TINT[a.kind]} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#F4EDE4" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* ZOOM 02 — possible human moments */}
      <group ref={field} visible={false}>
        {order.map((c, i) => (
          <group
            key={c.id}
            ref={(g) => {
              meshes.current[i] = g;
            }}
          >
            <mesh geometry={geometryFor(c.artifact)} userData={{ base: 0.9 }}>
              <meshBasicMaterial
                color={TINT[c.artifact]}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* a faint warmth behind anything that could actually happen */}
            {c.clears && (
              <mesh position={[0, 0, -0.06]} userData={{ base: 0.16 }}>
                <circleGeometry args={[0.42, 24]} />
                <meshBasicMaterial
                  color="#FFB865"
                  transparent
                  opacity={0.16}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </>
  );
}
