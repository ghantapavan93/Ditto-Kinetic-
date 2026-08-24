import { StageLoader } from '@/components/stage/StageLoader';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

export default function Page() {
  return (
    <main>
      {/*
        The opening film starts fetching with the HTML, not with the client
        bundle. React hoists these into <head>; by the time the stage mounts
        and the <video> asks for bytes, the poster is painted and the first
        seconds are already in cache — the cold open never shows a spinner.
      */}
      <link rel="preload" href="/film/exports/intro-first.webp" as="image" />
      <link rel="preload" href="/film/exports/intro.mp4" as="video" type="video/mp4" />

      <StageLoader />

      <noscript>
        <div className="fixed inset-0 overflow-y-auto bg-ink p-gutter">
          <h1 className="font-display text-display uppercase text-paper">
            same two people. six ways to meet.
          </h1>
          <p className="mt-4 max-w-[46ch] font-editorial text-lede text-paper/70">
            FIRST SCENE is an interactive stage: the same synthetic pair is placed in six
            different first-date settings, and the interface physically resists the ones that
            do not work. It needs JavaScript to run.
          </p>
          <p className="mt-6 max-w-[46ch] font-editorial text-paper/60">
            The thesis, without the interaction: the right person can still get the wrong first
            date. A match is a pair <em>under conditions</em>.
          </p>
          <PrototypeDisclosure className="mt-10" />
        </div>
      </noscript>
    </main>
  );
}
