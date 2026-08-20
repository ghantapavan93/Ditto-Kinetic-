import type { Metadata } from 'next';
import { DropStage } from '@/components/drop/DropStage';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

export const metadata: Metadata = {
  title: 'THE DROP — Wednesday, 7:00 PM',
  description:
    'Ditto delivers one match a week, at 7pm on Wednesday. This is the hour before it lands.',
};

/**
 * The second surface.
 *
 * Ditto's product has one ritual and it is unusually strong: preferences close
 * Tuesday at 11:59, and at 7pm on Wednesday exactly one match arrives. That is a
 * genuinely rare thing to own — a weekly appointment that a whole campus keeps —
 * and right now it has no visual form at all. It happens in a text message.
 *
 * So this page is the hour before. Not a countdown widget: the wait is the
 * product here, and scarcity is the mechanism that makes one match feel like a
 * decision rather than a suggestion.
 *
 * It ends by handing off to `/`, because the drop is only the beginning of the
 * question this project is actually about — the match arrives, and then somebody
 * still has to choose the room.
 */
export default function WednesdayPage() {
  return (
    <main>
      <DropStage />

      <noscript>
        <div className="fixed inset-0 overflow-y-auto bg-ink p-gutter">
          <h1 className="font-display text-display uppercase text-paper">
            wednesday, 7:00 pm.
          </h1>
          <p className="mt-4 max-w-[46ch] font-voice text-lede text-paper/70">
            One match a week, delivered at the same hour. This page is the wait — it needs
            JavaScript to run.
          </p>
          <PrototypeDisclosure className="mt-10" />
        </div>
      </noscript>
    </main>
  );
}
