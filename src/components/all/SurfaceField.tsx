'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Cost } from '@/lib/attention';

const NODE = new THREE.SphereGeometry(1, 20, 20);

/**
 * The site, as one object.
 *
 * Every surface and no way to see the shape of them. This is the index, built
 * out of the audit rather than beside it: every node is a route, its radius is
 * what that route costs somebody to read, and the two rings are the distinction
 * the audit already makes — what could ship sits close in, what exists to argue
 * sits further out.
 *
 * Which means the index cannot flatter the site. A surface that talks too much
 * is visibly fat, the ring it sits in says whether it earns that, and the
 * whole arrangement is generated from measured counts. Drawing every route the
 * same size would have been prettier and would have thrown away the only
 * information worth encoding.
 *
 * Text is in the DOM overlay, as everywhere else here.
 */
export function SurfaceField({
  costs,
  active,
  onPick,
  reducedMotion,
}: {
  costs: Cost[];
  active: number;
  onPick: (i: number) => void;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 4.6, 9.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={['#0B0907']} />
      <fog attach="fog" args={['#0B0907', 11, 20]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 4]} intensity={0.7} color="#FFD9A8" />

      <Ring costs={costs} active={active} onPick={onPick} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

/** Where a surface sits: product close in, argument further out. */
export function layoutFor(costs: Cost[]): [number, number, number][] {
  const product = costs.filter((c) => c.surface.kind === 'product');
  const argument = costs.filter((c) => c.surface.kind === 'argument');

  const place = (list: Cost[], radius: number, lift: number) =>
    new Map(
      list.map((c, i) => {
        const angle = (i / list.length) * Math.PI * 2;
        return [
          c.surface.path,
          [Math.cos(angle) * radius, lift, Math.sin(angle) * radius] as [number, number, number],
        ];
      }),
    );

  const inner = place(product, 2.35, 0.35);
  const outer = place(argument, 5.1, -0.25);

  return costs.map((c) => inner.get(c.surface.path) ?? outer.get(c.surface.path)!);
}

function Ring({
  costs,
  active,
  onPick,
  reducedMotion,
}: {
  costs: Cost[];
  active: number;
  onPick: (i: number) => void;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);

  const positions = useMemo(() => layoutFor(costs), [costs]);
  const dearest = useMemo(() => Math.max(...costs.map((c) => c.seconds)), [costs]);

  /** Threads from the product core out to each argument. */
  const lines = useMemo(() => {
    const out: number[] = [];
    costs.forEach((c, i) => {
      if (c.surface.kind !== 'argument') return;
      const p = positions[i];
      out.push(0, 0.1, 0, p[0], p[1], p[2]);
    });
    return new Float32Array(out);
  }, [costs, positions]);

  useFrame((_, delta) => {
    clock.current += Math.min(delta, 1 / 30);
    if (group.current && !reducedMotion) group.current.rotation.y = clock.current * 0.06;

    costs.forEach((c, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;

      // Radius is cost. A surface that talks more is physically larger, which
      // on this page is not a compliment.
      const base = 0.11 + (c.seconds / dearest) * 0.3;
      const wanted = i === active ? base * 1.5 : base;
      mesh.scale.setScalar(mesh.scale.x + (wanted - mesh.scale.x) * Math.min(1, delta * 8));

      if (!reducedMotion) {
        mesh.position.y = positions[i][1] + Math.sin(clock.current * 0.6 + i) * 0.045;
      }
    });
  });

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#F4EDE4" transparent opacity={0.07} />
      </lineSegments>

      {/* the product core */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial color="#2FD8A8" transparent opacity={0.5} />
      </mesh>

      {costs.map((c, i) => (
        <mesh
          key={c.surface.path}
          geometry={NODE}
          position={positions[i]}
          scale={0.14}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onPick(i);
          }}
          onPointerOver={() => onPick(i)}
        >
          <meshStandardMaterial
            color={c.surface.kind === 'product' ? '#2FD8A8' : '#E8913C'}
            emissive={c.surface.kind === 'product' ? '#2FD8A8' : '#E8913C'}
            emissiveIntensity={i === active ? 0.85 : 0.22}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
