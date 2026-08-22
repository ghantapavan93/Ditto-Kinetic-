'use client';

import { useMemo, useSyncExternalStore } from 'react';
import qrcode from 'qrcode-generator';
import { useCoarsePointer } from './useReducedMotion';

/**
 * Hydration-safe "am I on the client" — the server snapshot is false, the
 * client snapshot true, and useSyncExternalStore reconciles the two without a
 * mismatch or an effect. The QR depends on `location`, which only exists on
 * one side of that line.
 */
const noopSubscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * The handoff to the phone.
 *
 * This piece argues that a first date belongs on a phone and then, mostly, in
 * a pocket — but the person reviewing it is at a desk. The QR is the bridge:
 * one small paper print in the menu that moves the whole artifact onto the
 * device it was composed for, with no URL to retype.
 *
 * Drawn, not embedded. The encoder is qrcode-generator — zero dependencies,
 * the same single-file library half the web's QR tags trace back to — and the
 * modules are rendered as one SVG path in the site's own ink-on-paper, so the
 * code is an artifact of this world rather than a black-and-white sticker
 * pasted onto it. No image file enters the repo.
 *
 * Client-only by necessity: the encoded URL is read from `location` at mount,
 * so the print always points at wherever this build is actually being viewed
 * — localhost in development, the deployment on Vercel. Hidden on coarse
 * pointers, where the reader is already holding the destination.
 */
export function PhoneQR({ className = '' }: { className?: string }) {
  const coarse = useCoarsePointer();
  const isClient = useIsClient();

  const code = useMemo(() => {
    if (!isClient || coarse) return null;
    const qr = qrcode(0, 'M');
    qr.addData(window.location.origin);
    qr.make();

    const n = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { modules: n, path: d };
  }, [isClient, coarse]);

  if (!code) return null;

  return (
    <figure className={`w-fit ${className}`}>
      <div className="u-paper rounded-artifact p-2" style={{ transform: 'rotate(-1.6deg)' }}>
        <svg
          viewBox={`0 0 ${code.modules} ${code.modules}`}
          className="block h-[84px] w-[84px]"
          role="img"
          aria-label="QR code for this site"
          shapeRendering="crispEdges"
        >
          <path d={code.path} fill="#141210" />
        </svg>
      </div>
      <figcaption className="mt-1.5 text-center font-hand text-[0.95rem] leading-tight text-paper/62">
        open it on your phone
      </figcaption>
    </figure>
  );
}
