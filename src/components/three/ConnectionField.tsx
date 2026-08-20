'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp, lerp } from '@/lib/motion';

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
export function ConnectionField({ magnetism, locked, exiting, reducedMotion }: Props) {
  const sag = useRef(0.55);
  const spread = useRef(1.07);

  const { geometry, material, positions } = useMemo(() => {
    const positions = new Float32Array((SEGMENTS + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: '#5C6CFF',
      transparent: true,
      opacity: 0.4,
    });
    return { geometry, material, positions };
  }, []);

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;

    const targetSpread = lerp(2.15, 1.06, magnetism);
    const targetSag = lerp(0.62, 0.02, magnetism);
    spread.current = damp(spread.current, targetSpread, locked ? 9 : 4.2, dt);
    sag.current = damp(sag.current, targetSag, locked ? 9 : 4.2, dt);

    const halfW = 0.66; // stop short of each card so the line reads as a field, not a tether
    const x0 = -spread.current * 0.5 + halfW;
    const x1 = spread.current * 0.5 - halfW;
    const jitter = reducedMotion ? 0 : (1 - magnetism) * 0.045;

    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      const x = lerp(x0, x1, u);
      // catenary-ish sag, strongest at the middle
      const droop = Math.sin(u * Math.PI) * sag.current;
      const noise = Math.sin(u * 11 + t * 1.9) * jitter * Math.sin(u * Math.PI);
      positions[i * 3] = x;
      positions[i * 3 + 1] = -droop + noise;
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
    material.color.lerpColors(
      new THREE.Color('#3A4470'),
      new THREE.Color(locked ? '#FF2E88' : '#5C6CFF'),
      magnetism,
    );
  });

  return <primitive object={line} />;
}
