import type { Metadata } from 'next';
import { EndingStage } from '@/components/ending/EndingStage';

export const metadata: Metadata = {
  title: 'HOW IT ENDS — the twelfth dimension, and why it stays out of the model',
  description:
    'They pick who, when and where. Nobody picks how it ends. A proposed twelfth dimension, applied — and the honest report that it reorders nothing.',
};

/**
 * A dimension that had to earn its place and did not.
 *
 * The ending is a real property of a room and the scorer has no term for it, so
 * this proposes one, applies it, and reports that the ranking does not move.
 * That is the result. What it exposes instead is a single wide disagreement
 * between how well a room suits two people and how easy it is to leave — which
 * turns out to be a thing you say, not a thing you score.
 */
export default function EndingPage() {
  return (
    <main>
      <EndingStage />
    </main>
  );
}
