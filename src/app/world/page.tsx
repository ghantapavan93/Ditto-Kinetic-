import type { Metadata } from 'next';
import { WorldStage } from '@/components/world/WorldStage';

export const metadata: Metadata = {
  title: 'THE WORLD — eight campuses, and what scale actually buys',
  description:
    'Ditto grows one school at a time, and every new school is supposed to make matching better for everyone already on. Price the trip and eight times the people buys nothing like eight times the options.',
};

/**
 * The scale above the campus.
 *
 * /network is one school. This is every school, and it exists to contradict the
 * most natural assumption about expansion with a number that survives having
 * its own assumptions re-rolled three hundred times.
 */
export default function WorldPage() {
  return (
    <main>
      <WorldStage />
    </main>
  );
}
