'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATIONS, aspectOf, stationOpacity, visionCameraAt } from '@/lib/vision';
import { buildCampus } from '@/lib/campus';

/**
 * Five stations, one flight.
 *
 * Every station reuses the visual language its act already established — the
 * polaroid, the constellation, the possibility artifacts, the cold-to-warm
 * population — so the future reads as a continuation of the site rather than
 * a trailer bolted onto it.
 *
 * The photography flies IN the scene, not behind it: real frames as textured
 * planes at station depth, aspect ratios taken from the generated manifest so
 * nothing distorts, mounted on paper the way every photograph on this site has
 * been. Station content fades by camera distance — level-of-detail, exactly as
 * the zoom established, never a scene swap.
 *
 * Text stays in the DOM overlay, as everywhere: canvas text is unselectable,
 * untranslatable, and invisible to a screen reader.
 */

const PAPER = '#D8C7AE';

/**
 * One texture per slug, for the life of the session — the same cache pattern
 * `portraitTexture` set. A per-mount `new TextureLoader().load()` is not
 * tracked by R3F's auto-disposal (only JSX-declared objects are), so every
 * visit to this page would decode and keep another copy of all ten frames.
 * Loading here also keeps the colour-space mutation at creation time, where
 * the compiler is happy with it.
 */
/**
 * One sphere for every node in every miniature campus.
 *
 * Four MiniCampus mounts x 96 people meant ~384 identical SphereGeometry
 * allocations for a shape that is the same every time. The sibling scenes all
 * share a module-scope dot; this one now does too.
 */
const DOT = new THREE.SphereGeometry(0.055, 8, 8);

const TEXTURES = new Map<string, THREE.Texture>();
function photoTexture(slug: string): THREE.Texture {
  const hit = TEXTURES.get(slug);
  if (hit) return hit;
  const t = new THREE.TextureLoader().load(`/photos/${slug}.webp`);
  t.colorSpace = THREE.SRGBColorSpace;
  TEXTURES.set(slug, t);
  return t;
}

function PhotoPlane({
  slug,
  position,
  rotation,
  height = 1.5,
}: {
  slug: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) {
  const texture = photoTexture(slug);

  const aspect = aspectOf(slug);
  const w = height * aspect;

  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      {/* a soft dark backing, offset down-left — the cheapest honest depth cue
          there is. unlit planes read as stickers without it. */}
      <mesh position={[-0.09, -0.15, -0.03]}>
        <planeGeometry args={[w + 0.3, height + 0.45]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* the paper the photograph sits on — same object language as the stage */}
      <mesh position={[0, -0.06, -0.005]}>
        <planeGeometry args={[w + 0.12, height + 0.3]} />
        <meshBasicMaterial color={PAPER} transparent opacity={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The campus, in miniature — the same generated population, scaled to sit on a table. */
function MiniCampus({ scale = 0.34, cold = false }: { scale?: number; cold?: boolean }) {
  const campus = useMemo(() => buildCampus(), []);

  const lines = useMemo(() => {
    const out: number[] = [];
    for (const e of campus.edges) {
      const A = campus.nodes[e.a].at;
      const B = campus.nodes[e.b].at;
      out.push(A[0], A[1], A[2], B[0], B[1], B[2]);
    }
    return new Float32Array(out);
  }, [campus]);

  return (
    <group scale={scale}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={cold ? '#4A6C8C' : '#F4EDE4'}
          transparent
          opacity={cold ? 0.14 : 0.1}
        />
      </lineSegments>
      {campus.nodes.map((n) => (
        <mesh key={n.id} position={n.at} geometry={DOT}>
          <meshBasicMaterial
            color={n.known ? '#E8913C' : cold ? '#4A6C8C' : '#F4EDE4'}
            transparent
            opacity={n.known ? 0.9 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

/** The possibility artifacts, orbiting slowly — the intersection made physical. */
function Artifacts() {
  const group = useRef<THREE.Group>(null);
  const shapes = useMemo(
    () =>
      [
        { w: 0.5, h: 0.24, tint: '#E8913C' }, // ticket
        { w: 0.26, h: 0.48, tint: '#F4EDE4' }, // receipt
        { w: 0.34, h: 0.42, tint: '#8A6CC8' }, // book
        { w: 0.48, h: 0.28, tint: '#2FD8A8' }, // route
        { w: 0.32, h: 0.32, tint: '#FFB865' }, // table light
      ] as const,
    [],
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += Math.min(delta, 1 / 30) * 0.16;
  });

  return (
    <group ref={group}>
      {shapes.map((s, i) => {
        const angle = (i / shapes.length) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.5, Math.sin(angle * 2) * 0.3, Math.sin(angle) * 1.5]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          >
            <planeGeometry args={[s.w, s.h]} />
            <meshBasicMaterial color={s.tint} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Station key -> the colour its practical light burns at. The flight cools
 *  as it goes: amber tonight, paper on campus, mint at the meeting, a cold
 *  blue over the city, and nothing at all in the quiet. */
const STATION_LIGHT: Record<string, string | null> = {
  tonight: '#FFB865',
  campus: '#F4EDE4',
  meeting: '#2FD8A8',
  city: '#4A6C8C',
  quiet: null,
};

/**
 * Dust along the whole corridor.
 *
 * Seven hundred points with size attenuation is the cheapest way to make
 * eighty units of empty space read as SPACE — every camera move gets parallax
 * from hundreds of depth cues at once. Deterministic positions, same rule as
 * every scatter on this site.
 */
function Dust() {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    let h = 987654321 >>> 0;
    const rand = () => {
      h += 0x6d2b79f5;
      let x = h;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    const out = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      out[i * 3] = (rand() - 0.5) * 14;
      out[i * 3 + 1] = (rand() - 0.5) * 7;
      out[i * 3 + 2] = 4 - rand() * 68;
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.z += Math.min(delta, 1 / 30) * 0.004;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#E8D9C4"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * The road ahead, as faint breadcrumbs sampled off the real camera path —
 * so the flight you are about to take is visible in the world before you
 * take it, and it is provably the same path, because it is computed from
 * the same function the claims sample.
 */
function Breadcrumbs() {
  const positions = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 60; i++) {
      const shot = visionCameraAt(i / 60);
      out.push(shot.target[0], shot.target[1] - 0.9, shot.target[2]);
    }
    return new Float32Array(out);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#E8913C"
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </points>
  );
}

function Flight({
  t,
  pointer,
  reducedMotion,
}: {
  t: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);

  useFrame(({ camera }, delta) => {
    clock.current += Math.min(delta, 1 / 30);

    const shot = visionCameraAt(t);

    // A few degrees of pointer parallax and a slow breath. Enough to make the
    // dust and the shadows work; never enough to hand over the framing.
    const sway = reducedMotion ? 0 : Math.sin(clock.current * 0.35) * 0.06;
    const px = reducedMotion ? 0 : pointer.x * 0.32;
    const py = reducedMotion ? 0 : pointer.y * 0.18;

    camera.position.set(shot.eye[0] + px + sway, shot.eye[1] - py, shot.eye[2]);
    camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);

    STATIONS.forEach((_, i) => {
      const g = groups.current[i];
      if (!g) return;
      const o = stationOpacity(t, i);
      g.visible = o > 0.01;
      // Nothing below an invisible group needs touching. Without this, four
      // out of five stations -- hundreds of meshes -- had their materials
      // rewritten every frame to set an opacity nobody could see.
      if (!g.visible) return;
      if (!reducedMotion) g.position.y = STATIONS[i].at[1] + Math.sin(clock.current * 0.4 + i * 2) * 0.04;
      g.traverse((obj) => {
        const m = (obj as THREE.Mesh).material as THREE.Material | undefined;
        if (m && 'opacity' in m && obj.userData.base === undefined) {
          obj.userData.base = (m as THREE.MeshBasicMaterial).opacity;
        }
        if (m && 'opacity' in m) {
          (m as THREE.MeshBasicMaterial).opacity = (obj.userData.base ?? 1) * o;
        }
      });
    });
  });

  return (
    <>
      <Dust />
      <Breadcrumbs />
      {STATIONS.map((s, i) => (
        <group
          key={s.key}
          position={s.at}
          ref={(g) => {
            groups.current[i] = g;
          }}
        >
          {s.key === 'tonight' && (
            <>
              <PhotoPlane slug="coffee-date" position={[-1.1, 0.1, 0]} rotation={[0, 0.2, -0.02]} />
              <PhotoPlane slug="twilight-stroll" position={[1.15, -0.15, -0.5]} rotation={[0, -0.24, 0.03]} height={1.3} />
              <pointLight position={[0, 0.8, 1.4]} intensity={2.2} color="#FFB865" distance={7} />
            </>
          )}

          {s.key === 'campus' && (
            <>
              <MiniCampus />
              <PhotoPlane slug="study-picnic" position={[-2.1, 0.3, 0.6]} rotation={[0, 0.35, 0]} height={1.15} />
              <PhotoPlane slug="photo-grid" position={[2.2, -0.2, 0.2]} rotation={[0, -0.35, 0]} height={1.15} />
            </>
          )}

          {s.key === 'meeting' && (
            <>
              <Artifacts />
              <PhotoPlane slug="bookstore-reading" position={[-2.15, 0.15, 0.4]} rotation={[0, 0.3, 0]} height={1.25} />
              <PhotoPlane slug="moodboard" position={[2.2, -0.1, 0.1]} rotation={[0, -0.32, 0]} height={1.2} />
            </>
          )}

          {s.key === 'city' && (
            <>
              {/* the same population three times over, colder — after campus */}
              <group position={[0, -0.2, -1]}>
                <MiniCampus scale={0.5} cold />
              </group>
              <group position={[-2.4, 0.6, -3]} rotation={[0, 0.7, 0]}>
                <MiniCampus scale={0.4} cold />
              </group>
              <group position={[2.6, -0.4, -4]} rotation={[0, -0.6, 0]}>
                <MiniCampus scale={0.45} cold />
              </group>
              <PhotoPlane slug="neon-tacos" position={[-2.3, 0.2, 0.8]} rotation={[0, 0.35, 0]} height={1.25} />
              <PhotoPlane slug="neon-downtown" position={[2.3, 0.35, 0.4]} rotation={[0, -0.3, 0]} height={1.25} />
              <PhotoPlane slug="bridgeside" position={[-1.1, -0.75, -0.9]} rotation={[0, 0.16, -0.02]} height={1.05} />
              <PhotoPlane slug="stadium-night" position={[1.2, -0.8, -1.4]} rotation={[0, -0.18, 0.02]} height={1.05} />
            </>
          )}

          {s.key === 'quiet' && (
            <mesh>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#F4EDE4" transparent opacity={0.7} />
            </mesh>
          )}

          {/* every station burns its own colour, and the quiet burns nothing */}
          {STATION_LIGHT[s.key] && s.key !== 'tonight' && (
            <pointLight
              position={[0, 1.1, 1.6]}
              intensity={1.5}
              color={STATION_LIGHT[s.key]!}
              distance={8}
            />
          )}
        </group>
      ))}
    </>
  );
}

export function VisionScene({
  t,
  pointer,
  reducedMotion,
}: {
  t: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.55, 4.6], fov: 44, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true }}
      resize={{ debounce: { resize: 0, scroll: 0 } }}
    >
      <color attach="background" args={['#0B0907']} />
      <fog attach="fog" args={['#0B0907', 9, 26]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={0.6} color="#FFD9A8" />

      <Flight t={t} pointer={pointer} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
