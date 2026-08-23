'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll } from 'framer-motion';

/**
 * A two-pixel acid hairline along the top of any page that scrolls, scaled by
 * how far through it you are — the one Motion scroll-linked pattern this site
 * had no equivalent of. The long reads (/ending, /next, /attention) gave no
 * sense of their own length; now the length is a line.
 *
 * Renders nothing on pages that fit the viewport, which includes every fixed
 * stage — measured on mount and on resize rather than assumed from the route,
 * so the component needs no map of which pages scroll.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const measure = () =>
      setScrollable(document.documentElement.scrollHeight > window.innerHeight + 64);
    measure();
    window.addEventListener('resize', measure);
    // Client navigations swap the page body under this component.
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: false });
    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  if (!scrollable) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-disclosure h-[2px] origin-left bg-acid"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
