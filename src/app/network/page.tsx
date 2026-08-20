import type { Metadata } from 'next';
import { NetworkStage } from '@/components/network/NetworkStage';

export const metadata: Metadata = {
  title: 'THE MISSING EDGE — one campus, and the introduction nobody can make',
  description:
    'A synthetic campus of 96 people. Rank the same candidates by who would get on, then by what would change, and watch the answer move.',
};

/**
 * The world layer.
 *
 * Every unbuilt idea in this project traced back to the same absence: there was
 * no network. This is it — a generated population with clusters, weak ties and
 * isolates, and the one question a pair can never answer, which is what an
 * introduction is worth to everybody else.
 */
export default function NetworkPage() {
  return (
    <main>
      <NetworkStage />
    </main>
  );
}
