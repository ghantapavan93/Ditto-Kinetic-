import type { Metadata } from 'next';
import { ThreadStage } from '@/components/thread/ThreadStage';

export const metadata: Metadata = {
  title: 'THE THREAD — no app, just a thread',
  description:
    'Everything else here is the machinery. This is what a person would actually get: a handful of messages over nine days, one of which opens into all of it, and then silence.',
};

/**
 * The inversion.
 *
 * Ditto has publicly signalled a move toward something message-native. Taken at
 * face value that does not shrink this project -- it turns it inside out. The
 * apparatus stops being the product and becomes what sits underneath one.
 */
export default function ThreadPage() {
  return (
    <main>
      <ThreadStage />
    </main>
  );
}
