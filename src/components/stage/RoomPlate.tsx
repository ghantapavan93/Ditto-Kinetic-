'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Scene } from '@/lib/types';

/**
 * A photograph of the room, if one exists.
 *
 * This project ships no image assets, and that is deliberate — everything is
 * procedural, and the site works completely without a single file. So this is
 * written the only way that keeps that true: it *attempts* a load, and if the
 * file is not there it renders nothing and says nothing. No console noise, no
 * layout shift, no placeholder.
 *
 * Which means the six plates can be dropped into `public/rooms/` at any point
 * and they simply appear. Nothing needs wiring afterwards, and deleting them
 * later returns the stage to exactly what it is today.
 *
 * Held far back on purpose. The room is the argument, not the wallpaper: at 18%
 * behind a temperature wash, a plate reads as the place the evening is in
 * rather than as a photograph somebody chose. Any brighter and it competes with
 * two people and a headline, which are what the frame is actually for.
 *
 * Keyed by `scene.id`, so the filename is the room: coffee, mission, gallery,
 * postshow, group, study.
 */
/**
 * What the ranking has decided about the room the plate depicts. The
 * photograph participates in the logic instead of decorating it: the winner
 * develops, a room under the send bar stays washed out, and a room whose
 * venue broke overexposes into a ghost — the image of a place that stopped
 * being available tonight.
 */
export type PlateState = 'winner' | 'possible' | 'under' | 'lost';

const PLATE_LOOK: Record<PlateState, { opacity: number; filter: string }> = {
  winner: { opacity: 0.3, filter: 'saturate(0.8) contrast(0.96)' },
  possible: { opacity: 0.18, filter: 'saturate(0.65) contrast(0.9)' },
  under: { opacity: 0.11, filter: 'saturate(0.3) contrast(0.82) brightness(1.12)' },
  lost: { opacity: 0.07, filter: 'saturate(0.1) contrast(0.6) brightness(1.55)' },
};

export function RoomPlate({
  scene,
  state = 'possible',
  reducedMotion,
}: {
  scene: Scene;
  state?: PlateState;
  reducedMotion: boolean;
}) {
  // The set of srcs known to exist, rather than a boolean or a single value.
  //
  // Both simpler shapes were bugs. A boolean needed a reset inside the effect,
  // which the compiler's cascading-render rule rejects. A single "last loaded"
  // value showed the previous room's plate on a room with no file — switching
  // coffee → mission left `loaded` at coffee's src, and the probe for the
  // missing mission file never resolves to correct it. A set has no stale
  // state to show: the render condition asks about the current room only.
  const [known, setKnown] = useState<ReadonlySet<string>>(new Set());
  const src = `/rooms/${scene.id}.webp`;

  // Probing with an Image rather than rendering an <img> and hiding it on error
  // keeps a broken request from ever touching the layout, and lets the fade in
  // start from a known state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already proven to exist: nothing to do, and no state write either.
    if (known.has(src)) return;

    const probe = new window.Image();
    let cancelled = false;
    probe.onload = () => {
      if (!cancelled) setKnown((prev) => new Set(prev).add(src));
    };
    probe.src = src;

    return () => {
      cancelled = true;
      probe.onload = null;
    };
  }, [src, known]);

  if (!known.has(src)) return null;

  return (
    <motion.div
      key={src}
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: PLATE_LOOK[state].opacity }}
      transition={{ duration: reducedMotion ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-0 transition-[filter] duration-scene"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: PLATE_LOOK[state].filter,
      }}
    />
  );
}
