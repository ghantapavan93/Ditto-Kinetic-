'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MIN_GAP, coherence, type Field } from '@/lib/gravity';
import { portraitTexture } from '@/lib/portrait';
import type { Person } from '@/lib/types';

import { ACID, INK, MINT, PAPER } from '@/lib/palette';
const CARD = new THREE.PlaneGeometry(1.05, 1.45);
const PHOTO = new THREE.PlaneGeometry(0.86, 0.94);
const ARROW = new THREE.PlaneGeometry(1, 0.014);

/**
 * Two bodies and ten forces.
 *
 * The gap between the cards is the utility, rescaled — that part is a bijection
 * and is not pretending to be emergent. What the simulation adds is everything a
 * resting number cannot show: the transition when a condition changes, which
 * force is doing the work, and whether the equilibrium is calm or contested.
 *
 * The bodies are integrated rather than positioned. They accelerate toward the
 * gap the field implies and overshoot slightly on the way, so breaking the week
 * *shoves* them apart instead of cutting to a new arrangement — the difference
 * between watching a decision change and being told it changed.
 *
 * Jitter is proportional to incoherence, and this is the load-bearing idea. Two
 * evenings can score identically with completely different force compositions:
 * one where little is happening in either direction, one where a strong pull and
 * a strong shove are fighting to a draw. The first sits still. The second will
 * not stop vibrating. The scorer reports the same number for both.
 */
export function GravityField({
  field,
  personA,
  personB,
  reducedMotion,
}: {
  field: Field;
  personA: Person;
  personB: Person;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.15, 5.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={[INK]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={0.8} color="#FFD9A8" />

      <Bodies
        field={field}
        personA={personA}
        personB={personB}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

function Bodies({
  field,
  personA,
  personB,
  reducedMotion,
}: {
  field: Field;
  personA: Person;
  personB: Person;
  reducedMotion: boolean;
}) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const forces = useRef<THREE.Group>(null);

  /** Live half-gap and its velocity. Integrated, never assigned. */
  const x = useRef(1.7);
  const v = useRef(0);
  const clock = useRef(0);

  const texA = useMemo(
    () => portraitTexture(personA.portraitSeed, personA.portraitTint),
    [personA],
  );
  const texB = useMemo(
    () => portraitTexture(personB.portraitSeed, personB.portraitTint),
    [personB],
  );

  const incoherence = 1 - coherence(field);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    clock.current += dt;

    const half = field.gap / 2;

    // Critically damped enough to settle, loose enough to visibly travel. The
    // overshoot is the point: a cut would not read as force.
    const k = 9;
    const damping = 2 * Math.sqrt(k) * 0.72;
    const a = -k * (x.current - half) - damping * v.current;
    v.current += a * dt;
    x.current += v.current * dt;

    // Contested equilibria do not sit still. Amplitude is the share of total
    // force that cancels rather than resolves.
    const wobble = reducedMotion
      ? 0
      : incoherence * 0.055 * Math.sin(clock.current * 7.4) +
        incoherence * 0.03 * Math.sin(clock.current * 11.9 + 1.1);

    if (left.current) {
      left.current.position.x = -x.current + wobble;
      left.current.rotation.z = wobble * 0.16;
    }
    if (right.current) {
      right.current.position.x = x.current - wobble;
      right.current.rotation.z = -wobble * 0.16;
    }

    // Force arrows live in the space between, brightening as they matter.
    if (forces.current) {
      forces.current.children.forEach((o, i) => {
        const f = field.forces[i];
        if (!f) return;
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.1 + f.share * 0.55;
        // Length tracks the live gap, so the field visibly stretches as the
        // bodies separate rather than staying a fixed diagram over them.
        o.scale.x = 0.25 + f.share * (x.current * 1.5);
      });
    }
  });

  return (
    <>
      {/* the two of them */}
      <group ref={left}>
        <mesh geometry={CARD}>
          <meshBasicMaterial color="#D8C7AE" side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={PHOTO} position={[0, 0.13, 0.004]}>
          <meshBasicMaterial map={texA} />
        </mesh>
      </group>

      <group ref={right}>
        <mesh geometry={CARD}>
          <meshBasicMaterial color="#D8C7AE" side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={PHOTO} position={[0, 0.13, 0.004]}>
          <meshBasicMaterial map={texB} />
        </mesh>
      </group>

      {/*
        Ten forces, stacked vertically between the bodies. Pulls sit above the
        centre line and pushes below it, so the balance of the field is legible
        as a shape before any of it is read as a label.
      */}
      <group ref={forces}>
        {field.forces.map((f, i) => {
          const rank = i / Math.max(1, field.forces.length - 1);
          const y = f.pulls ? 0.28 + rank * 0.5 : -0.28 - rank * 0.5;
          return (
            <mesh key={f.key} geometry={ARROW} position={[0, y, 0.12]}>
              <meshBasicMaterial
                color={f.pulls ? MINT : ACID}
                transparent
                opacity={0.3}
              />
            </mesh>
          );
        })}
      </group>

      {/* the send bar, as a place in space rather than a threshold in a table */}
      <mesh position={[0, 0, -0.35]}>
        <planeGeometry args={[MIN_GAP * 2, 0.006]} />
        <meshBasicMaterial
          color={field.locked ? MINT : PAPER}
          transparent
          opacity={field.locked ? 0.5 : 0.12}
        />
      </mesh>
    </>
  );
}
