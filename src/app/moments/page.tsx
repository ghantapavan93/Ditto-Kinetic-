import type { Metadata } from 'next';
import { MomentsStage } from '@/components/moments/MomentsStage';

export const metadata: Metadata = {
  title: 'MOMENTS — none of this happened on a feed',
  description:
    'The world the argument is for: synthetic evenings, empty rooms waiting, a week of frames — cut like a film rather than laid out like a grid.',
};

/**
 * The one surface that just shows the world. Synthetic photography of
 * synthetic people, the disclosure never leaving the screen, edited to the
 * pacing the rest of the site keeps arguing for: slow, slow, quiet, one line.
 */
export default function MomentsPage() {
  return (
    <main>
      <MomentsStage />
    </main>
  );
}
