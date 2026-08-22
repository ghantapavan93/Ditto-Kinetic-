import { ImageResponse } from 'next/og';

/**
 * The home-screen icon. Same dial mark as icon.tsx, drawn tighter: iOS rounds
 * the corners itself and renders at 180px, so the strokes are proportionally
 * heavier and the canvas is square-edged. See icon.tsx for why the mark is the
 * dial and why it is generated instead of shipped.
 */
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const INK = '#0B0907';
const PAPER = '#F5EFE3';
const ACID = '#FF2E88';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: INK,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 118,
            height: 118,
            borderRadius: '50%',
            border: `8px solid ${PAPER}99`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -22,
              left: 51,
              width: 16,
              height: 32,
              borderRadius: 8,
              background: ACID,
            }}
          />
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: PAPER,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
