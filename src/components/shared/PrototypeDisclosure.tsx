'use client';

/**
 * Required disclosure. Present on every screen, never dominant.
 *
 * It stays legible rather than hiding at 4% opacity, because the honesty is
 * part of what the piece is arguing: a system that communicates uncertainty
 * about a date should not be coy about its own provenance.
 */
export function PrototypeDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`font-mono text-micro leading-relaxed text-paper/28 ${className}`}>
      Unofficial Ditto interaction concept. Synthetic people and simulated signals.
      <br className="hidden sm:block" /> No access to Ditto systems.
    </p>
  );
}
