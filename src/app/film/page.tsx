import type { Metadata } from 'next';
import { FilmStage } from '@/components/film/FilmStage';

export const metadata: Metadata = {
  title: 'THE FILM — right person, wrong first date, in under a minute',
  description:
    'The FIRST SCENE film: nine shots, one idea. Keep the people, move the world — then the interface leaves. Below it, the cut: every source shot on the editing table.',
  openGraph: {
    // The link should unfurl as a film, not a page: poster frame plus a
    // playable video where the platform supports one. metadataBase in the
    // root layout makes these absolute against the deployment host.
    images: [{ url: '/film/exports/poster.webp', width: 1600, height: 900 }],
    videos: [
      {
        url: '/film/exports/first-scene-film.mp4',
        width: 1920,
        height: 1080,
        type: 'video/mp4',
      },
    ],
  },
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
