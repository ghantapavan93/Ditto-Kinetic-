import type { Metadata } from 'next';
import { OddsStage } from '@/components/odds/OddsStage';

export const metadata: Metadata = {
  title: 'THE ODDS — a number you can argue with',
  description:
    'A personalised probability, decomposed. And what a guaranteed match would actually cost the person who paid for it.',
};

/**
 * The last step of onboarding, rebuilt.
 *
 * The mechanic is kept because the instinct behind it is right: a computed
 * personal number is a better thing to show somebody than a progress bar. What
 * changes is that the number is decomposed, and that the lever refuses — one
 * match each per Wednesday is a closed system, so certainty for one person is
 * another person's evening spent without being asked.
 */
export default function OddsPage() {
  return (
    <main>
      <OddsStage />
    </main>
  );
}
