import type { Metadata } from 'next';
import { CompilerStage } from '@/components/compiler/CompilerStage';

export const metadata: Metadata = {
  title: 'THE COMPILER — one sentence in, one evening out',
  description:
    'Not a filter. One messy human sentence, compiled through nine stages into a person, an hour, a room and a way of first meeting.',
};

/**
 * The connective layer.
 *
 * Every other route here answers a question somebody already knew how to ask.
 * This takes the input people actually arrive with and compiles it, using the
 * machinery the rest of the site has already had to prove.
 */
export default function CompilerPage() {
  return (
    <main>
      <CompilerStage />
    </main>
  );
}
