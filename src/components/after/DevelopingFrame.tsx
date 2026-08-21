'use client';

import { useEffect, useRef } from 'react';
import { drawPortrait } from '@/lib/portrait';
import type { Person } from '@/lib/types';

/**
 * A disposable-camera frame, developing.
 *
 * The develop is done with `filter`, not `opacity`. A fade means the image was
 * never there and is being mixed in; brightness and contrast coming up from
 * nothing means the image was always there and is becoming visible — which is
 * both what actually happens chemically and, more usefully, what it feels like
 * to remember an evening rather than be shown one.
 *
 * Same procedural portrait as the stage, so the person on this page is provably
 * the person from that one. Nobody is depicted: see `lib/portrait.ts`.
 */
export function DevelopingFrame({
  person,
  progress,
  caption,
}: {
  person: Person;
  /** 0 blank, 1 fully developed. */
  progress: number;
  caption: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawPortrait(ctx, person.portraitSeed, person.portraitTint);
  }, [person.portraitSeed, person.portraitTint]);

  const p = Math.min(1, Math.max(0, progress));

  return (
    <figure
      className="u-paper w-[min(17rem,68vw)] rounded-artifact p-2.5 pb-10"
      style={{ transform: 'rotate(-1.6deg)' }}
    >
      <div className="relative overflow-hidden bg-[#0B0907]">
        <canvas
          ref={canvas}
          width={512}
          height={640}
          className="block h-auto w-full"
          style={{
            // Chemistry, not compositing.
            filter: `brightness(${0.05 + p * 0.95}) contrast(${0.35 + p * 0.75}) saturate(${p})`,
            transition: 'filter 120ms linear',
          }}
        />
        {/* the emulsion still settling */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: '#0B0907',
            opacity: (1 - p) * 0.55,
            transition: 'opacity 120ms linear',
          }}
        />
      </div>

      <figcaption
        className="mt-3 px-1 font-hand text-[1.05rem] leading-none text-ink/62"
        style={{ opacity: Math.max(0, p * 1.4 - 0.4), transition: 'opacity 300ms ease' }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
