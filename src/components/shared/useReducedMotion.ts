'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Media queries as an external store.
 *
 * The obvious implementation — `useState` seeded in an effect — double-renders
 * on mount and is exactly what `react-hooks/set-state-in-effect` exists to
 * catch. `matchMedia` is a subscribable source that already lives outside
 * React, so `useSyncExternalStore` is the honest shape: no effect, no
 * intermediate wrong value, and a defined server snapshot.
 */
function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * Reduced motion is treated as a product mode, not an accessibility patch.
 * Everything still changes state — objects arrive at their positions instead of
 * travelling to them, and the idle unrest that expresses "this scene has not
 * settled" is replaced by static offset.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True on coarse-pointer devices. Used to drop hover-only affordances. */
export function useCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)');
}
