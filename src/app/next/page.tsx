import type { Metadata } from 'next';
import { NextStage } from '@/components/next/NextStage';

export const metadata: Metadata = {
  title: 'WHAT WOULD HAVE TO BE TRUE — the bet, the order, and how it loses',
  description:
    'Not another surface. The size of the bet as a number, what to ship first because it is cheapest, and the four observations that would end the argument.',
};

/**
 * The last page, and deliberately not another demonstration.
 *
 * Everything before this argues. This one says what would have to be measured
 * for the argument to be worth anything, in what order you would find out, and
 * the specific observations that would kill it.
 */
export default function NextPage() {
  return (
    <main>
      <NextStage />
    </main>
  );
}
