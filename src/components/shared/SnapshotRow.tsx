import { PHOTOS, type Photo } from '@/data/photoManifest';

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

  if (photos.length === 0) return null;

  return (
    <figure aria-hidden className={`flex flex-wrap items-start gap-x-5 gap-y-4 ${className}`}>
      {photos.map((photo, i) => {
        const portrait = photo.h > photo.w;
        return (
          <div
            key={photo.src}
            className="u-paper shrink-0 rounded-artifact p-1.5 pb-5"
            style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
          >
            {facedown ? (
              <div
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
