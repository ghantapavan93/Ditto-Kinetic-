import type { Metadata } from 'next';
import { FilmStage } from '@/components/film/FilmStage';

export const metadata: Metadata = {
  title: 'THE FILM — right person, wrong first date, in under a minute',
  description:
    'The FIRST SCENE film: nine shots, one idea. Keep the people, move the world — then the interface leaves. Below it, the cut: every source shot on the editing table.',
};

/**
 * The cinematic entrance to the same system every other door opens. The film
 * exists to make the interactive stage more desirable — it always ends by
 * pointing back into the product.
 */
export default function FilmPage() {
  return (
    <main>
      <FilmStage />
    </main>
  );
}
