import type { Metadata } from 'next';
import { WeatherStage } from '@/components/weather/WeatherStage';

export const metadata: Metadata = {
  title: 'SOCIAL WEATHER — a full campus with nothing in it',
  description:
    'How much of a population is actually available to each other, night by night. Every figure counted across 96 people and 4,560 pairs.',
};

/**
 * The world, changing.
 *
 * Matching treats the world as a database that happens to get queried on a
 * Wednesday. It is a world, and on some Wednesdays there is nothing in it — a
 * fact no figure in a matching system currently looks at.
 */
export default function WeatherPage() {
  return (
    <main>
      <WeatherStage />
    </main>
  );
}
