'use client';

import { useState } from 'react';
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
export function GlobalMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-cursor="see all of it"
        className="fixed bottom-3 right-3 z-overlay border border-paper/25 bg-ink/85 px-3 py-2 font-mono text-micro uppercase text-paper/70 backdrop-blur-sm transition-colors hover:border-paper/50 hover:text-paper"
      >
        everything
      </button>
      <SiteMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
