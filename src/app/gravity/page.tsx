import type { Metadata } from 'next';
import { GravityStage } from '@/components/gravity/GravityStage';

export const metadata: Metadata = {
  title: 'CONNECTION GRAVITY — ten forces, no numbers',
  description:
    'The ten weighted terms as forces between two bodies. Break the week and watch them drift; find the right room and watch them hold.',
};

/**
 * The model, without a single figure on screen.
 *
 * The resting gap is the utility rescaled, which is a bijection and not a
 * discovery. What the physics adds is the transition, which force is doing the
 * work, and whether an equilibrium is calm or contested — the last of which a
 * score structurally cannot carry.
 */
export default function GravityPage() {
  return (
    <main>
      <GravityStage />
    </main>
  );
}
