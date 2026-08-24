'use client';

import { useEffect, useRef } from 'react';
import { PHOTOS, type Photo } from '@/data/photoManifest';
import { useCoarsePointer, useReducedMotion } from './useReducedMotion';

/**
 * A short row of photographs, placed in the flow of a page.
 *
 * The site's imagery used to live almost entirely on /moments — one page held
 * every photograph and the rest of the site held none, so the reel read as a
 * gallery bolted onto a text site rather than as the site's own memory
 * surfacing where it was relevant. This component is the redistribution: each editorial page
 * names the two or three frames that belong to *its* argument, and the row
 * renders them as small taped prints with a handwritten margin note.
 *
 * In-flow rather than fixed on purpose. A fixed corner polaroid collides with
 * something on some page at some width — these pages run columns from 52 to
 * 70rem, so there is no margin that is reliably empty. In the flow it costs a
 * band of vertical space and can never sit on top of a control.
 *
 * Decorative by contract: `alt=""` and `aria-hidden`, because every photograph
 * here is a synthetic mood image, not information. The note carries the only
 * words, and it repeats what the page already says.
 */

const BY_SRC = new Map(PHOTOS.map((p) => [p.src, p]));

/** Tape angles cycle rather than randomize, so SSR and client agree. */
const ROTATIONS = ['-1.6deg', '1.2deg', '-0.8deg'];

export function SnapshotRow({
  srcs,
  note,
  facedown = false,
  className = '',
}: {
  /** Paths into public/photos, in display order. Unknown paths are skipped. */
  srcs: string[];
  /** The handwritten margin note. Keep it under a sentence. */
  note?: string;
  /**
   * Render the prints face-down: paper backs, no image. For pages about
   * what is kept rather than shown — the photograph exists, and you don't
   * get to see it, which is the entire point of the page saying so.
   */
  facedown?: boolean;
  className?: string;
}) {
  const photos = srcs
    .map((src) => BY_SRC.get(src))
    .filter((p): p is Photo => p !== undefined);

  const rowRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();

  /*
   * The darkroom. Prints start undeveloped (see .u-develop) and finish the
   * first time the row enters the viewport — a photograph developing because
   * somebody came to look at it. Observed once, then left alone; the server
   * renders prints already-developed so a no-JS reader never sees the wash,
   * and the class that arms development is only added here, on the client.
   */
  useEffect(() => {
    const row = rowRef.current;
    if (!row || reduced) return;
    const imgs = row.querySelectorAll('img, [data-facedown]');
    imgs.forEach((el) => el.classList.add('u-develop'));
    const develop = () => {
      row.querySelectorAll('.u-develop').forEach((el, k) => {
        window.setTimeout(() => el.classList.add('is-developed'), k * 180);
      });
      io.disconnect();
      window.clearTimeout(fallback);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) develop();
      },
      { threshold: 0.35 },
    );
    io.observe(row);
    /*
     * The guarantee under the effect: if the observer never reports — an
     * ancient browser, a throttled background tab, anything — the print
     * develops anyway after a beat. The wash is a reward for looking, and a
     * reward must never be able to become a permanent state.
     */
    const fallback = window.setTimeout(develop, 3200);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [reduced]);

  /*
   * Paper under a light. Fine pointers tilt a print a few degrees toward the
   * cursor — enough that the paper reads as held rather than printed on the
   * page, never enough to become an effect. Touch and reduced motion opt out
   * entirely; the transform runs through rAF so a busy pointermove stream
   * costs one write per frame.
   */
  useEffect(() => {
    const row = rowRef.current;
    if (!row || reduced || coarse) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest?.('[data-print]') as HTMLElement | null;
      if (!card) return;
      const b = card.getBoundingClientRect();
      const rx = ((e.clientY - b.top) / b.height - 0.5) * -7;
      const ry = ((e.clientX - b.left) / b.width - 0.5) * 8;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `${card.dataset.rest ?? ''} perspective(600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    };
    const onLeave = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest?.('[data-print]') as HTMLElement | null;
      if (!card) return;
      cancelAnimationFrame(raf);
      card.style.transform = card.dataset.rest ?? '';
    };
    row.addEventListener('pointermove', onMove);
    row.addEventListener('pointerout', onLeave);
    return () => {
      row.removeEventListener('pointermove', onMove);
      row.removeEventListener('pointerout', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, coarse]);

  if (photos.length === 0) return null;

  return (
    <figure
      ref={rowRef}
      aria-hidden
      className={`flex flex-wrap items-start gap-x-5 gap-y-4 ${className}`}
    >
      {photos.map((photo, i) => {
        const portrait = photo.h > photo.w;
        return (
          <div
            key={photo.src}
            data-print
            data-rest={`rotate(${ROTATIONS[i % ROTATIONS.length]})`}
            className="u-paper shrink-0 rounded-artifact p-1.5 pb-5 transition-transform duration-tick will-change-transform"
            style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
          >
            {facedown ? (
              <div
                data-facedown
                className={`flex items-end justify-end rounded-[1px] bg-[#E8E0CF] p-2 ${
                  portrait ? 'w-[clamp(6rem,14vw,8.5rem)]' : 'w-[clamp(9rem,20vw,13rem)]'
                }`}
                style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
              >
                <span className="font-hand text-[0.95rem] leading-none text-ink/62">kept.</span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- decorative,
                 pre-sized webp under 120KB; next/image adds a loader round-trip
                 for no visible gain at this size. */
              <img
                src={photo.src}
                alt=""
                loading="lazy"
                decoding="async"
                width={photo.w}
                height={photo.h}
                className={`block rounded-[1px] object-cover ${
                  portrait ? 'w-[clamp(6rem,14vw,8.5rem)]' : 'w-[clamp(9rem,20vw,13rem)]'
                } h-auto`}
              />
            )}
          </div>
        );
      })}
      {note && (
        <figcaption className="mt-2 max-w-[16ch] font-hand text-[1.15rem] leading-tight text-paper/60">
          {note}
        </figcaption>
      )}
    </figure>
  );
}
