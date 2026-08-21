import type { Metadata } from 'next';
import { AttentionStage } from '@/components/attention/AttentionStage';

export const metadata: Metadata = {
  title: 'THE BILL — what this site costs to look at',
  description:
    'A product whose purpose is to get you off it cannot count time spent as a win. Every surface counted from its own source, priced in seconds.',
};

/**
 * The instrument, pointed at itself.
 *
 * Auditing somebody else's attention cost while exempting your own would be
 * worth nothing, so the population measured here is this repository. The
 * numbers are unflattering on purpose.
 */
export default function AttentionPage() {
  return (
    <main>
      <AttentionStage />
    </main>
  );
}
