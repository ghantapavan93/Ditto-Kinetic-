'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildCampus } from '@/lib/campus';
import { readNetwork } from '@/lib/network';
import { bandOpacity, cameraAt, distanceToPair } from '@/lib/zoom';
import { PAIRS } from '@/data/pairs';
import { portraitTexture } from '@/lib/portrait';

import { AMBER, COLD, INK, PAPER } from '@/lib/palette';
/** Campus units are small; the journey needs room. */
const S = 9.5;

const DOT = new THREE.SphereGeometry(0.052, 10, 10);
const CARD = new THREE.PlaneGeometry(1.5, 2.1);
const PHOTO = new THREE.PlaneGeometry(1.22, 1.34);
const NOTE = new THREE.PlaneGeometry(0.34, 0.2);

/**
 * Three scales, one scene, one camera.
 *
 * Nothing here is swapped. The campus is built once, scaled up, and translated
 * so that the midpoint of the thread between Maya and Jonah sits at the origin
 * — which means the camera does not fly toward "the pair view", it flies into
 * the specific edge between two specific dots. At eighty units out that edge is
 * a hairline between two specks. At eight units it is two people. At two it is
 * one of them and the things they carry.
 *
 * Distant geometry fades on the way down, and that is level-of-detail rather
 * than a transition: ninety-six spheres at arm's length would fill the frame
 * and hide everything behind them. Every object stays exactly where it was
 * built. What moves is the camera, through real distance, on a path whose
 * continuity is asserted in `npm run check`.
 *
 * Text lives in the DOM overlay rather than in here, for the reason this
 * project has held to throughout: text in a canvas is unselectable,
 * untranslatable and invisible to a screen reader. Depth is worth having;
 * depth at the cost of the words is not.
 */
export function ZoomScene({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 26, 82], fov: 42, near: 0.1, far: 400 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={[INK]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 6, 4]} intensity={0.9} color="#FFD9A8" />

      <Rig t={t} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

function Rig({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  const { camera } = useThree();

  const campus = useMemo(() => buildCampus(), []);
  const net = useMemo(() => readNetwork(campus), [campus]);

  /**
   * Put the origin on the thread between the two people the site follows, so
   * "zoom in" and "zoom in on them" are the same instruction.
   */
  const { positions } = useMemo(() => {
    const maya = campus.nodes.findIndex((n) => n.id === PAIRS[0].personA.id);
    const jonah = campus.nodes.findIndex((n) => n.id === PAIRS[0].personB.id);

    const mid: [number, number, number] = [
      ((campus.nodes[maya].at[0] + campus.nodes[jonah].at[0]) / 2) * S,
      ((campus.nodes[maya].at[1] + campus.nodes[jonah].at[1]) / 2) * S,
      ((campus.nodes[maya].at[2] + campus.nodes[jonah].at[2]) / 2) * S,
    ];

    const off: [number, number, number] = [-mid[0], -mid[1], -mid[2]];
    const pos = campus.nodes.map(
      (n) =>
        [n.at[0] * S + off[0], n.at[1] * S + off[1], n.at[2] * S + off[2]] as [
          number,
          number,
          number,
        ],
    );
    return { positions: pos, maya, jonah };
  }, [campus]);

  const { threads, weakThreads, ours } = useMemo(() => {
    const strong: number[] = [];
    const weak: number[] = [];
    for (const e of campus.edges) {
      const A = positions[e.a];
      const B = positions[e.b];
      (e.weak ? weak : strong).push(A[0], A[1], A[2], B[0], B[1], B[2]);
    }

    const mi = campus.nodes.findIndex((n) => n.id === PAIRS[0].personA.id);
    const ji = campus.nodes.findIndex((n) => n.id === PAIRS[0].personB.id);
    const A = positions[mi];
    const B = positions[ji];

    return {
      threads: new Float32Array(strong),
      weakThreads: new Float32Array(weak),
      ours: new Float32Array([A[0], A[1], A[2], B[0], B[1], B[2]]),
    };
  }, [campus, positions]);

  const lonely = useMemo(() => new Set(net.isolated), [net.isolated]);

  // Built once. `portraitTexture` touches `document`, so it cannot run during
  // the server pass — this component is already client-only behind a dynamic
  // import, and memoising keeps it off the frame loop as well.
  const people = useMemo(
    () => [
      { person: PAIRS[0].personA, side: -1 },
      { person: PAIRS[0].personB, side: 1 },
    ],
    [],
  );

  const world = useRef<THREE.Group>(null);
  const pair = useRef<THREE.Group>(null);
  const notes = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, delta) => {
    clock.current += Math.min(delta, 1 / 30);

    const shot = cameraAt(t);
    camera.position.set(shot.eye[0], shot.eye[1], shot.eye[2]);
    camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);

    const d = distanceToPair(t);

    // Each level is legible across a band of camera distance and invisible
    // outside it. Nothing is swapped; things stop being readable at the wrong
    // scale, which is also true of things.
    const worldO = bandOpacity(d, 400, 60, 6);
    const pairO = bandOpacity(d, 26, 9, 0.8);
    const noteO = bandOpacity(d, 5.4, 2.4, 0.4);

    if (world.current) {
      world.current.visible = worldO > 0.004;
      world.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && 'opacity' in m) {
          (m as THREE.MeshBasicMaterial).opacity =
            (o.userData.base ?? 0.5) * worldO;
        }
      });
      if (!reducedMotion) world.current.rotation.y = clock.current * 0.02;
    }

    if (pair.current) {
      pair.current.visible = pairO > 0.004;
      pair.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && 'opacity' in m) {
          (m as THREE.MeshBasicMaterial).opacity = (o.userData.base ?? 1) * pairO;
        }
      });
    }

    if (notes.current) {
      notes.current.visible = noteO > 0.004;
      notes.current.children.forEach((o, i) => {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.5 * noteO;
        if (!reducedMotion) {
          o.position.y = o.userData.y + Math.sin(clock.current * 0.6 + i * 1.4) * 0.018;
        }
      });
    }
  });

  return (
    <>
      {/* ZOOM 3 — the campus */}
      <group ref={world}>
        <lineSegments userData={{ base: 0.085 }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[threads, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#F4EDE4" transparent opacity={0.085} />
        </lineSegments>

        <lineSegments userData={{ base: 0.26 }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[weakThreads, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#2FD8A8" transparent opacity={0.26} />
        </lineSegments>

        {/* the one thread this whole site is about */}
        <lineSegments userData={{ base: 0.95 }} renderOrder={2}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ours, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#E8913C" transparent opacity={0.95} depthWrite={false} />
        </lineSegments>

        {campus.nodes.map((n, i) => (
          <mesh
            key={n.id}
            geometry={DOT}
            position={positions[i]}
            scale={n.known ? 3.4 : lonely.has(i) ? 1.5 : 2.2}
            userData={{ base: n.known ? 0.9 : lonely.has(i) ? 0.4 : 0.5 }}
          >
            <meshBasicMaterial
              color={n.known ? AMBER : lonely.has(i) ? COLD : PAPER}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/*
        ZOOM 2 — two of them, at the midpoint of that thread.

        The same procedurally generated faces the stage uses, from the same
        seeds. Two blank rectangles would have been enough to prove the camera
        move and would have made the middle of the journey the emptiest part of
        it — the level where you finally arrive at two people should have two
        people at it.
      */}
      <group ref={pair}>
        {people.map(({ person, side }) => (
          <group key={person.id} position={[side * 1.15, 0.1, 0]} rotation={[0, side * -0.13, side * 0.012]}>
            {/* the card */}
            <mesh geometry={CARD} userData={{ base: 1 }}>
              <meshBasicMaterial color="#D8C7AE" transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {/* the face, inset like a polaroid */}
            <mesh geometry={PHOTO} position={[0, 0.19, 0.004]} userData={{ base: 1 }}>
              <meshBasicMaterial
                map={portraitTexture(person.portraitSeed, person.portraitTint)}
                transparent
                opacity={1}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ZOOM 1 — what one of them carries */}
      <group ref={notes}>
        {PAIRS[0].fragments.slice(0, 5).map((f, i) => {
          const angle = (i / 5) * Math.PI * 2;
          const y = 0.1 + Math.sin(angle) * 0.42;
          return (
            <mesh
              key={f.text}
              geometry={NOTE}
              position={[-1.15 + Math.cos(angle) * 0.62, y, 0.28 + i * 0.035]}
              rotation={[0, 0, Math.sin(angle) * 0.16]}
              userData={{ y }}
            >
              <meshBasicMaterial color="#F4EDE4" transparent opacity={0} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
