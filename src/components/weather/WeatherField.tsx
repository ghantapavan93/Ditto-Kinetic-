'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ALIVE, type Week } from '@/lib/weather';

import { AMBER, INK, OVERCAST } from '@/lib/palette';
const DOT = new THREE.SphereGeometry(0.055, 10, 10);

const WARM = new THREE.Color(AMBER);
const COLD = new THREE.Color(OVERCAST);
const scratch = new THREE.Color();

/**
 * The campus, warm or cold.
 *
 * The same ninety-six people and the same positions as the network layer. What
 * changes across the week is not who exists but how much of them is available,
 * so the population never thins — it cools, and on the worst nights it goes out
 * almost entirely while everybody is still standing exactly where they were.
 *
 * That distinction is the point. A matching system's failure mode on a bad
 * night is not "there is nobody here", it is "everybody is here and none of
 * them have anything left". Drawing them as absent would model the wrong
 * problem.
 *
 * Colour is energy, size is energy, and the threads dim with the mean. Nobody
 * is removed from the scene on any night of the week.
 */
export function WeatherField({
  week,
  day,
  warmth,
  reducedMotion,
}: {
  week: Week;
  day: number;
  warmth: number;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.2, 9.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 12, 22]} />
      <ambientLight intensity={0.6} />

      <Field week={week} day={day} warmth={warmth} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

function Field({
  week,
  day,
  warmth,
  reducedMotion,
}: {
  week: Week;
  day: number;
  warmth: number;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const threads = useRef<THREE.LineSegments>(null);
  const clock = useRef(0);

  /** Eased per-person energy, so a change of night is a change of temperature. */
  const shown = useRef<number[]>(week.campus.nodes.map(() => 0));

  const lines = useMemo(() => {
    const out: number[] = [];
    for (const e of week.campus.edges) {
      const A = week.campus.nodes[e.a].at;
      const B = week.campus.nodes[e.b].at;
      out.push(A[0], A[1], A[2], B[0], B[1], B[2]);
    }
    return new Float32Array(out);
  }, [week]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    clock.current += dt;

    if (group.current && !reducedMotion) group.current.rotation.y = clock.current * 0.035;

    for (let i = 0; i < week.campus.nodes.length; i++) {
      const wanted = week.energy[i][day];
      // Eased rather than assigned: the week should feel like weather changing,
      // not like six separate diagrams.
      shown.current[i] += (wanted - shown.current[i]) * Math.min(1, dt * 4.2);
      const e = shown.current[i];

      const mesh = dots.current[i];
      if (!mesh) continue;

      const material = mesh.material as THREE.MeshBasicMaterial;
      scratch.copy(COLD).lerp(WARM, Math.min(1, e / 0.8));
      material.color.copy(scratch);
      // Present but flat still shows: a bad night is a full campus with nothing
      // left in it, not an empty one.
      material.opacity = e <= 0 ? 0.07 : 0.2 + e * 0.7;

      const s = e <= 0 ? 0.7 : 0.8 + (e >= ALIVE ? 1 : 0.35) * e * 1.5;
      mesh.scale.setScalar(s);
    }

    if (threads.current) {
      const m = threads.current.material as THREE.LineBasicMaterial;
      m.opacity = 0.02 + warmth * 0.12;
    }
  });

  return (
    <group ref={group}>
      <lineSegments ref={threads}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#F4EDE4" transparent opacity={0.06} />
      </lineSegments>

      {week.campus.nodes.map((n, i) => (
        <mesh
          key={n.id}
          geometry={DOT}
          position={n.at}
          ref={(m) => {
            dots.current[i] = m;
          }}
        >
          <meshBasicMaterial color="#3E5F80" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}
