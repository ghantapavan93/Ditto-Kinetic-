import type { Metadata } from 'next';
import { PossibilityStage } from '@/components/possibility/PossibilityStage';

export const metadata: Metadata = {
  title: 'POSSIBILITY — somewhere in your life, an opening just appeared',
  description:
    'One sentence reorganises the space around a person. Possibilities are artifacts with times on them, and nobody develops into a photograph until an evening clears the bar.',
};

/**
 * Act II. The layer between a sentence and a first scene.
 *
 * Unlocked possibilities carry no person data at all — the type cannot leak
 * what it does not hold. The lock is the send bar, and the handoff lands on
 * the same stage the rest of the site already trusts.
 */
export default function PossibilityPage() {
  return (
    <main>
      <PossibilityStage />
    </main>
  );
}
