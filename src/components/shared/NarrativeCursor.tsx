'use client';

import { useEffect, useRef, useState } from 'react';
import { useCoarsePointer, useReducedMotion } from './useReducedMotion';

/**
 * The cursor says what the thing under it is for.
 *
 * Not a decorative blob that trails the pointer — a label that changes with
 * region, so the pointer itself carries a little of the narration the interface
 * otherwise refuses to write down. "come closer" over the photographs, "change
 * the night" over the dial, "hmm..." over the uncertainty note.
 *
 * Any element can claim one with `data-cursor="…"`. Suppressed entirely on
 * touch devices, where there is no cursor to narrate, and under reduced motion,
 * where a thing chasing the pointer is exactly what was opted out of.
 */
export function NarrativeCursor() {
  const coarse = useCoarsePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (coarse || reduced) return;

    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      setLabel(el ? el.getAttribute('data-cursor') : null);
    };

    const tick = () => {
      // A touch of lag, so the label feels like it is following rather than
      // welded to the pointer.
      current.x += (target.x - current.x) * 0.28;
      current.y += (target.y - current.y) * 0.28;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', () => setDown(true));
    window.addEventListener('pointerup', () => setDown(false));
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [coarse, reduced]);

  if (coarse || reduced) return null;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-disclosure will-change-transform"
    >
      <span
        className={`absolute -left-[3px] -top-[3px] block h-1.5 w-1.5 rounded-full bg-paper transition-transform duration-tick ${
          down ? 'scale-[2.2]' : label ? 'scale-[1.6]' : 'scale-100'
        }`}
      />
      <span
        className={`absolute left-3.5 top-2 whitespace-nowrap font-mono text-micro uppercase text-paper/70 transition-opacity duration-tick ${
          label ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
