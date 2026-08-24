'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * A title card, not a loading screen.
 *
 * Somebody who receives a deep link lands mid-argument: /gravity with no
 * context is physics with no caption. So each flagship route opens on two
 * seconds of black and one line set like a film title — the page's thesis,
 * before the page — then gets out of the way.
 *
 * Three exits, all honoured: it dismisses itself after a beat, any input
 * skips it instantly, and it plays once per session per route
 * (sessionStorage — nothing leaves the browser). Under reduced motion it
 * never mounts: a page that opens on an animation is exactly what that
 * preference declined.
 */
export function ColdOpen({
  k,
  lines,
  voice,
}: {
  /** Session key — one showing per route per visit. */
  k: string;
  /** Display-face lines. May be empty when `voice` carries the card alone. */
  lines: string[];
  /** Optional serif line under (or instead of) the display lines. */
  voice?: string;
}) {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduced) return;
    try {
      if (window.sessionStorage.getItem(`fs-cold-${k}`)) return;
    } catch {
      /* private mode still gets the card, just possibly twice */
    }
    /*
     * A beat late on purpose: the timer keeps the server render and the first
     * client render identical (no hydration seam) and keeps state changes out
     * of the effect body. A timer rather than rAF because rAF never fires in
     * a background tab — and the once-flag burns only when the card actually
     * mounts, so opening a link in a background tab doesn't silently spend
     * the one showing before anyone looks.
     */
    const mountT = setTimeout(() => {
      try {
        window.sessionStorage.setItem(`fs-cold-${k}`, '1');
      } catch {
        /* same private-mode shrug as above */
      }
      setShow(true);
    }, 40);
    const t = setTimeout(() => setShow(false), 2500);
    const skip = () => setShow(false);
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      clearTimeout(mountT);
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
    };
  }, [k, reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cold"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          onPointerDown={() => setShow(false)}
          className="u-stack-grain fixed inset-0 z-disclosure flex flex-col items-start justify-center bg-ink px-gutter"
          role="presentation"
        >
          <div className="max-w-[44rem]">
            {lines.map((line, i) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.16, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[clamp(2.2rem,7vw,4.8rem)] uppercase leading-[0.92] text-paper"
              >
                {line}
              </motion.p>
            ))}
            {voice && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + lines.length * 0.16, duration: 0.6 }}
                className={`font-voice italic leading-snug text-paper/75 ${
                  lines.length ? 'mt-4 text-[clamp(1.1rem,2.6vw,1.5rem)]' : 'text-[clamp(1.4rem,3.4vw,2.1rem)]'
                }`}
              >
                {voice}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
