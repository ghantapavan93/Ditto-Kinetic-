'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Campus } from '@/lib/campus';
import type { EdgeRead } from '@/lib/network';

const DOT = new THREE.SphereGeometry(0.055, 10, 10);

/**
 * A campus, as one object.
 *
 * The stage elsewhere on this site holds two people and takes its time over
 * them. This is the same project at the other end of the zoom: ninety-six
 * people, six corners of campus, and every thread between them at once.
 *
 * Three things are drawn differently on purpose, because the argument is
 * entirely in the contrast.
 *
 * Existing threads are dim and grey, and the ones that cross between corners
 * are slightly brighter — those sixteen weak ties are what make this one campus
 * rather than six separate rooms, and they are almost invisible, which is also
 * true of them in life.
 *
 * The highlighted candidate is drawn as a thread that is not there yet. It
 * pulses, because the whole page is about an absence, and an absence rendered
 * as a solid line reads as something that already exists.
 *
 * And people with one connection or none are drawn smaller and colder. They are
 * the population an engagement-optimised product cannot see, for the structural
 * reason that they generate almost no activity to rank.
 */
export function Constellation({
  campus,
  highlight,
  lonely,
  reducedMotion,
}: {
  campus: Campus;
  highlight: EdgeRead;
  lonely: Set<number>;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.6, 9.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={['#0B0907']} />
      <fog attach="fog" args={['#0B0907', 11, 21]} />
      <ambientLight intensity={0.6} />

      <Scene
        campus={campus}
        highlight={highlight}
        lonely={lonely}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

function Scene({
  campus,
  highlight,
  lonely,
  reducedMotion,
}: {
  campus: Campus;
  highlight: EdgeRead;
  lonely: Set<number>;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.LineSegments>(null);
  const t = useRef(0);

  /** Existing threads, split so weak ties can be drawn brighter. */
  const { strong, weak } = useMemo(() => {
    const s: number[] = [];
    const w: number[] = [];
    for (const e of campus.edges) {
      const A = campus.nodes[e.a].at;
      const B = campus.nodes[e.b].at;
      (e.weak ? w : s).push(A[0], A[1], A[2], B[0], B[1], B[2]);
    }
    return {
      strong: new Float32Array(s),
      weak: new Float32Array(w),
    };
  }, [campus]);

  /** The thread that is not there yet. */
  const candidate = useMemo(() => {
    const A = campus.nodes[highlight.a].at;
    const B = campus.nodes[highlight.b].at;
    return new Float32Array([A[0], A[1], A[2], B[0], B[1], B[2]]);
  }, [campus, highlight]);

  useFrame((_, delta) => {
    t.current += Math.min(delta, 1 / 30);

    // The whole campus turns, slowly. Enough to read as a solid object with
    // depth rather than a flat scatter, and slow enough to be ignorable.
    if (group.current && !reducedMotion) {
      group.current.rotation.y = t.current * 0.055;
    }

    const line = pulse.current;
    if (line) {
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = reducedMotion ? 0.9 : 0.45 + Math.sin(t.current * 2.4) * 0.42;
    }
  });

  return (
    <group ref={group}>
      {/* existing threads */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strong, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#F4EDE4" transparent opacity={0.09} />
      </lineSegments>

      {/* the sixteen that hold the campus together */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[weak, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#2FD8A8" transparent opacity={0.3} />
      </lineSegments>

      {/* the one that is missing */}
      <lineSegments ref={pulse} renderOrder={3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[candidate, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#FF2E88" transparent depthWrite={false} />
      </lineSegments>

      {/* people */}
      {campus.nodes.map((n, i) => {
        const isEnd = i === highlight.a || i === highlight.b;
        const isLonely = lonely.has(i);

        return (
          <mesh key={n.id} geometry={DOT} position={n.at} scale={isEnd ? 1.9 : isLonely ? 0.68 : 1}>
            <meshBasicMaterial
              color={isEnd ? '#FF2E88' : n.known ? '#E8913C' : isLonely ? '#4A6C8C' : '#F4EDE4'}
              transparent
              opacity={isEnd ? 1 : n.known ? 0.85 : isLonely ? 0.42 : 0.55}
            />
          </mesh>
        );
      })}
    </group>
  );
}
