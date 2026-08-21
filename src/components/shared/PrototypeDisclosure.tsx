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
      <p className={`font-mono text-label leading-relaxed text-paper/55 ${className}`}>
        <span className="sm:hidden">Unofficial concept. Synthetic people.</span>
        <span className="hidden sm:inline">
          Unofficial Ditto interaction concept. Synthetic people and simulated signals.
          <br className="hidden lg:block" /> No access to Ditto systems.
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
