'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from '@/lib/motion';
import type { SceneMood } from '@/lib/types';

type MoodLight = {
  ambient: number;
  ambientColor: string;
  keyIntensity: number;
  keyColor: string;
  keyPos: [number, number, number];
  rimIntensity: number;
  rimColor: string;
  fogNear: number;
  fogFar: number;
};

/**
 * Light is doing narrative work here, not atmosphere work.
 *
 * `rigid` is lit flat and frontally — the lighting of a room where two people
 * are looking straight at each other with nowhere to put their eyes. `depleted`
 * drops the key almost entirely. `inevitable` is the only mood that gets a warm
 * key *and* a cobalt rim, which is why the winning scene looks like it was
 * photographed rather than rendered.
 */
const MOODS: Record<SceneMood, MoodLight> = {
  rigid: {
    ambient: 0.72,
    ambientColor: '#9AA6C4',
    keyIntensity: 1.15,
    keyColor: '#DCE4FF',
    keyPos: [0, 1.2, 5.2],
    rimIntensity: 0.15,
    rimColor: '#33406B',
    fogNear: 9,
    fogFar: 22,
  },
  shared: {
    ambient: 0.45,
    ambientColor: '#8C93B8',
    keyIntensity: 1.5,
    keyColor: '#FFD9A8',
    keyPos: [-3.1, 2.4, 3.6],
    rimIntensity: 0.5,
    rimColor: '#2B44FF',
    fogNear: 8,
    fogFar: 20,
  },
  curious: {
    ambient: 0.62,
    ambientColor: '#C9CEDC',
    keyIntensity: 1.25,
    keyColor: '#F4F1E8',
    keyPos: [2.6, 3.2, 4.0],
    rimIntensity: 0.38,
    rimColor: '#5C6CFF',
    fogNear: 9,
    fogFar: 21,
  },
  inevitable: {
    ambient: 0.3,
    ambientColor: '#5A6A9E',
    keyIntensity: 2.1,
    keyColor: '#FFC178',
    keyPos: [-3.6, 1.7, 3.0],
    rimIntensity: 1.05,
    rimColor: '#2B44FF',
    fogNear: 7,
    fogFar: 17,
  },
  busy: {
    ambient: 0.6,
    ambientColor: '#8E86A8',
    keyIntensity: 1.3,
    keyColor: '#FFE3C4',
    keyPos: [3.4, 1.0, 3.4],
    rimIntensity: 0.62,
    rimColor: '#FF2E88',
    fogNear: 8,
    fogFar: 18,
  },
  depleted: {
    ambient: 0.34,
    ambientColor: '#6A6F7C',
    keyIntensity: 0.62,
    keyColor: '#A8AFC0',
    keyPos: [0.6, 2.8, 3.0],
    rimIntensity: 0.1,
    rimColor: '#2A2F3E',
    fogNear: 6,
    fogFar: 15,
  },
};

export function SceneLighting({ mood, locked }: { mood: SceneMood; locked: boolean }) {
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const target = MOODS[mood];

  const ambientColor = useRef(new THREE.Color(target.ambientColor));
  const keyColor = useRef(new THREE.Color(target.keyColor));
  const rimColor = useRef(new THREE.Color(target.rimColor));

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const L = 3.2;

    if (ambient.current) {
      ambient.current.intensity = damp(ambient.current.intensity, target.ambient, L, dt);
      ambientColor.current.lerp(new THREE.Color(target.ambientColor), 1 - Math.exp(-L * dt));
      ambient.current.color.copy(ambientColor.current);
    }
    if (key.current) {
      key.current.intensity = damp(key.current.intensity, target.keyIntensity, L, dt);
      keyColor.current.lerp(new THREE.Color(target.keyColor), 1 - Math.exp(-L * dt));
      key.current.color.copy(keyColor.current);
      key.current.position.x = damp(key.current.position.x, target.keyPos[0], L, dt);
      key.current.position.y = damp(key.current.position.y, target.keyPos[1], L, dt);
      key.current.position.z = damp(key.current.position.z, target.keyPos[2], L, dt);
    }
    if (rim.current) {
      // The rim swells briefly on lock — the only light that responds to the
      // *decision* rather than to the scene.
      const boost = locked ? 1.45 : 1;
      rim.current.intensity = damp(rim.current.intensity, target.rimIntensity * boost * 6, L, dt);
      rimColor.current.lerp(new THREE.Color(target.rimColor), 1 - Math.exp(-L * dt));
      rim.current.color.copy(rimColor.current);
    }

    if (state.scene.fog instanceof THREE.Fog) {
      state.scene.fog.near = damp(state.scene.fog.near, target.fogNear, L, dt);
      state.scene.fog.far = damp(state.scene.fog.far, target.fogFar, L, dt);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={target.ambient} color={target.ambientColor} />
      <directionalLight
        ref={key}
        position={target.keyPos}
        intensity={target.keyIntensity}
        color={target.keyColor}
      />
      <pointLight
        ref={rim}
        position={[0, -0.4, -2.6]}
        intensity={target.rimIntensity * 6}
        color={target.rimColor}
        distance={12}
        decay={2}
      />
    </>
  );
}
