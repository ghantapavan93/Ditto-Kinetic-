'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { SiteMenu } from './SiteMenu';

/**
 * The door that is always there.
 *
 * The full index used to open from exactly two places: a button on the stage,
 * and ⌘K — one gated behind the stage's progressive reveal, the other behind
 * owning a keyboard. A reviewer who lands on /odds from a shared link, on a
 * phone, had no way to see any other surface short of editing the
 * URL. That is the opposite of how this site wants to be read.
 *
 * One quiet chip, fixed bottom-right on every page except the stage (which
 * has its own door in the chrome), opening the same SiteMenu the stage uses —
 * one list, three doors now, still impossible for them to disagree.
 */
const seenStore = {
  count: 0,
  listeners: new Set<() => void>(),
  visit(path: string) {
    try {
      const raw = window.sessionStorage.getItem('fs-seen');
      const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
      set.add(path);
      window.sessionStorage.setItem('fs-seen', JSON.stringify([...set]));
      if (set.size !== seenStore.count) {
        seenStore.count = set.size;
        seenStore.listeners.forEach((l) => l());
      }
    } catch {
      /* private mode: the chip just says "everything" */
    }
  },
  subscribe(cb: () => void) {
    seenStore.listeners.add(cb);
    return () => seenStore.listeners.delete(cb);
  },
  read: () => seenStore.count,
};

export function GlobalMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /*
   * Spatial memory, kept in the visitor's pocket. Each route visited joins a
   * sessionStorage set — nothing leaves the browser, nothing persists past
   * the tab — and the chip quietly reports how much of the world has been
   * seen. Not points, not homework: just "you've seen six pieces of this."
   * The count lives in a tiny external store (sessionStorage is the external
   * system), so the effect only tells it about the visit and re-rendering
   * happens through subscription rather than a setState inside the effect.
   */
  useEffect(() => {
    seenStore.visit(pathname);
  }, [pathname]);
  const seen = useSyncExternalStore(seenStore.subscribe, seenStore.read, () => 0);

  // The stage has its own door in the chrome; the cinema must stay pure —
  // /film points back into the product from the poster, the ending and the
  // cut, and a floating chip over a playing film is exactly the interface
  // the film argues against.
  if (pathname === '/' || pathname === '/film') return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-cursor="see all of it"
        className="fixed bottom-3 right-3 z-overlay border border-paper/25 bg-ink/85 px-3 py-2 font-mono text-micro uppercase text-paper/70 backdrop-blur-sm transition-colors hover:border-paper/50 hover:text-paper"
      >
        everything{seen > 1 ? ` \u00b7 ${seen} seen` : ''}
      </button>
      <SiteMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
