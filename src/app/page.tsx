import dynamic from 'next/dynamic';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';

/**
 * The canvas and the whole interaction layer are client-only — there is no
 * server-rendered version of a WebGL stage worth having, and forcing one just
 * produces a hydration mismatch on every pointer-driven transform.
 *
 * What *is* server-rendered is the noscript-grade fallback below, so the page
 * has real content before any JavaScript arrives.
 */
const FirstSceneStage = dynamic(
  () => import('@/components/stage/FirstSceneStage').then((m) => m.FirstSceneStage),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-ink px-gutter">
        <p className="font-display text-hero uppercase leading-[0.86] text-paper/12">first scene</p>
        <p className="font-mono text-micro uppercase text-paper/30">loading the stage…</p>
      </div>
    ),
  },
);

export default function Page() {
  return (
    <main>
      <FirstSceneStage />

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
