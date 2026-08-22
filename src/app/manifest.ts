import type { MetadataRoute } from 'next';

/**
 * Web app manifest.
 *
 * Ditto's site is installable, and this is a full-viewport, chrome-less,
 * single-surface experience — which is exactly the shape a manifest is for.
 * `fullscreen` rather than `standalone`: the stage assumes it owns the whole
 * viewport, and a status bar over the top of it costs a visible band of the
 * composition on every phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FIRST SCENE — same two people, six ways to meet',
    short_name: 'First Scene',
    description:
      'An unofficial Ditto interaction concept. The right person can still get the wrong first date.',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#0B0907',
    theme_color: '#0B0907',
    categories: ['lifestyle', 'social'],
    /*
     * Without icons a manifest fails Chrome's installability audit outright —
     * "fullscreen" display was being promised by a manifest no browser would
     * act on. Both entries are the generated dial-mark routes (icon.tsx,
     * apple-icon.tsx); nothing binary enters the repo.
     */
    icons: [
      // Extension-less: this Next version serves metadata image routes at
      // /icon and /apple-icon (hash query only in the injected <link>).
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
