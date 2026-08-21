'use client';

/* eslint-disable react-hooks/immutability -- 
 * React Compiler's immutability rule assumes a declarative tree. react-three-fiber
 * is the opposite by design: `useFrame` runs once per rendered frame and mutates
 * the live scene graph in place — camera position, geometry attributes, material
 * uniforms. Allocating new objects here instead would produce garbage every frame
 * at 60-120Hz, which is precisely what the imperative loop exists to avoid.
 * Scoped to files that own frame callbacks; the React tree elsewhere is unaffected.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp, lerp } from '@/lib/motion';
import { CARD_H, CARD_W, useStageLayout } from './useStageLayout';

import { ACID, THREAD_COLD, THREAD_WARM } from '@/lib/palette';
const SEGMENTS = 48;

type Props = {
  magnetism: number;
  locked: boolean;
  exiting: number;
  reducedMotion: boolean;
};

/**
 * The line between the two people.
 *
 * At low magnetism it hangs slack, like a cable nobody has pulled tight, and it
 * jitters — the connection exists but nothing is holding it. As context improves
 * the sag resolves and the line goes taut and straight. This is the single
 * clearest read on the stage: you can tell whether a scene works from the shape
 * of one line, before reading a word.
 *
 * Geometry is allocated once and its position attribute is rewritten in place;
 * no per-frame allocation.
 */
/**
 * The line's three colours, built once.
 *
 * These were `new THREE.Color('#...')` inside useFrame -- two allocations and
 * two hex parses per frame, per line, forever, in the file whose own header
 * says the imperative loop exists to avoid precisely this. They never change.
 */
const COLD = new THREE.Color(THREAD_COLD);
const WARM = new THREE.Color(THREAD_WARM);
const LOCKED = new THREE.Color(ACID);

export function ConnectionField({ magnetism, locked, exiting, reducedMotion }: Props) {
  const sag = useRef(0.55);
  const spread = useRef(1.07);
  const layout = useStageLayout();

  const { geometry, material, positions } = useMemo(() => {
    const positions = new Float32Array((SEGMENTS + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: THREAD_WARM,
      transparent: true,
      opacity: 0.4,
    });
    return { geometry, material, positions };
  }, []);

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;

    const targetSpread = lerp(layout.spreadMax, layout.spreadMin, magnetism);
    const targetSag = lerp(0.62, 0.015, magnetism);
    spread.current = damp(spread.current, targetSpread, locked ? 9 : 4.2, dt);
    sag.current = damp(sag.current, targetSag, locked ? 9 : 4.2, dt);

    // Stop short of each card so the line reads as a field between them rather
    // than a tether bolted to their edges.
    const inset = (layout.portrait ? CARD_H : CARD_W) * 0.5 + 0.06;
    const a = (-spread.current * 0.5 + inset) * layout.scale;
    const b = (spread.current * 0.5 - inset) * layout.scale;
    const jitter = reducedMotion ? 0 : (1 - magnetism) * 0.045;

    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      const along = lerp(a, b, u);
      // catenary-ish sag, strongest at the middle
      const droop = Math.sin(u * Math.PI) * sag.current * layout.scale;
      const noise = Math.sin(u * 11 + t * 1.9) * jitter * Math.sin(u * Math.PI);
      // In portrait the pair is stacked, so the line runs vertically and its
      // slack bows sideways instead of downward.
      positions[i * 3] = layout.portrait ? droop - noise : along;
      positions[i * 3 + 1] = layout.portrait ? -along : -droop + noise;
      positions[i * 3 + 2] = 0.02;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();

    material.opacity = damp(
      material.opacity,
      (locked ? 0.92 : lerp(0.16, 0.6, magnetism)) * (1 - exiting),
      6,
      dt,
    );
    material.color.lerpColors(COLD, locked ? LOCKED : WARM, magnetism);
  });

  return <primitive object={line} />;
}
