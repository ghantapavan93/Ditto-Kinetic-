import type { Metadata } from 'next';
import { NextWednesday } from '@/components/after/NextWednesday';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

export const metadata: Metadata = {
  title: 'NEXT WEDNESDAY — +7 days',
  description:
    'The same six rooms, a new pair, and one term weighted differently because of last week.',
};

/**
 * The fourth surface, and the one that makes the third one mean anything.
 *
 * A learning loop that never visibly changes an outcome is a claim, not a loop.
 * This page runs the same six rooms for a new pair on last week's weights and
 * this week's, and shows both answers — so "the system learned" can be checked
 * rather than believed.
 */
export default function NextWednesdayPage() {
  return (
    <main>
      <NextWednesday />

      <noscript>
        <div className="fixed inset-0 overflow-y-auto bg-ink p-gutter">
          <h1 className="font-display text-display uppercase text-paper">+ 7 days</h1>
          <p className="mt-4 max-w-[46ch] font-voice text-lede text-paper/70">
            The same six rooms, a new pair, and one term weighted differently because of what
            last week suggested. It needs JavaScript to run.
          </p>
          <PrototypeDisclosure className="mt-10" />
        </div>
      </noscript>
    </main>
  );
}
