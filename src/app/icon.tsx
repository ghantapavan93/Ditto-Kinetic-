import { ImageResponse } from 'next/og';

/**
 * The favicon, generated rather than shipped.
 *
 * Until this file existed the site had no icon at all — every tab showed the
 * browser's default globe and every visit logged a 404 for /favicon.ico,
 * /icon.png and /apple-touch-icon.png. For a project whose whole argument is
 * made of small honest details, the blank tab was the one detail visibly
 * missing.
 *
 * The mark is the scene dial, because that is the one control the entire
 * experience hangs off: the ring, the acid detent at twelve o'clock, the paper
 * hub. Drawn from the same palette tokens the stage uses, in pure divs — no
 * font loading, no binary asset, consistent with a repo that ships no images
 * it did not generate.
 *
 * 512px, not 32: browsers downscale a large favicon cleanly, and one size this
 * big lets the manifest reuse the route as its installability icon.
 */
export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

const INK = '#0B0907';
const PAPER = '#F5EFE3';
const ACID = '#FF2E88';

export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        {/* the ring */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 340,
            height: 340,
            borderRadius: '50%',
            border: `18px solid ${PAPER}99`,
            position: 'relative',
          }}
        >
          {/* the detent, twelve o'clock */}
          <div
            style={{
              position: 'absolute',
              top: -58,
              left: 150,
              width: 40,
              height: 84,
              borderRadius: 20,
              background: ACID,
            }}
          />
          {/* the hub */}
          <div
            style={{
              width: 96,
              height: 96,
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
