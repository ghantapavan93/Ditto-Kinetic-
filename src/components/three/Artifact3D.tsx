'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ARTIFACT_SCALE, artifactAspect, artifactTexture } from '@/lib/artifacts';
import { damp, lerp, seeded } from '@/lib/motion';
import type { SceneArtifact } from '@/lib/types';

type Props = {
  artifact: SceneArtifact;
  index: number;
  magnetism: number;
  locked: boolean;
  exiting: number;
  reducedMotion: boolean;
};

/**
 * A physical object on the stage.
 *
 * Artifacts arrive from slightly wrong positions and *settle into* their
 * authored placement in proportion to magnetism. In a weak scene they never
 * quite land: they hover a few degrees off, at the wrong depth, drifting. In
 * the winning scene they magnetise into a single flat composition — which is
 * the moment the stage stops looking like scattered objects and starts looking
 * like a poster.
 */
export function Artifact3D({ artifact, index, magnetism, locked, exiting, reducedMotion }: Props) {
  const mesh = useRef<THREE.Mesh>(null);

  const texture = useMemo(
    () => artifactTexture(artifact.kind, artifact.label),
    [artifact.kind, artifact.label],
  );

  const { scale, aspect, offset } = useMemo(() => {
    const rand = seeded(index * 7919 + artifact.kind.length * 131);
    const s = ARTIFACT_SCALE[artifact.kind];
    return {
      scale: s,
      aspect: artifactAspect(artifact.kind),
      // Where this object sits when nothing has settled.
      offset: {
        x: (rand() - 0.5) * 0.5,
        y: (rand() - 0.5) * 0.42,
        z: rand() * 0.4,
        rot: (rand() - 0.5) * 0.5,
        phase: rand() * Math.PI * 2,
      },
    };
  }, [artifact.kind, index]);

  useFrame((state, rawDelta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;
    const misfit = 1 - magnetism;

    const [ax, ay, az] = artifact.at;
    // World placement: authored position, blended toward a wrong one by misfit.
    const targetX = ax * 3.4 + offset.x * misfit;
    const targetY = ay * 2.0 + offset.y * misfit;
    const targetZ = az + offset.z * misfit - 0.35;

    const unrest = reducedMotion ? 0 : misfit * 0.05;
    const driftY = Math.sin(t * 0.7 + offset.phase) * unrest;
    const driftRot = Math.cos(t * 0.55 + offset.phase) * unrest * 0.6;

    const lambda = locked ? 8 : 3.6;
    m.position.x = damp(m.position.x, targetX, lambda, dt);
    m.position.y = damp(m.position.y, targetY + driftY + exiting * 2.6, lambda, dt);
    m.position.z = damp(m.position.z, targetZ, lambda, dt);
    m.rotation.z = damp(m.rotation.z, artifact.rotate + offset.rot * misfit + driftRot, lambda, dt);
    // Objects lie flatter to camera as the composition resolves.
    m.rotation.x = damp(m.rotation.x, misfit * 0.28, lambda, dt);

    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity = damp(mat.opacity, lerp(0.42, 1, magnetism) * (1 - exiting), 5, dt);

    const s = damp(m.scale.x, scale * lerp(0.92, 1, magnetism), lambda, dt);
    m.scale.set(s, s / aspect, 1);
  });

  return (
    <mesh ref={mesh} scale={[scale, scale / aspect, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
