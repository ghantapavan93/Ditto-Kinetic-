import type { Metadata } from 'next';
import { ReelStage } from '@/components/reel/ReelStage';

export const metadata: Metadata = {
  title: 'THE FAST TOUR — every surface, about a second each',
  description:
    'The whole atlas as one live reel: real titles, real one-line theses, the site’s own photography. Hover holds it; a click dives in.',
};

/**
 * The answer to "nobody opens every page by hand": understand all of them
 * before opening any of them. Frames derive from the same list every other
 * door reads, so this tour cannot drift from the site it tours.
 */
export default function ReelPage() {
  return (
    <main>
      <ReelStage />
    </main>
  );
}
