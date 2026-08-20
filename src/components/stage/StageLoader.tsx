'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary for the stage.
 *
 * The canvas and the whole interaction layer are client-only — there is no
 * server-rendered version of a WebGL stage worth having, and forcing one just
 * produces a hydration mismatch on every pointer-driven transform.
 *
 * This wrapper exists because `next/dynamic` with `ssr: false` is not permitted
 * from a Server Component in Next 16. Keeping the boundary here rather than
 * marking the whole page as client means the `<noscript>` fallback in
 * `page.tsx` is still server-rendered, so the page has real content before any
 * JavaScript arrives.
 */
const FirstSceneStage = dynamic(
  () => import('./FirstSceneStage').then((m) => m.FirstSceneStage),
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

export function StageLoader() {
  return <FirstSceneStage />;
}
