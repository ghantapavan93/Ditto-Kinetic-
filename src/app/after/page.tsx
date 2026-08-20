import type { Metadata } from 'next';
import { AfterStage } from '@/components/after/AfterStage';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

export const metadata: Metadata = {
  title: 'AFTER — 12:14 AM',
  description:
    'The date already happened. This is the only surface where the system is allowed to change its mind.',
};

/**
 * The third surface, and the one that closes the loop.
 *
 * `/wednesday` is the match arriving. `/` is choosing the room. `/after` is the
 * only place the system revises what it believes — which is what makes the
 * other two more than a one-week demo.
 */
export default function AfterPage() {
  return (
    <main>
      <AfterStage />

      <noscript>
        <div className="fixed inset-0 overflow-y-auto bg-ink p-gutter">
          <h1 className="font-voice text-display text-paper">so… how was it?</h1>
          <p className="mt-4 max-w-[46ch] font-voice text-lede text-paper/70">
            After the date, Ditto asks for one messy sentence rather than a rating, marks the
            parts that carry signal, and revises what it believes — crossing the old belief out
            rather than deleting it. It needs JavaScript to run.
          </p>
          <PrototypeDisclosure className="mt-10" />
        </div>
      </noscript>
    </main>
  );
}
