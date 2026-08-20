import { ImageResponse } from 'next/og';

/**
 * Edge runtime is required, not preferred: under the Node runtime `@vercel/og`
 * resolves its bundled fonts through `fileURLToPath`, which throws on any
 * project path containing a space (this one has two). The build warns that edge
 * disables static generation for this route — that is fine for an OG card,
 * which is fetched once by a crawler and then cached by the platform.
 */
export const runtime = 'edge';
export const alt = 'FIRST SCENE — same two people, six ways to meet';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Open Graph card, composed from the hero beat rather than a logo.
 *
 * Two offset cards with a slack line between them: the same read the stage
 * gives you in the first second, at thumbnail size.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'radial-gradient(110% 85% at 30% 24%, rgba(43,68,255,0.30), transparent 58%), radial-gradient(90% 70% at 84% 78%, rgba(255,46,136,0.18), transparent 60%), #08090C',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F2EEE3' }}>
          <span style={{ fontSize: 22, letterSpacing: 6, opacity: 0.6 }}>WED 7:00 PM</span>
          <span style={{ fontSize: 22, letterSpacing: 6, opacity: 0.35 }}>DITTO // FIRST SCENE</span>
        </div>

        {/* two cards, misaligned, with a slack connection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 90 }}>
          {[
            { rot: -7, tint: 'rgba(255,46,136,0.45)' },
            { rot: 5, tint: 'rgba(43,68,255,0.5)' },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: 190,
                height: 232,
                padding: 12,
                paddingBottom: 40,
                background: '#F4F1E8',
                transform: `rotate(${card.rot}deg)`,
                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(120% 90% at 32% 22%, ${card.tint}, #12151E 62%, #05060A)`,
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', color: '#F2EEE3' }}>
          <span style={{ fontSize: 78, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
            same two people.
          </span>
          <span style={{ fontSize: 40, color: '#FF2E88', marginTop: 10 }}>six ways to meet.</span>
          <span style={{ fontSize: 19, opacity: 0.4, marginTop: 22 }}>
            Unofficial Ditto interaction concept. Synthetic people and simulated signals.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
