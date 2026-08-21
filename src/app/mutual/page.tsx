import type { Metadata } from 'next';
import { MutualStage } from '@/components/mutual/MutualStage';

export const metadata: Metadata = {
  title: 'MUTUALITY — one of them wanting it isn\u2019t enough',
  description:
    'The engine scored every room once and called it the pair\u2019s. Nine of its ten weighted terms are things two people feel separately. Scored from both sides, an introduction is only as good as the person who wants it less.',
};

/**
 * The two-sided correction.
 *
 * Not a new dimension and not a new engine -- the same ten weighted terms, re-weighted
 * per person from what each of them actually said, and combined with min rather
 * than mean. The page reports honestly that on this data it moved no decision.
 */
export default function MutualPage() {
  return (
    <main>
      <MutualStage />
    </main>
  );
}
