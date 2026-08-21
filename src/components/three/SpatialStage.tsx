'use client';

/* eslint-disable react-hooks/immutability -- 
 * React Compiler's immutability rule assumes a declarative tree. react-three-fiber
 * is the opposite by design: `useFrame` runs once per rendered frame and mutates
 * the live scene graph in place — camera position, geometry attributes, material
 * uniforms. Allocating new objects here instead would produce garbage every frame
 * at 60-120Hz, which is precisely what the imperative loop exists to avoid.
 * Scoped to files that own frame callbacks; the React tree elsewhere is unaffected.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Polaroid3D } from './Polaroid3D';
import { ConnectionField } from './ConnectionField';
import { Artifact3D } from './Artifact3D';
import { PossibilityCloud } from './PossibilityCloud';
import { SceneLighting } from './SceneLighting';
import { StageProbe } from './StageProbe';
import { ReasonField } from './ReasonField';
import { damp, lerp, spring, type Spring } from '@/lib/motion';
import { track } from '@/lib/analytics';
import type { Fragment, MatchPair, Scene } from '@/lib/types';

import { INK, INK_SHADOW } from '@/lib/palette';
type StageProps = {
  pair: MatchPair;
  scene: Scene;
  magnetism: number;
  locked: boolean;
  exiting: number;
  reducedMotion: boolean;
  /** Earlier / as planned / later. Changes the light, not the room. */
  timeShift?: -1 | 0 | 1;
  /** 0..1 across the first fifteen minutes. */
  intimacy?: number;
  /** 0 on stage, 1 receded during a pair swap. */
  swap?: number;
  /** 0 closed, 1 fanned into every version of the night. */
  cloud?: number;
};

/**
 * Authored camera. No orbit controls — the user never gets to fly the scene,
 * because a badly framed shot would break every composition in the product.
 * All they get is a few degrees of pointer parallax, which is enough to make
 * the stage read as a space rather than a picture.
 */
function CameraRig({ magnetism, exiting, reducedMotion }: { magnetism: number; exiting: number; reducedMotion: boolean }) {
  const { camera, pointer } = useThree();

  /**
   * Pointer parallax runs on springs rather than exponential damping.
   *
   * `damp()` has no velocity — it decelerates into the target from the first
   * frame, so a camera driven by it tracks the mouse instead of being carried
   * by it. A critically damped spring gives the move mass: it lags into motion,
   * carries through, and settles. That difference is small on a still frame and
   * is most of what separates a stage that feels authored from one that feels
   * wired up.
   *
   * Depth stays on `damp` deliberately — the dolly is a framing decision, not a
   * physical object, and it should not overshoot or coast.
   */
  const px = useRef<Spring>({ x: 0, v: 0 });
  const py = useRef<Spring>({ x: 0, v: 0 });

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const strength = reducedMotion ? 0 : 1;

    // A weak scene sits the camera slightly further back and off-axis; the
    // winning scene squares up to it. The framing itself gets more resolved.
    const baseZ = lerp(7.4, 6.6, magnetism) + exiting * 1.6;
    const tilt = (1 - magnetism) * 0.06 * strength;

    camera.position.x = spring(px.current, pointer.x * 0.42 * strength + tilt, 3.6, dt);
    camera.position.y = spring(py.current, pointer.y * 0.18 * strength - tilt * 0.5, 3.6, dt);
    camera.position.z = damp(camera.position.z, baseZ, 2.6, dt);

    camera.lookAt(0, exiting * 0.6, 0);
  });

  return null;
}

function StageContents({ pair, scene, magnetism, locked, exiting, reducedMotion, timeShift = 0, intimacy = 0, swap = 0, cloud = 0, onFragment }: StageProps & { onFragment: (f: Fragment | null) => void }) {
  // Hovering a `spark` fragment warms the paper. It is the one purely
  // affectionate thing on the stage and it is deliberately tiny.
  const [blush, setBlush] = useState(false);

  const handleFragment = (fragment: Fragment | null) => {
    setBlush(fragment?.kind === 'spark');
    onFragment(fragment);
  };

  return (
    <>
      <fog attach="fog" args={[INK_SHADOW, 8, 20]} />
      <SceneLighting mood={scene.mood} locked={locked} timeShift={timeShift} />
      {process.env.NODE_ENV !== 'production' && <StageProbe magnetism={magnetism} />}
      <CameraRig magnetism={magnetism} exiting={exiting} reducedMotion={reducedMotion} />

      <ConnectionField
        magnetism={magnetism}
        locked={locked}
        exiting={exiting}
        reducedMotion={reducedMotion}
      />

      <Polaroid3D
        person={pair.personA}
        side={-1}
        magnetism={magnetism}
        locked={locked}
        exiting={exiting}
        reducedMotion={reducedMotion}
        blush={blush}
        intimacy={intimacy}
        swap={swap}
      />
      <Polaroid3D
        person={pair.personB}
        side={1}
        magnetism={magnetism}
        locked={locked}
        exiting={exiting}
        reducedMotion={reducedMotion}
        blush={blush}
        intimacy={intimacy}
        swap={swap}
      />

      <PossibilityCloud pair={pair} scene={scene} open={cloud} reducedMotion={reducedMotion} />

      <ReasonField
        pair={pair}
        magnetism={magnetism}
        locked={locked}
        exiting={exiting}
        reducedMotion={reducedMotion}
        onHover={handleFragment}
      />

      {/*
        Artifacts are keyed by scene so switching scenes genuinely swaps the
        objects rather than morphing one set into another. Remounting is correct
        here: a ticket is not a cup in a different position.
      */}
      {scene.artifacts.map((artifact, i) => (
        <Artifact3D
          key={`${scene.id}-${artifact.kind}-${i}`}
          artifact={artifact}
          index={i}
          magnetism={magnetism}
          locked={locked}
          exiting={exiting}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}

/** Rendered instead of the canvas when WebGL is unavailable or has failed. */
function FlatFallback({ pair, scene }: { pair: MatchPair; scene: Scene }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-gutter">
      <div className="flex w-full max-w-3xl items-center justify-center gap-6 sm:gap-12">
        {[pair.personA, pair.personB].map((person) => (
          <div
            key={person.id}
            className="u-paper w-[38%] max-w-[190px] rounded-artifact p-2 pb-8"
            style={{ transform: `rotate(${person.id === pair.personA.id ? -2.5 : 2}deg)` }}
          >
            <div
              className="aspect-[4/5] w-full"
              style={{
                background: `radial-gradient(120% 90% at 30% 20%, ${person.portraitTint[0]}55, #12151E 60%, #05060A)`,
              }}
            />
            <p className="mt-2 text-center font-mono text-micro uppercase text-ink/60">{person.name}</p>
          </div>
        ))}
      </div>
      <p className="u-micro absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {scene.label} · {scene.time} · flat mode
      </p>
    </div>
  );
}

export function SpatialStage(props: StageProps & { onFragment?: (f: Fragment | null) => void }) {
  const [failed, setFailed] = useState(false);

  /**
   * R3F sizes the canvas from a ResizeObserver and does not start its render
   * loop until it has non-zero dimensions. If that first measurement never
   * arrives — the page initialised in a background tab, a hidden container, or
   * behind a slow paint — the canvas stays at its intrinsic 300x150, no frame
   * ever renders, and there is no recovery path: the stage is simply black
   * forever.
   *
   * This was not theoretical. It happened twice while building this, and both
   * times it looked like a rendering bug rather than a measurement one.
   *
   * Nudging the observer on mount and whenever the document becomes visible
   * costs nothing and closes the hole.
   */
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event('resize'));
    // Both, deliberately: rAF catches the common case on the next paint, and
    // the timer still fires in a backgrounded tab where rAF is suspended.
    const raf = requestAnimationFrame(nudge);
    const timer = setTimeout(nudge, 0);
    const onVisible = () => {
      if (!document.hidden) nudge();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', nudge);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', nudge);
    };
  }, []);

  if (failed) return <FlatFallback pair={props.pair} scene={props.scene} />;

  return (
    <Canvas
      className="u-drag-none"
      // Capped device pixel ratio: above ~1.5 the film grain and paper texture
      // stop reading better and start costing frames on laptop GPUs.
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ fov: 32, position: [0, 0, 7.4], near: 0.1, far: 40 }}
      // Default measure debounce is 250ms; the stage is the whole page, so
      // paying that on first paint is not worth it.
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      onCreated={({ gl }) => {
        gl.setClearColor(INK, 0);

        /*
         * Context loss, heard from the canvas itself.
         *
         * This used to rely on `onError` on <Canvas>. R3F forwards unknown
         * props to the wrapper <div>, and React's DOM `onError` only fires for
         * media elements -- never for a div -- so it could not fire, and
         * `FlatFallback` was unreachable on any real GPU failure. The flat
         * version was written, tested by eye, and then never reachable.
         *
         * `webglcontextlost` is the event that actually happens when a driver
         * resets or a laptop switches GPUs, and it comes from the canvas.
         */
        const canvas = gl.domElement;
        const onLost = (event: Event) => {
          event.preventDefault();
          track('webgl_unavailable');
          setFailed(true);
        };
        canvas.addEventListener('webglcontextlost', onLost);
      }}
      // Frameloop stays 'always' — the idle drift and settling motion are part
      // of how a weak scene communicates that it has not resolved.
      frameloop="always"
    >
      <Suspense fallback={null}>
        <StageContents {...props} onFragment={props.onFragment ?? (() => {})} />
      </Suspense>
    </Canvas>
  );
}
