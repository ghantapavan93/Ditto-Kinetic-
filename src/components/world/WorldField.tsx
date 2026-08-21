'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POPULATION } from '@/lib/campus';
import { SCHOOLS, survivorsAt, type World } from '@/lib/world';
import { spring, type Spring } from '@/lib/motion';

/**
 * Eight campuses, and what happens to seven of them.
 *
 * The scene has one move in it, and the whole act is that move: everything is
 * lit while you are looking at a pool, and then travel gets priced in and the
 * far schools go out. Not a filter animating — the same objects, still where
 * they were, dimming because the bar rose past what they could clear.
 *
 * Yours never dims. That is not favouritism, it is the model: a trip of zero
 * minutes costs zero, so your campus is the only school whose bar is the plain
 * send threshold. The visual and the arithmetic are the same statement.
 */

/** One dot for every person in the world. 768 of them, one geometry. */
const DOT = new THREE.SphereGeometry(0.03, 6, 6);

const WARM = new THREE.Color('#E8913C');
const COLD = new THREE.Color('#3F5872');
const PAPER = new THREE.Color('#F4EDE4');

/**
 * How far the trip has been priced in, 0..1, shared across the scene.
 *
 * The ref itself is passed down, never its value: reading `.current` during
 * render is forbidden and would be pointless anyway, since a ref changing is
 * not a state change and would re-render nothing. Every consumer reads it
 * inside its own frame loop, which is the only place it means anything.
 */
type Priced = RefObject<number>;

function SchoolCluster({
  world,
  index,
  priced,
}: {
  world: World;
  index: number;
  priced: Priced;
}) {
  const group = useRef<THREE.Group>(null);
  const school = world.schools[index];
  const survivors = useMemo(() => survivorsAt(world, index).length, [world, index]);

  // Where this school's people sit, scattered around its centre.
  const positions = useMemo(() => {
    const out = new Float32Array(POPULATION * 3);
    school.campus.nodes.forEach((n, i) => {
      out[i * 3] = n.at[0] * 0.16;
      out[i * 3 + 1] = n.at[1] * 0.16;
      out[i * 3 + 2] = n.at[2] * 0.16;
    });
    return out;
  }, [school]);

  const material = useRef<THREE.PointsMaterial>(null);

  useFrame(() => {
    if (!material.current) return;
    // A school with nobody left goes almost entirely out. One with survivors
    // keeps a floor, because somebody there is still worth the trip.
    const alive = index === 0 ? 1 : survivors > 0 ? 0.5 : 0.06;
    const p = priced.current;
    const lit = 1 - p + p * alive;
    material.current.opacity = 0.14 + lit * 0.5;
    material.current.color.lerpColors(COLD, index === 0 ? WARM : PAPER, lit * 0.85);
    if (group.current) group.current.rotation.y += 0.0009;
  });

  return (
    <group ref={group} position={school.at}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={material}
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </points>
      {/* the school's own centre, so a cluster still reads when its people go out */}
      <mesh geometry={DOT}>
        <meshBasicMaterial color={index === 0 ? '#E8913C' : '#6B7F96'} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/**
 * The threads that survive the trip.
 *
 * One line per cross-campus candidate who still clears their raised bar. They
 * do not exist until travel is priced, because before that the question has not
 * been asked yet.
 */
function Threads({ world, priced }: { world: World; priced: Priced }) {
  const geometry = useMemo(() => {
    const out: number[] = [];
    for (const c of world.worthTheTrip) {
      const to = world.schools[c.school].at;
      out.push(0, 0, 0, to[0], to[1], to[2]);
    }
    return new Float32Array(out);
  }, [world]);

  const material = useRef<THREE.LineBasicMaterial>(null);
  useFrame(() => {
    if (material.current) material.current.opacity = priced.current * 0.42;
  });

  if (!geometry.length) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry, 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={material} color="#E8913C" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}

function Rig({ world, target }: { world: World; target: number }) {
  const smooth = useRef<Spring>({ x: 0, v: 0 });
  const drift = useRef(0);
  const value = useRef(0);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 30);
    value.current = spring(smooth.current, target, 4.5, dt);
    drift.current += dt * 0.08;

    // Pricing the trip pulls the camera in toward your campus — the world does
    // not get smaller, the part of it that matters does.
    const back = 9.5 - value.current * 2.6;
    camera.position.set(Math.sin(drift.current) * 1.1, 3.4 - value.current * 0.7, back);
    // Aimed left of the schools so the world composes into the right of the
    // frame, clear of the left-aligned copy. The scrim alone was not enough --
    // the headline was sitting on top of the clusters.
    camera.lookAt(-2.6, -0.5, 0);
  });

  return (
    <>
      {Array.from({ length: SCHOOLS }, (_, i) => (
        <SchoolCluster key={i} world={world} index={i} priced={value} />
      ))}
      <Threads world={world} priced={value} />
    </>
  );
}

export function WorldField({ world, priced }: { world: World; priced: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.4, 9.5], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={['#0B0907']} />
      <fog attach="fog" args={['#0B0907', 12, 30]} />
      <ambientLight intensity={0.9} />
      <Rig world={world} target={priced ? 1 : 0} />
    </Canvas>
  );
}
