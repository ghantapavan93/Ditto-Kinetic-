'use client';

import { createContext, useContext, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Cost } from '@/lib/attention';

import { AMBER, INK, MINT } from '@/lib/palette';

const PAPER_TONE = '#EDE5D6';

/**
 * The site, as a desk of objects.
 *
 * The first version of this map drew every route as the same sphere, sized by
 * cost — honest, and mute. Twenty-eight identical blobs said "there are many
 * pages" and nothing else. Now every route is the physical object its own page
 * is about: the stage is a dial, /thread is a message bubble, /held-back is a
 * sealed envelope, /double is four chairs, /ending is a door standing ajar,
 * /end is an almost-empty wireframe. Navigation itself tells the story.
 *
 * The honesty stayed: an object's overall scale is still what its route costs
 * to read, the two rings still split could-ship from exists-to-argue, and the
 * whole arrangement still derives from the measured inventory. Routes already
 * visited this session glow warmer — spatial memory for the visitor's own
 * trail, read from the same sessionStorage set the everything-chip counts.
 *
 * One pointer grammar everywhere: hover (or first tap) looks at an object,
 * a click on the object already under the light walks into its page.
 */
export function SurfaceField({
  costs,
  active,
  visited,
  onPick,
  onOpen,
  reducedMotion,
}: {
  costs: Cost[];
  active: number;
  visited: ReadonlySet<string>;
  onPick: (i: number) => void;
  onOpen: (path: string) => void;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 4.6, 9.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 11, 20]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 6, 4]} intensity={0.8} color="#FFD9A8" />

      <Ring
        costs={costs}
        active={active}
        visited={visited}
        onPick={onPick}
        onOpen={onOpen}
        reducedMotion={reducedMotion}
      />
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

/**
 * The object vocabulary. Each route's shape is built from at most a handful
 * of primitives — this is a desk of things, not a model library — and every
 * shape reads at the sizes the cost scaling produces. The material is shared:
 * the mesh colour carries the ring (mint ships, amber argues), the shape
 * carries the page.
 */
function ObjectFor({ path }: { path: string }) {
  switch (path) {
    case '/': // the dial
      return (
        <group rotation={[Math.PI / 2.3, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.9, 0.16, 12, 32]} />
            <Skin />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.1, 0.34, 0.1]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/thread': // a message bubble
      return (
        <group>
          <mesh>
            <boxGeometry args={[1.5, 0.85, 0.22]} />
            <Skin />
          </mesh>
          <mesh position={[-0.55, -0.55, 0]} rotation={[0, 0, 0.6]}>
            <coneGeometry args={[0.18, 0.4, 4]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/app': // a phone
      return (
        <mesh rotation={[-0.35, 0.3, 0]}>
          <boxGeometry args={[0.8, 1.55, 0.12]} />
          <Skin />
        </mesh>
      );
    case '/wednesday': // the countdown card, propped
      return (
        <mesh rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[1.4, 0.9, 0.08]} />
          <Skin />
        </mesh>
      );
    case '/after': // a developing polaroid
    case '/moments':
      return (
        <group rotation={[-0.4, 0.2, 0.05]}>
          <mesh>
            <boxGeometry args={[1.0, 1.2, 0.06]} />
            <meshStandardMaterial color={PAPER_TONE} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.12, 0.045]}>
            <boxGeometry args={[0.84, 0.8, 0.02]} />
            <Skin dark />
          </mesh>
        </group>
      );
    case '/held-back': // a sealed envelope
      return (
        <group rotation={[-0.6, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[1.4, 0.9, 0.07]} />
            <Skin />
          </mesh>
          <mesh position={[0, 0.22, 0.05]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.62, 0.42, 3]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/double': // four chairs
      return (
        <group>
          {[
            [-0.45, 0, -0.45],
            [0.45, 0, -0.45],
            [-0.45, 0, 0.45],
            [0.45, 0, 0.45],
          ].map((p, i) => (
            <group key={i} position={p as [number, number, number]}>
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.34, 0.08, 0.34]} />
                <Skin />
              </mesh>
              <mesh position={[0, 0.36, -0.14]}>
                <boxGeometry args={[0.34, 0.5, 0.06]} />
                <Skin />
              </mesh>
            </group>
          ))}
        </group>
      );
    case '/ending': // a door, ajar
      return (
        <group>
          <mesh position={[-0.55, 0, 0]}>
            <boxGeometry args={[0.12, 1.7, 0.12]} />
            <Skin />
          </mesh>
          <mesh position={[0.55, 0, 0]}>
            <boxGeometry args={[0.12, 1.7, 0.12]} />
            <Skin />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[1.22, 0.12, 0.12]} />
            <Skin />
          </mesh>
          <mesh position={[0.2, -0.05, -0.1]} rotation={[0, -0.7, 0]}>
            <boxGeometry args={[0.85, 1.58, 0.05]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/end': // almost nothing
      return (
        <mesh>
          <sphereGeometry args={[0.7, 10, 10]} />
          <meshBasicMaterial color={PAPER_TONE} wireframe transparent opacity={0.16} />
        </mesh>
      );
    case '/network': // a small constellation
      return (
        <group>
          {[
            [-0.6, 0.3, 0],
            [0.5, 0.55, 0.2],
            [0.15, -0.45, -0.15],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <Skin />
            </mesh>
          ))}
        </group>
      );
    case '/world': // a ringed globe
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.62, 18, 18]} />
            <Skin />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0, 0.3]}>
            <torusGeometry args={[0.95, 0.035, 8, 40]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/zoom': // a camera
    case '/vision':
      return (
        <group rotation={[0, 0.5, 0]}>
          <mesh>
            <boxGeometry args={[1.1, 0.7, 0.55]} />
            <Skin />
          </mesh>
          <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.35, 16]} />
            <Skin dark />
          </mesh>
        </group>
      );
    case '/weather': // a small lamp
      return (
        <group>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.55, 0.55, 16]} />
            <Skin />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.75, 8]} />
            <Skin />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/gravity': // two fragments, almost touching
      return (
        <group>
          <mesh position={[-0.35, 0, 0]} rotation={[0.2, 0.4, 0.1]}>
            <boxGeometry args={[0.55, 0.7, 0.3]} />
            <Skin />
          </mesh>
          <mesh position={[0.42, 0.05, 0]} rotation={[-0.15, -0.3, -0.1]}>
            <boxGeometry args={[0.5, 0.62, 0.3]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/autonomy': // a ladder
      return (
        <group rotation={[0, 0, 0.12]}>
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 1.7, 0.08]} />
              <Skin />
            </mesh>
          ))}
          {[-0.55, -0.18, 0.18, 0.55].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.62, 0.07, 0.07]} />
              <Skin />
            </mesh>
          ))}
        </group>
      );
    case '/attention': // the receipt
    case '/compiler':
      return (
        <mesh rotation={[-0.9, 0, 0.08]}>
          <boxGeometry args={[0.7, 1.7, 0.03]} />
          <meshStandardMaterial color={PAPER_TONE} roughness={0.9} />
        </mesh>
      );
    case '/possibility': // a ticket with no name
    case '/odds':
      return (
        <mesh rotation={[-0.7, 0.2, 0.1]}>
          <boxGeometry args={[1.3, 0.6, 0.05]} />
          <Skin />
        </mesh>
      );
    case '/mutual': // two frames, facing away
      return (
        <group>
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.75, 1.0, 0.05]} />
            <Skin />
          </mesh>
          <mesh position={[0.4, 0, 0]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[0.75, 1.0, 0.05]} />
            <Skin />
          </mesh>
        </group>
      );
    case '/profile': // frosted glass
      return (
        <mesh rotation={[0, 0.3, 0]}>
          <boxGeometry args={[1.1, 1.3, 0.05]} />
          <meshStandardMaterial color={PAPER_TONE} transparent opacity={0.32} roughness={0.3} />
        </mesh>
      );
    case '/reel': // a strip of film
      return (
        <group rotation={[-0.5, 0.2, 0]}>
          {[-0.62, 0, 0.62].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.55, 0.75, 0.04]} />
              <Skin dark={x === 0} />
            </mesh>
          ))}
        </group>
      );
    case '/held': // (unused guard)
      return null;
    case '/next-wednesday': // a clock face
      return (
        <group rotation={[-0.6, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.75, 0.75, 0.1, 24]} />
            <Skin />
          </mesh>
          <mesh position={[0, 0.08, -0.25]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.02, 0.5]} />
            <Skin dark />
          </mesh>
        </group>
      );
    case '/start': // a hand of five cards, fanned
      return (
        <group>
          {[-2, -1, 0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.16, 0, i * 0.02]} rotation={[0, 0, i * -0.18]}>
              <boxGeometry args={[0.55, 0.85, 0.03]} />
              <Skin />
            </mesh>
          ))}
        </group>
      );
    default: // any future route: an honest paper card
      return (
        <mesh rotation={[-0.5, 0.2, 0]}>
          <boxGeometry args={[0.9, 1.1, 0.05]} />
          <Skin />
        </mesh>
      );
  }
}

/**
 * The shared material, fed by context: the Ring wraps each object in a
 * provider carrying its ring colour and its glow (active, visited, or idle),
 * and every primitive inside just asks for <Skin />. One material voice for
 * the whole desk; the shape alone says which page an object is.
 */
const SkinContext = createContext<{ tint: string; emissive: number }>({
  tint: PAPER_TONE,
  emissive: 0.15,
});

function Skin({ dark = false }: { dark?: boolean }) {
  const { tint, emissive } = useContext(SkinContext);
  return (
    <meshStandardMaterial
      color={dark ? INK : tint}
      emissive={dark ? INK : tint}
      emissiveIntensity={dark ? 0.05 : emissive}
      roughness={0.6}
    />
  );
}

function Ring({
  costs,
  active,
  visited,
  onPick,
  onOpen,
  reducedMotion,
}: {
  costs: Cost[];
  active: number;
  visited: ReadonlySet<string>;
  onPick: (i: number) => void;
  onOpen: (path: string) => void;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const holders = useRef<(THREE.Group | null)[]>([]);
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
      const holder = holders.current[i];
      if (!holder) return;

      // Overall scale is still cost. A page that talks more is physically
      // larger, which on this map is not a compliment.
      const base = 0.22 + (c.seconds / dearest) * 0.42;
      const wanted = i === active ? base * 1.45 : base;
      holder.scale.setScalar(holder.scale.x + (wanted - holder.scale.x) * Math.min(1, delta * 8));

      if (!reducedMotion) {
        holder.position.y = positions[i][1] + Math.sin(clock.current * 0.6 + i) * 0.045;
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
        <SkinContext.Provider
          key={c.surface.path}
          value={{
            tint: c.surface.kind === 'product' ? MINT : AMBER,
            emissive: i === active ? 0.8 : visited.has(c.surface.path) ? 0.42 : 0.14,
          }}
        >
          <group
            position={positions[i]}
            scale={0.22}
            ref={(g) => {
              holders.current[i] = g;
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              // Look first; a second click on the lit object walks into it.
              if (i === active) onOpen(c.surface.path);
              else onPick(i);
            }}
            onPointerOver={() => onPick(i)}
          >
            <ObjectFor path={c.surface.path} />
          </group>
        </SkinContext.Provider>
      ))}
    </group>
  );
}
