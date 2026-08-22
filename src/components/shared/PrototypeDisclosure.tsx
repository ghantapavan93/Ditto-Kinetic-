'use client';

/**
 * Required disclosure. Present on every screen, never dominant.
 *
 * It stays legible rather than hiding, because the honesty is part of what the
 * piece is arguing: a system that communicates uncertainty about a date should
 * not be coy about its own provenance. For a long time that sentence was false
 * twice over -- it shipped at 2.23:1, and on the stage it carried `hidden
 * lg:block`, so on every phone the one line naming this as unofficial was not
 * drawn at all.
 *
 * `compact` exists for the second of those. The stage's bottom edge is crowded
 * on a small screen, which is presumably why somebody hid it rather than
 * placed it. A shorter sentence fits; not saying it does not.
 *
 * Compact is now one short line at every width. The two-line desktop variant
 * sat mid-air over the stage's right side and read as interface rather than
 * colophon — it competed with the dial it floated next to. The full sentence
 * still opens the site (the intro) and closes the index (the menu); on the
 * stage itself the fact only has to be present, not loud.
 */
export function PrototypeDisclosure({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className={`font-mono text-micro leading-relaxed text-paper/55 ${className}`}>
        <span className="sm:hidden">unofficial concept &middot; synthetic people</span>
        <span className="hidden sm:inline">
          unofficial concept &middot; synthetic people &middot; no access to ditto systems
        </span>
      </p>
    );
  }

  return (
    <p className={`font-mono text-label leading-relaxed text-paper/55 ${className}`}>
      Unofficial Ditto interaction concept. Synthetic people and simulated signals.
      <br className="hidden sm:block" /> No access to Ditto systems.
    </p>
  );
}
