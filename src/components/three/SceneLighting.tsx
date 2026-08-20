'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from '@/lib/motion';
import { shiftedTemperature, temperatureFor } from '@/lib/temperature';
import type { SceneMood } from '@/lib/types';

/**
 * Light is doing narrative work here, not atmosphere work.
 *
 * Every value comes from `temperature.ts`, which the DOM wash reads too — so
 * the page and the stage can never disagree about what a room feels like.
 *
 * `rigid` is lit flat and overhead: a warm room with nowhere to put your eyes.
 * `depleted` is the only genuinely cold one. `inevitable` is the single scene
 * that gets a warm key *and* a cobalt rim, which is why it is the one that
 * looks photographed rather than rendered.
 */
export function SceneLighting({
  mood,
  locked,
  timeShift = 0,
}: {
  mood: SceneMood;
  locked: boolean;
  /** -1 earlier and cooler, +1 later and warmer-keyed with colder shadow. */
  timeShift?: number;
}) {
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.PointLight>(null);

  const target = shiftedTemperature(temperatureFor(mood), timeShift);

  const ambientColor = useRef(new THREE.Color(target.ambient.color));
  const keyColor = useRef(new THREE.Color(target.key.color));
  const rimColor = useRef(new THREE.Color(target.rim.color));
  const airColor = useRef(new THREE.Color(target.air));

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const L = 3.2;
    const k = 1 - Math.exp(-L * dt);

    if (ambient.current) {
      ambient.current.intensity = damp(ambient.current.intensity, target.ambient.intensity, L, dt);
      ambientColor.current.lerp(new THREE.Color(target.ambient.color), k);
      ambient.current.color.copy(ambientColor.current);
    }
    if (key.current) {
      key.current.intensity = damp(key.current.intensity, target.key.intensity, L, dt);
      keyColor.current.lerp(new THREE.Color(target.key.color), k);
      key.current.color.copy(keyColor.current);
      key.current.position.x = damp(key.current.position.x, target.key.at[0], L, dt);
      key.current.position.y = damp(key.current.position.y, target.key.at[1], L, dt);
      key.current.position.z = damp(key.current.position.z, target.key.at[2], L, dt);
    }
    if (rim.current) {
      // The rim swells briefly on lock — the only light that responds to the
      // *decision* rather than to the room.
      const boost = locked ? 1.45 : 1;
      rim.current.intensity = damp(rim.current.intensity, target.rim.intensity * boost * 6, L, dt);
      rimColor.current.lerp(new THREE.Color(target.rim.color), k);
      rim.current.color.copy(rimColor.current);
    }

    if (state.scene.fog instanceof THREE.Fog) {
      state.scene.fog.near = damp(state.scene.fog.near, target.fog[0], L, dt);
      state.scene.fog.far = damp(state.scene.fog.far, target.fog[1], L, dt);
      airColor.current.lerp(new THREE.Color(target.air), k);
      state.scene.fog.color.copy(airColor.current);
    }
  });

  return (
    <>
      <ambientLight
        ref={ambient}
        intensity={target.ambient.intensity}
        color={target.ambient.color}
      />
      <directionalLight
        ref={key}
        position={target.key.at}
        intensity={target.key.intensity}
        color={target.key.color}
      />
      <pointLight
        ref={rim}
        position={[0, -0.4, -2.6]}
        intensity={target.rim.intensity * 6}
        color={target.rim.color}
        distance={12}
        decay={2}
      />
    </>
  );
}
