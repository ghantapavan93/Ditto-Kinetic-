import type { Metadata } from 'next';
import { StartStage } from '@/components/start/StartStage';

export const metadata: Metadata = {
  title: 'START HERE — five ways into this',
  description:
    'A concept build for Ditto, on one line: the right person can still get the wrong first date. Every surface reachable, five recommended ways in, and what each one does not prove.',
};

/**
 * The front door, built last -- which is the usual order and still the wrong one.
 *
 * Everything was reachable and nothing was recommended, so a visitor with four
 * minutes admired the stage and never found the two screens that would have
 * convinced them.
 */
export default function StartPage() {
  return (
    <main>
      <StartStage />
    </main>
  );
}
