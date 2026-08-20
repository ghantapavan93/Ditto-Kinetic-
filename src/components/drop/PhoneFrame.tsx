'use client';

import { motion } from 'framer-motion';

/**
 * The frame the match arrives in, and then leaves.
 *
 * A Wednesday match is delivered as a notification, and a notification is a
 * phone-shaped object: narrow, glanced at, one of forty that day. That framing
 * is doing real damage to the thing inside it — the same words that read as an
 * evening at full size read as an alert at 380px, because the container is most
 * of what tells you how much something matters.
 *
 * So the page shows the frame honestly and then breaks it. The match arrives in
 * a device: bezel, notch, status bar, the whole apparatus. When it lands, the
 * apparatus does not fade out politely — the bezel thins to nothing, the corner
 * radius unwinds, and the content reflows out to the full viewport. What you
 * were reading as a notification finishes as a room.
 *
 * The width is animated rather than the scale, which is the decision that makes
 * this work. Scaling a phone-sized screenshot up is a zoom, and a zoom just
 * makes a notification into a large notification — the text stays laid out for
 * a phone. Animating the container's width forces a genuine reflow: lines
 * lengthen, the headline finds its real size, and the layout becomes a desktop
 * layout in front of you. Blurrier for a few frames, and the only version that
 * says the content outgrew the thing it came in.
 */
export function PhoneFrame({
  escaped,
  reducedMotion,
  children,
}: {
  escaped: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const duration = reducedMotion ? 0 : 1.15;

  return (
    <motion.div
      animate={{
        maxWidth: escaped ? '52rem' : '23rem',
        borderRadius: escaped ? 2 : 42,
        borderWidth: escaped ? 0 : 9,
        paddingTop: escaped ? 0 : 34,
        paddingBottom: escaped ? 0 : 22,
        paddingLeft: escaped ? 0 : 18,
        paddingRight: escaped ? 0 : 18,
      }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full border-ink bg-transparent"
      style={{ borderStyle: 'solid' }}
    >
      {/*
        The apparatus. Every part of it is the argument — it is what makes the
        first read "a notification" — so all of it has to leave, and it leaves
        faster than the frame opens so the content is never competing with a
        notch that is still fading.
      */}
      <motion.div
        aria-hidden
        animate={{ opacity: escaped ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-x-0 top-0"
      >
        <div className="relative mx-auto h-[34px] w-full">
          {/* notch */}
          <div className="absolute left-1/2 top-[7px] h-[22px] w-[104px] -translate-x-1/2 rounded-full bg-ink" />
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-[11px]">
            <span className="font-mono text-[0.58rem] tabular-nums text-paper/45">7:00</span>
            <span className="flex items-center gap-1">
              <span className="block h-[7px] w-[3px] rounded-[1px] bg-paper/40" />
              <span className="block h-[9px] w-[3px] rounded-[1px] bg-paper/40" />
              <span className="block h-[11px] w-[3px] rounded-[1px] bg-paper/25" />
              <span className="ml-1 block h-[9px] w-[16px] rounded-[2px] border border-paper/35" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* the glass edge, which is the only part that reads as a real device */}
      <motion.div
        aria-hidden
        animate={{ opacity: escaped ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.5 }}
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 34,
          boxShadow:
            'inset 0 1px 0 rgba(244,237,228,0.14), inset 0 0 40px rgba(0,0,0,0.55), 0 24px 60px rgba(0,0,0,0.5)',
        }}
      />

      {/* home indicator */}
      <motion.div
        aria-hidden
        animate={{ opacity: escaped ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className="pointer-events-none absolute bottom-[9px] left-1/2 h-[3px] w-[110px] -translate-x-1/2 rounded-full bg-paper/25"
      />

      <div className="relative">{children}</div>
    </motion.div>
  );
}
