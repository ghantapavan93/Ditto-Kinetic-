import type { Metadata } from 'next';
import { EndStage } from '@/components/end/EndStage';

export const metadata: Metadata = {
  title: 'WHAT KIND OF LIFE DO YOU WANT MORE OF?',
  description:
    'The same question the compiler opens with, asked once more at the end — with none of the machinery shown.',
};

/**
 * The last surface.
 *
 * It runs the real compiler and shows you none of it. Which is the argument of
 * the whole site performed rather than described: the compiler page spends a
 * minute proving nine stages exist, and this one, having nothing left to prove,
 * spends almost nothing.
 */
export default function EndPage() {
  return (
    <main>
      <EndStage />
    </main>
  );
}
