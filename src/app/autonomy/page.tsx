import type { Metadata } from 'next';
import { AutonomyStage } from '@/components/autonomy/AutonomyStage';

export const metadata: Metadata = {
  title: 'AUTONOMY IS A TRADE — six rungs, and the one not to climb',
  description:
    'Every rung buys back time by removing a decision. The last one removes no decisions at all — only the asking.',
};

/**
 * The closing argument.
 *
 * Autonomy is how you lower the attention bill, which makes this the other half
 * of the page next door. The finding is that the top rung transfers nothing the
 * one below it had not already transferred, and is still the cheapest thing
 * here on both attention measures — which is precisely why attention cannot be
 * the only number.
 */
export default function AutonomyPage() {
  return (
    <main>
      <AutonomyStage />
    </main>
  );
}
