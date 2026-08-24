import { StageLoader } from '@/components/stage/StageLoader';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

export default function Page() {
  return (
    <main>
      {/*
        The poster starts fetching with the HTML, so the opening frame is
        painted before the client bundle arrives. The film itself is NOT
        preloaded here: the client picks between two renditions by
        connection quality, and a hardcoded preload of the 1080p grade
        would force 13MB onto exactly the connections that chose the light
        one. The video element's own preload="auto" starts the right fetch
        the moment the stage mounts.
      */}
      <link rel="preload" href="/film/exports/intro-first.webp" as="image" />

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
